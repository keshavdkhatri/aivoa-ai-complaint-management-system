import os
import json
import re
from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_groq import ChatGroq
from .prompts import EXTRACTION_SYSTEM_PROMPT, CHAT_SYSTEM_PROMPT

# State definition for LangGraph workflow
class AgentState(TypedDict):
    raw_text: str
    message: str
    chat_history: List[Dict[str, str]]
    current_form: Dict[str, Any]
    updated_fields: Dict[str, Any]
    agent_reply: str
    error: str

# Helper to clean JSON string from LLM responses (removes ```json ... ``` blocks)
def clean_json_string(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        # Strip starting block
        cleaned = re.sub(r"^```(?:json)?\n", "", cleaned)
        # Strip ending block
        cleaned = re.sub(r"\n```$", "", cleaned)
    return cleaned.strip()

# Heuristic / Mock extractor for when Groq API is unavailable or fails
def heuristic_extraction(text: str) -> Dict[str, Any]:
    text_lower = text.lower()
    
    # Initialize fields
    fields = {
        "complaint_source": "Email",
        "customer_name": "MediLife Care Pharmacy",
        "product_name": "Paracetamol",
        "product_strength_grade": "500mg",
        "batch_lot_number": "B240817",
        "affected_quantity": "50 kg",
        "manufacturing_date": "2026-01-10",
        "expiry_date": "2029-01-09",
        "originating_site_block": "Block B",
        "impacted_npm": "Primary Aluminum Foil",
        "complaint_category": "Major Defect",
        "complaint_description": "Discolored tablets found in blister pack.",
        "severity": "Major",
        "suggested_next_action": "Quarantine remaining batch and check manufacturing block B records.",
        "initial_risk_assessment": "Tablet discoloration indicates possible oxidation. Low safety risk, but quality standards violated."
    }
    
    # Parse source
    if "letter" in text_lower:
        fields["complaint_source"] = "Letter"
    elif "phone" in text_lower or "call" in text_lower:
        fields["complaint_source"] = "Phone Call"
        
    # Parse customer
    customer_match = re.search(r"(?:from|customer|client)\s+([A-Za-z0-9\s]+(?:ltd|inc|pharmacy|hospital|distributors|care))", text, re.IGNORECASE)
    if customer_match:
        fields["customer_name"] = customer_match.group(1).strip()
        
    # Parse product
    products = ["aspirin", "ibuprofen", "paracetamol", "amoxicillin", "metformin", "lipitor"]
    for p in products:
        if p in text_lower:
            fields["product_name"] = p.capitalize()
            break
            
    # Parse strength
    strength_match = re.search(r"(\d+(?:\s*mg|\s*g|\s*%))", text, re.IGNORECASE)
    if strength_match:
        fields["product_strength_grade"] = strength_match.group(1).strip()

    # Parse batch/lot
    batch_match = re.search(r"(?:batch|lot)\s*(?:no|number|#)?\s*([A-Za-z0-9\-]+)", text, re.IGNORECASE)
    if batch_match:
        fields["batch_lot_number"] = batch_match.group(1).strip()
        
    # Parse quantity
    qty_match = re.search(r"(\d+(?:\s*kg|\s*tablets|\s*vials|\s*boxes|\s*bottles))", text, re.IGNORECASE)
    if qty_match:
        fields["affected_quantity"] = qty_match.group(1).strip()
        
    # Parse dates
    date_matches = re.findall(r"(\d{4}-\d{2}-\d{2})", text)
    if len(date_matches) >= 2:
        fields["manufacturing_date"] = date_matches[0]
        fields["expiry_date"] = date_matches[1]
    elif len(date_matches) == 1:
        fields["manufacturing_date"] = date_matches[0]
        
    # Parse originating site block
    block_match = re.search(r"block\s*([a-fA-F0-9])", text, re.IGNORECASE)
    if block_match:
        fields["originating_site_block"] = f"Block {block_match.group(1).upper()}"
    elif "manufacturing" in text_lower:
        fields["originating_site_block"] = "Manufacturing"
    elif "packaging" in text_lower:
        fields["originating_site_block"] = "Packaging"
    elif "warehouse" in text_lower:
        fields["originating_site_block"] = "Warehouse"
    elif "laboratory" in text_lower:
        fields["originating_site_block"] = "Laboratory"
        
    # Parse impacted NPM
    npm_keywords = ["foil", "carton", "box", "vial", "cap", "label", "blister", "bottle"]
    for n in npm_keywords:
        if n in text_lower:
            fields["impacted_npm"] = f"Impacted {n.capitalize()}"
            break
            
    # Parse category and severity
    if "contamination" in text_lower or "wrong drug" in text_lower or "toxic" in text_lower:
        fields["complaint_category"] = "Critical Defect"
        fields["severity"] = "Critical"
        fields["suggested_next_action"] = "Halt production line, recall batch, notify regulatory agencies."
        fields["initial_risk_assessment"] = "High safety risk. Potential drug contamination requires immediate line halt."
    elif "chipping" in text_lower or "broken" in text_lower or "dented" in text_lower:
        fields["complaint_category"] = "Minor Defect"
        fields["severity"] = "Minor"
        fields["suggested_next_action"] = "Inspect warehouse stock and monitor batch retention samples."
        fields["initial_risk_assessment"] = "No active safety risk. Outer cosmetic damage only."
        
    # Set full description
    fields["complaint_description"] = text.strip()
    
    return fields

# Heuristic / Mock conversational corrector
def heuristic_chat(message: str, current_form: Dict[str, Any]) -> Dict[str, Any]:
    message_lower = message.lower()
    updated_fields = {}
    
    # Check for direct field modifications
    # Product Name
    prod_match = re.search(r"change\s+product(?:\s+name)?\s+to\s+([A-Za-z0-9\s]+)", message, re.IGNORECASE)
    if prod_match:
        updated_fields["product_name"] = prod_match.group(1).strip().capitalize()
        
    # Customer Name
    cust_match = re.search(r"change\s+customer(?:\s+name)?\s+to\s+([A-Za-z0-9\s]+)", message, re.IGNORECASE)
    if cust_match:
        updated_fields["customer_name"] = cust_match.group(1).strip()
        
    # Quantity
    qty_match = re.search(r"change\s+quantity\s+to\s+([A-Za-z0-9\s]+)", message, re.IGNORECASE)
    if qty_match:
        updated_fields["affected_quantity"] = qty_match.group(1).strip()

    # Batch/Lot
    batch_match = re.search(r"change\s+batch\s+to\s+([A-Za-z0-9\-]+)", message, re.IGNORECASE)
    if batch_match:
        updated_fields["batch_lot_number"] = batch_match.group(1).strip()
        
    # Severity
    sev_match = re.search(r"change\s+severity\s+to\s+(low|medium|high|critical|minor|major)", message, re.IGNORECASE)
    if sev_match:
        updated_fields["severity"] = sev_match.group(1).strip().capitalize()

    # Site Block
    block_match = re.search(r"change\s+block\s+to\s+([A-Za-z0-9\s]+)", message, re.IGNORECASE)
    if block_match:
        updated_fields["originating_site_block"] = block_match.group(1).strip()

    # If any fields were matched, summarize what changed
    if updated_fields:
        changes = ", ".join([f"'{k}' to '{v}'" for k, v in updated_fields.items()])
        reply = f"Understood. I have updated the following fields: {changes}."
    else:
        reply = f"I've analyzed your comment: '{message}'. If you would like me to change form fields, please specify like: 'Change product to Paracetamol' or 'Change quantity to 50 kg'."
        
    return {
        "reply": reply,
        "updated_fields": updated_fields
    }

# LangGraph Nodes
def extract_node(state: AgentState) -> Dict[str, Any]:
    raw_text = state.get("raw_text", "")
    groq_api_key = os.getenv("GROQ_API_KEY", "")
    
    # Check if API key is stubbed
    if not groq_api_key or groq_api_key.startswith("your_"):
        # Use fallback heuristic extractor
        extracted = heuristic_extraction(raw_text)
        return {
            "current_form": extracted,
            "agent_reply": "Information successfully extracted from complaint details.",
            "error": "Using simulated extraction (missing Groq API key)."
        }
        
    try:
        # Initialize Groq LLM
        llm = ChatGroq(
            temperature=0.0,
            groq_api_key=groq_api_key,
            model_name="gemma2-9b-it"
        )
        
        # Invoke extraction prompt
        messages = [
            SystemMessage(content=EXTRACTION_SYSTEM_PROMPT),
            HumanMessage(content=f"Raw Complaint Text:\n{raw_text}")
        ]
        
        response = llm.invoke(messages)
        cleaned_content = clean_json_string(response.content)
        parsed_fields = json.loads(cleaned_content)
        
        return {
            "current_form": parsed_fields,
            "agent_reply": "Information successfully extracted via LLM.",
            "error": ""
        }
    except Exception as e:
        # If API call fails, log error and fall back to heuristic
        extracted = heuristic_extraction(raw_text)
        return {
            "current_form": extracted,
            "agent_reply": "Information successfully extracted via fallback engine.",
            "error": f"LLM extraction failed ({str(e)}). Used fallback heuristic extraction."
        }

def chat_node(state: AgentState) -> Dict[str, Any]:
    message = state.get("message", "")
    current_form = state.get("current_form", {})
    groq_api_key = os.getenv("GROQ_API_KEY", "")
    
    # Check if API key is stubbed
    if not groq_api_key or groq_api_key.startswith("your_"):
        result = heuristic_chat(message, current_form)
        return {
            "agent_reply": result["reply"],
            "updated_fields": result["updated_fields"],
            "error": "Using simulated chatbot (missing Groq API key)."
        }
        
    try:
        # Initialize Groq LLM
        llm = ChatGroq(
            temperature=0.1,
            groq_api_key=groq_api_key,
            model_name="gemma2-9b-it"
        )
        
        # Build prompt messages
        system_content = CHAT_SYSTEM_PROMPT.format(current_form=json.dumps(current_form, indent=2))
        messages = [SystemMessage(content=system_content)]
        
        # Add history context
        for msg in state.get("chat_history", []):
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                # Ensure we pass strings
                messages.append(SystemMessage(content=msg["content"]))
                
        messages.append(HumanMessage(content=message))
        
        response = llm.invoke(messages)
        cleaned_content = clean_json_string(response.content)
        parsed_response = json.loads(cleaned_content)
        
        return {
            "agent_reply": parsed_response.get("reply", "I've processed your command."),
            "updated_fields": parsed_response.get("updated_fields", {}),
            "error": ""
        }
    except Exception as e:
        # Fall back to heuristic chat
        result = heuristic_chat(message, current_form)
        return {
            "agent_reply": result["reply"],
            "updated_fields": result["updated_fields"],
            "error": f"LLM Chat failed ({str(e)}). Used fallback chat processor."
        }

# Compile LangGraph StateGraph
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("extract", extract_node)
workflow.add_node("chat", chat_node)

# Set Entrypoints and Edges
workflow.set_entry_point("extract")
workflow.add_edge("extract", END)

# Chat graph setup (can be ran individually based on the entrypoint)
chat_workflow = StateGraph(AgentState)
chat_workflow.add_node("chat", chat_node)
chat_workflow.set_entry_point("chat")
chat_workflow.add_edge("chat", END)

compiled_extract_graph = workflow.compile()
compiled_chat_graph = chat_workflow.compile()
