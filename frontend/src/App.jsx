import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setView } from './store';
import ComplaintForm from './components/ComplaintForm';
import AICopilot from './components/AICopilot';
import QMSLedgerView from './components/QMSLedgerView';

export default function App() {
  const activeView = useSelector((state) => state.view.activeView);
  const dispatch = useDispatch();

  return (
    <div className="aivoa-app">
      {/* Shared Minimalist Navbar Header */}
      <header className="app-navbar">
        <div className="navbar-brand">
          <div className="brand-logo">AIVOA</div>
          <div className="brand-tagline">AI Quality Assurance Portal</div>
        </div>
        <nav className="navbar-nav">
          {activeView === 'intake' ? (
            <button 
              className="btn btn-primary btn-nav"
              onClick={() => dispatch(setView('ledger'))}
            >
              View QMS Ledger
            </button>
          ) : (
            <button 
              className="btn btn-primary btn-nav"
              onClick={() => dispatch(setView('intake'))}
            >
              Back to Intake Assistant
            </button>
          )}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="app-main-content">
        {activeView === 'intake' ? (
          <div className="split-screen-layout">
            <div className="split-column left-pane">
              <ComplaintForm />
            </div>
            <div className="split-column right-pane">
              <AICopilot />
            </div>
          </div>
        ) : (
          <div className="ledger-view-layout">
            <QMSLedgerView />
          </div>
        )}
      </main>
    </div>
  );
}
