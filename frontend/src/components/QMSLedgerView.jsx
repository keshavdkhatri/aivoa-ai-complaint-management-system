import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setLedgerRecords, setLedgerLoading, setLedgerError, setView } from '../store';

const API_BASE_URL = 'http://127.0.0.1:8000';

export default function QMSLedgerView() {
  const { records, isLoading, error } = useSelector((state) => state.ledger);
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');

  const fetchComplaints = async () => {
    dispatch(setLedgerLoading(true));
    try {
      const response = await fetch(`${API_BASE_URL}/api/complaints`);
      if (!response.ok) throw new Error('Failed to retrieve ledger data.');
      const data = await response.json();
      dispatch(setLedgerRecords(data));
    } catch (err) {
      dispatch(setLedgerError(err.message));
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Filter records based on simple search query
  const filteredRecords = records.filter((rec) => {
    const term = searchTerm.toLowerCase();
    return (
      (rec.customer_name?.toLowerCase() || '').includes(term) ||
      (rec.product_name?.toLowerCase() || '').includes(term) ||
      (rec.batch_lot_number?.toLowerCase() || '').includes(term) ||
      (rec.complaint_category?.toLowerCase() || '').includes(term) ||
      (rec.severity?.toLowerCase() || '').includes(term)
    );
  });

  return (
    <div className="ledger-container">
      <div className="ledger-header">
        <div className="ledger-title-group">
          <h2>QMS Complaints Ledger</h2>
          <span className="ledger-subtitle">Auditable QA Ledger database records</span>
        </div>
        <div className="ledger-actions">
          <button className="btn btn-secondary" onClick={fetchComplaints}>
            Refresh Ledger
          </button>
          <button className="btn btn-primary" onClick={() => dispatch(setView('intake'))}>
            Back to Intake
          </button>
        </div>
      </div>

      <div className="ledger-search-bar">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter ledger records by product, customer, batch, severity, category..."
        />
      </div>

      {isLoading ? (
        <div className="ledger-status-message">
          <div className="loading-spinner"></div>
          <p>Retrieving database records...</p>
        </div>
      ) : error ? (
        <div className="ledger-error-box">
          <p><strong>Query Failed:</strong> {error}</p>
          <button className="btn btn-secondary btn-sm" onClick={fetchComplaints}>Retry</button>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="ledger-empty-box">
          <p>No complaints records found matching your filter criteria.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Origin / Source</th>
                <th>Customer Name</th>
                <th>Product (Batch)</th>
                <th>Block / NPM</th>
                <th>Severity</th>
                <th>Defect Details</th>
                <th>Logged At</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((rec) => (
                <tr key={rec.id}>
                  <td><strong>#{rec.id}</strong></td>
                  <td>
                    <span className="badge-source">{rec.complaint_source || 'Unknown'}</span>
                  </td>
                  <td>{rec.customer_name || 'N/A'}</td>
                  <td>
                    <div><strong>{rec.product_name}</strong></div>
                    <div className="table-subtext">{rec.product_strength_grade} (Lot: {rec.batch_lot_number})</div>
                  </td>
                  <td>
                    <div>{rec.originating_site_block || 'N/A'}</div>
                    <div className="table-subtext">{rec.impacted_npm || 'No material impact'}</div>
                  </td>
                  <td>
                    <span className={`severity-badge ${rec.severity?.toLowerCase()}`}>
                      {rec.severity || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <div><strong>{rec.complaint_category}</strong></div>
                    <div className="table-subtext truncate" title={rec.complaint_description}>
                      {rec.complaint_description || 'No description'}
                    </div>
                  </td>
                  <td>
                    {new Date(rec.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
