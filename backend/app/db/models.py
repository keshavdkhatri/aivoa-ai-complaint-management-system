from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from .database import Base

class ComplaintModel(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    
    # Section 1: Origin & Customer Details
    complaint_source = Column(String(255), nullable=True)
    customer_name = Column(String(255), nullable=True)

    # Section 2: Product & Batch Identification
    product_name = Column(String(255), nullable=True)
    product_strength_grade = Column(String(255), nullable=True)
    batch_lot_number = Column(String(255), nullable=True)
    affected_quantity = Column(String(255), nullable=True)
    manufacturing_date = Column(String(100), nullable=True)  # Stored as string format for flexibility
    expiry_date = Column(String(100), nullable=True)         # Stored as string format for flexibility

    # Section 3: Facility & Material Impact
    originating_site_block = Column(String(255), nullable=True)
    impacted_npm = Column(String(255), nullable=True)

    # Section 4: Defect Analysis
    complaint_category = Column(String(255), nullable=True)
    complaint_description = Column(Text, nullable=True)

    # Section 5: AI Copilot Risk Assessment
    severity = Column(String(100), nullable=True)
    suggested_next_action = Column(Text, nullable=True)
    initial_risk_assessment = Column(Text, nullable=True)

    # Auditing / Tracking metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
