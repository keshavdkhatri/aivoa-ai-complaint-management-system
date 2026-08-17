import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from ..db.database import get_db
from ..db.models import ComplaintModel
from ..schemas.schemas import (
    ComplaintCreate,
    ComplaintResponse,
    ExtractionRequest,
    ExtractionResponse,
    ChatRequest,
    ChatResponse,
    ComplaintBase
)
from ..agents.workflow import compiled_extract_graph, compiled_chat_graph
from pypdf import PdfReader

router = APIRouter()

# Helper function to extract text from digital PDF bytes
def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    try:
        pdf_file = io.BytesIO(pdf_bytes)
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to parse PDF document text: {str(e)}"
        )

@router.post("/extract", response_model=ExtractionResponse)
def extract_text(request: ExtractionRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Complaint text cannot be empty.")
        
    # Execute LangGraph extraction workflow
    inputs = {
        "raw_text": request.text,
        "chat_history": [],
        "current_form": {},
        "updated_fields": {},
        "agent_reply": "",
        "error": ""
    }
    
    result = compiled_extract_graph.invoke(inputs)
    
    # Return formatted schema fields
    fields_data = result.get("current_form", {})
    return ExtractionResponse(
        success=True,
        fields=ComplaintBase(**fields_data),
        message=result.get("agent_reply", "")
    )

@router.post("/upload-pdf", response_model=ExtractionResponse)
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File size exceeds the 10MB limit.")
        
    # Extract raw text content from the PDF uploader
    raw_text = extract_text_from_pdf(content)
    if not raw_text:
        raise HTTPException(
            status_code=400, detail="No readable text found inside the PDF."
        )
        
    # Run text through extraction workflow
    inputs = {
        "raw_text": raw_text,
        "chat_history": [],
        "current_form": {},
        "updated_fields": {},
        "agent_reply": "",
        "error": ""
    }
    
    result = compiled_extract_graph.invoke(inputs)
    
    fields_data = result.get("current_form", {})
    return ExtractionResponse(
        success=True,
        fields=ComplaintBase(**fields_data),
        message=f"Text extracted from PDF '{file.filename}' and analyzed successfully."
    )

@router.post("/chat", response_model=ChatResponse)
def copilot_chat(request: ChatRequest):
    # Convert incoming ChatMessage schemas to dictionary lists for agent state
    chat_history_dicts = []
    for msg in request.history:
        chat_history_dicts.append({
            "role": msg.role,
            "content": msg.content
        })
        
    inputs = {
        "raw_text": "",
        "message": request.message,
        "chat_history": chat_history_dicts,
        "current_form": request.current_form.dict(),
        "updated_fields": {},
        "agent_reply": "",
        "error": ""
    }
    
    # Execute LangGraph conversational correction node
    result = compiled_chat_graph.invoke(inputs)
    
    return ChatResponse(
        reply=result.get("agent_reply", "I've processed your command."),
        updated_fields=result.get("updated_fields", {})
    )

@router.post("/save", response_model=ComplaintResponse)
def save_complaint(complaint: ComplaintCreate, db: Session = Depends(get_db)):
    try:
        # Create a database model row
        db_complaint = ComplaintModel(
            # Section 1
            complaint_source=complaint.complaint_source,
            customer_name=complaint.customer_name,
            # Section 2
            product_name=complaint.product_name,
            product_strength_grade=complaint.product_strength_grade,
            batch_lot_number=complaint.batch_lot_number,
            affected_quantity=complaint.affected_quantity,
            manufacturing_date=complaint.manufacturing_date,
            expiry_date=complaint.expiry_date,
            # Section 3
            originating_site_block=complaint.originating_site_block,
            impacted_npm=complaint.impacted_npm,
            # Section 4
            complaint_category=complaint.complaint_category,
            complaint_description=complaint.complaint_description,
            # Section 5
            severity=complaint.severity,
            suggested_next_action=complaint.suggested_next_action,
            initial_risk_assessment=complaint.initial_risk_assessment
        )
        
        db.add(db_complaint)
        db.commit()
        db.refresh(db_complaint)
        return db_complaint
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to commit complaint record to QMS Ledger: {str(e)}"
        )

@router.get("/complaints", response_model=List[ComplaintResponse])
def get_complaints(db: Session = Depends(get_db)):
    try:
        # Retrieve all complaints ordered by creation date descending
        complaints = db.query(ComplaintModel).order_by(ComplaintModel.created_at.desc()).all()
        return complaints
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to query complaints ledger database: {str(e)}"
        )
