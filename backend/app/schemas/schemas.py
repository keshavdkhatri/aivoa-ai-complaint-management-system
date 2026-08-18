from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# Base schema containing shared fields for QMS complaints
class ComplaintBase(BaseModel):
    # Section 1: Origin & Customer Details
    complaint_source: Optional[str] = ""
    customer_name: Optional[str] = ""
    complaint_date: Optional[str] = ""

    # Section 2: Product & Batch Identification
    product_name: Optional[str] = ""
    product_strength_grade: Optional[str] = ""
    batch_lot_number: Optional[str] = ""
    affected_quantity: Optional[str] = ""
    manufacturing_date: Optional[str] = ""
    expiry_date: Optional[str] = ""

    # Section 3: Facility & Material Impact
    originating_site_block: Optional[str] = ""
    impacted_npm: Optional[str] = ""

    # Section 4: Defect Analysis
    complaint_category: Optional[str] = ""
    complaint_description: Optional[str] = ""

    # Section 5: AI Copilot Risk Assessment
    severity: Optional[str] = ""
    suggested_next_action: Optional[str] = ""
    initial_risk_assessment: Optional[str] = ""

# Schema for incoming request to save a complaint
class ComplaintCreate(ComplaintBase):
    pass

# Schema for reading database record response
class ComplaintResponse(ComplaintBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Schema for unstructured text/email extraction request
class ExtractionRequest(BaseModel):
    text: str

# Schema for the result of extracting fields
class ExtractionResponse(BaseModel):
    success: bool
    fields: ComplaintBase
    message: str

# Schema for a single message in the chat history
class ChatMessage(BaseModel):
    role: str  # "user", "assistant", or "system"
    content: str

# Schema for the multi-turn conversational correction endpoint
class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    current_form: ComplaintBase

# Schema for the chat response containing the chat reply and any updated form fields
class ChatResponse(BaseModel):
    reply: str
    updated_fields: Dict[str, Any]
