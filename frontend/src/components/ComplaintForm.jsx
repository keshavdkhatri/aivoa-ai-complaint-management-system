import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateFormField, resetForm, clearChat, setView } from '../store';

const API_BASE_URL = 'http://127.0.0.1:8000';

export default function ComplaintForm() {
  const form = useSelector((state) => state.form);
  const dispatch = useDispatch();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' }); // 'success' or 'error'

  const predefinedBlocks = ["Manufacturing", "Packaging", "Warehouse", "Laboratory", "Block A", "Block B", "Block C"];

  const handleInputChange = (field, value) => {
    dispatch(updateFormField({ field, value }));
  };

  const handleCommit = async () => {
    // Validate some essential fields
    if (!form.customer_name || !form.product_name) {
      setMessage({
        text: 'Validation Error: Customer Name and Product Name are required before committing.',
        type: 'error'
      });
      return;
    }

    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const { status, ...complaintData } = form;
      const response = await fetch(`${API_BASE_URL}/api/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(complaintData)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to save complaint record.');
      }

      setMessage({
        text: 'Success: Complaint committed to QMS Ledger database successfully!',
        type: 'success'
      });
      
      // Auto redirect to Ledger view after 1.5 seconds
      setTimeout(() => {
        dispatch(setView('ledger'));
        dispatch(resetForm());
        dispatch(clearChat());
      }, 1500);

    } catch (err) {
      setMessage({
        text: `Error: ${err.message}`,
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isLocked = form.status === 'Pending Triage';

  // Check if active site block is a custom/non-predefined value
  const isCustomBlock = form.originating_site_block && !predefinedBlocks.includes(form.originating_site_block);

  return (
    <div className="complaint-form-container">
      <div className="form-header">
        <h2>Log Customer Complaint</h2>
        <span className={`status-pill ${isLocked ? 'pending' : 'ready'}`}>
          {!isLocked && <span className="status-dot"></span>}
          {form.status}
        </span>
      </div>

      {message.text && (
        <div className={`form-alert ${message.type}`}>
          {message.text}
        </div>
      )}

      <form className="qms-form" onSubmit={(e) => e.preventDefault()}>
        {/* Section 1: Origin & Customer Details */}
        <fieldset className="form-section">
          <legend>1. ORIGIN & CUSTOMER DETAILS</legend>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="complaint_source">Complaint Source</label>
              <input
                type="text"
                id="complaint_source"
                value={form.complaint_source || ''}
                onChange={(e) => handleInputChange('complaint_source', e.target.value)}
                placeholder="Awaiting AI extraction..."
                disabled={isLocked}
              />
            </div>
            <div className="form-group">
              <label htmlFor="customer_name">Customer Name</label>
              <input
                type="text"
                id="customer_name"
                value={form.customer_name || ''}
                onChange={(e) => handleInputChange('customer_name', e.target.value)}
                placeholder="Awaiting AI extraction..."
                disabled={isLocked}
              />
            </div>
          </div>
        </fieldset>

        {/* Section 2: Product & Batch Identification */}
        <fieldset className="form-section">
          <legend>2. PRODUCT & BATCH IDENTIFICATION</legend>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="product_name">Product Name (API/FDF)</label>
              <input
                type="text"
                id="product_name"
                value={form.product_name || ''}
                onChange={(e) => handleInputChange('product_name', e.target.value)}
                placeholder="Awaiting AI extraction..."
                disabled={isLocked}
              />
            </div>
            <div className="form-group">
              <label htmlFor="product_strength_grade">Product Strength/Grade</label>
              <input
                type="text"
                id="product_strength_grade"
                value={form.product_strength_grade || ''}
                onChange={(e) => handleInputChange('product_strength_grade', e.target.value)}
                placeholder="Awaiting AI extraction..."
                disabled={isLocked}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="batch_lot_number">Batch / Lot Number</label>
              <input
                type="text"
                id="batch_lot_number"
                value={form.batch_lot_number || ''}
                onChange={(e) => handleInputChange('batch_lot_number', e.target.value)}
                placeholder="Awaiting AI extraction..."
                disabled={isLocked}
              />
            </div>
            <div className="form-group">
              <label htmlFor="affected_quantity">Affected Quantity</label>
              <input
                type="text"
                id="affected_quantity"
                value={form.affected_quantity || ''}
                onChange={(e) => handleInputChange('affected_quantity', e.target.value)}
                placeholder="Awaiting AI extraction..."
                disabled={isLocked}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="manufacturing_date">Manufacturing Date</label>
              <input
                type="text"
                id="manufacturing_date"
                value={form.manufacturing_date || ''}
                onChange={(e) => handleInputChange('manufacturing_date', e.target.value)}
                placeholder="Awaiting AI extraction..."
                disabled={isLocked}
              />
            </div>
            <div className="form-group">
              <label htmlFor="expiry_date">Expiry Date</label>
              <input
                type="text"
                id="expiry_date"
                value={form.expiry_date || ''}
                onChange={(e) => handleInputChange('expiry_date', e.target.value)}
                placeholder="Awaiting AI extraction..."
                disabled={isLocked}
              />
            </div>
          </div>
        </fieldset>

        {/* Section 3: Facility & Material Impact */}
        <fieldset className="form-section">
          <legend>3. FACILITY & MATERIAL IMPACT</legend>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="originating_site_block">Originating Site Block</label>
              <select
                id="originating_site_block"
                value={form.originating_site_block || ''}
                onChange={(e) => handleInputChange('originating_site_block', e.target.value)}
                disabled={isLocked}
              >
                <option value="">Awaiting AI classification...</option>
                {predefinedBlocks.map(block => (
                  <option key={block} value={block}>{block}</option>
                ))}
                {isCustomBlock && (
                  <option value={form.originating_site_block}>{form.originating_site_block}</option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="impacted_npm">Impacted Non-Product Materials (NPM)</label>
              <input
                type="text"
                id="impacted_npm"
                value={form.impacted_npm || ''}
                onChange={(e) => handleInputChange('impacted_npm', e.target.value)}
                placeholder="e.g., Primary packaging..."
                disabled={isLocked}
              />
            </div>
          </div>
        </fieldset>

        {/* Section 4: Defect Analysis */}
        <fieldset className="form-section">
          <legend>4. DEFECT ANALYSIS</legend>
          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="complaint_category">Complaint Category</label>
              <input
                type="text"
                id="complaint_category"
                value={form.complaint_category || ''}
                onChange={(e) => handleInputChange('complaint_category', e.target.value)}
                placeholder="Awaiting AI classification..."
                disabled={isLocked}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="complaint_description">Complaint Description</label>
              <textarea
                id="complaint_description"
                value={form.complaint_description || ''}
                onChange={(e) => handleInputChange('complaint_description', e.target.value)}
                placeholder="AI will synthesize the complaint into a formal QMS description..."
                rows="3"
                disabled={isLocked}
              />
            </div>
          </div>
        </fieldset>

        {/* Section 5: AI copilot risk assessment */}
        <fieldset className="form-section ai-assessment-section">
          <legend className="ai-assessment-legend">
            <svg className="shield-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>AI copilot risk assessment</span>
          </legend>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="severity">Severity (Suggested)</label>
              <input
                type="text"
                id="severity"
                value={form.severity || ''}
                onChange={(e) => handleInputChange('severity', e.target.value)}
                placeholder="Awaiting AI evaluation..."
                disabled={isLocked}
              />
            </div>
            <div className="form-group">
              <label htmlFor="suggested_next_action">Suggested Next Action</label>
              <input
                type="text"
                id="suggested_next_action"
                value={form.suggested_next_action || ''}
                onChange={(e) => handleInputChange('suggested_next_action', e.target.value)}
                placeholder="Awaiting AI recommendation..."
                disabled={isLocked}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="initial_risk_assessment">Initial Risk Assessment</label>
              <input
                type="text"
                id="initial_risk_assessment"
                value={form.initial_risk_assessment || ''}
                onChange={(e) => handleInputChange('initial_risk_assessment', e.target.value)}
                placeholder="Awaiting AI risk evaluation summary..."
                disabled={isLocked}
              />
            </div>
          </div>
        </fieldset>

        {/* Action Buttons */}
        <div className="form-actions-full">
          <button
            type="button"
            className="btn btn-primary btn-commit-full"
            onClick={handleCommit}
            disabled={submitting || isLocked}
          >
            {submitting ? 'Committing to Ledger...' : 'Commit to QMS Ledger'}
          </button>
        </div>
      </form>
    </div>
  );
}
