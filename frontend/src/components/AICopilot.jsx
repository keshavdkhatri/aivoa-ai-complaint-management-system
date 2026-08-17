import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  addChatMessage,
  setExtractionProgress,
  setPending,
  setExtractionMessage,
  setFormFields
} from '../store';

const API_BASE_URL = 'http://127.0.0.1:8000';

export default function AICopilot() {
  const chat = useSelector((state) => state.chat);
  const currentForm = useSelector((state) => state.form);
  const dispatch = useDispatch();

  const [chatInput, setChatInput] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.history, chat.isPending, chat.progress]);

  // Simulate progress bar increments
  const simulateProgress = (callback) => {
    dispatch(setPending(true));
    dispatch(setExtractionProgress(15));
    dispatch(setExtractionMessage('Analyzing raw text document structure...'));

    const intervals = [
      { delay: 350, percent: 45, message: 'Extracting tabular data via OCR...' },
      { delay: 700, percent: 75, message: 'Running agent risk assessment engine...' },
      { delay: 1050, percent: 95, message: 'Validating against QMS guidelines...' },
      { delay: 1400, percent: 100, message: 'Finalizing extraction results...' }
    ];

    intervals.forEach(({ delay, percent, message }) => {
      setTimeout(() => {
        dispatch(setExtractionProgress(percent));
        dispatch(setExtractionMessage(message));
        if (percent === 100) {
          setTimeout(() => {
            dispatch(setPending(false));
            dispatch(setExtractionProgress(0));
            dispatch(setExtractionMessage(''));
            callback();
          }, 200);
        }
      }, delay);
    });
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Immediately show uploader file in chat history
    dispatch(addChatMessage({
      role: 'user',
      content: `Uploaded file: ${file.name}`
    }));

    simulateProgress(async () => {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/api/upload-pdf`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Failed to parse PDF.');
        }

        const data = await response.json();

        // Prefill form
        dispatch(setFormFields(data.fields));

        // Add assistant reply
        dispatch(addChatMessage({
          role: 'assistant',
          content: data.message || 'PDF analysis complete. I\'ve successfully extracted the complaint report. Form populated on the left.'
        }));
      } catch (err) {
        dispatch(addChatMessage({
          role: 'assistant',
          content: `File upload extraction error: ${err.message}`
        }));
      }
    });
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chat.isPending) return;

    const userMessage = chatInput;
    setChatInput('');

    // Add user message to chat feed immediately
    dispatch(addChatMessage({
      role: 'user',
      content: userMessage
    }));

    // If the form is currently in Pending Triage (empty state), run extraction
    const isInitialExtraction = currentForm.status === 'Pending Triage';

    simulateProgress(async () => {
      try {
        if (isInitialExtraction) {
          const response = await fetch(`${API_BASE_URL}/api/extract`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: userMessage })
          });

          if (!response.ok) throw new Error('Failed to extract information.');

          const data = await response.json();
          dispatch(setFormFields(data.fields));
          dispatch(addChatMessage({
            role: 'assistant',
            content: data.message || 'Complaint parsed successfully. I\'ve extracted product details, mapped batch information, and generated an initial risk assessment.'
          }));
        } else {
          // It is a conversational correction / chat message
          const formattedHistory = chat.history
            .slice(1) // exclude initial bot greeting
            .map(msg => ({
              role: msg.role,
              content: msg.content
            }));

          const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: userMessage,
              history: formattedHistory,
              current_form: currentForm
            })
          });

          if (!response.ok) throw new Error('Chatbot response failed.');

          const data = await response.json();
          dispatch(addChatMessage({
            role: 'assistant',
            content: data.reply
          }));

          if (data.updated_fields && Object.keys(data.updated_fields).length > 0) {
            dispatch(setFormFields(data.updated_fields));
          }
        }
      } catch (err) {
        dispatch(addChatMessage({
          role: 'assistant',
          content: `Error: ${err.message}`
        }));
      }
    });
  };

  // Drag and drop handlers on chat container
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      className={`copilot-container ${dragActive ? 'drag-over' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="copilot-header">
        <div className="header-title">
          <svg className="sparkle-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" />
          </svg>
          <h3>AIVOA Copilot</h3>
        </div>
        <span className="copilot-hint-text">Drop complaint files or paste text below.</span>
      </div>

      {/* Chat messages feed */}
      <div className="chat-feed-container">
        <div className="chat-feed">
          {chat.history.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'assistant' ? 'AI' : 'QA'}
              </div>
              <div className="message-bubble">
                {msg.content}
              </div>
            </div>
          ))}

          {/* Inline uploader progress inside chat feed */}
          {chat.isPending && chat.progress > 0 && (
            <div className="chat-message assistant">
              <div className="message-avatar">AI</div>
              <div className="message-bubble inline-progress-bubble">
                <div className="progress-header">
                  <span>{chat.extractionMessage}</span>
                  <span>{chat.progress}%</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${chat.progress}%` }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Simple typing loading bubble */}
          {chat.isPending && chat.progress === 0 && (
            <div className="chat-message assistant">
              <div className="message-avatar">AI</div>
              <div className="message-bubble loading">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Unified Bottom Chat Input bar */}
      <div className="chat-input-area">
        <form className="chat-input-form" onSubmit={handleSend}>
          {/* File attachment button */}
          <button 
            type="button" 
            className="btn-attach" 
            onClick={() => fileInputRef.current?.click()}
            title="Attach digital PDF complaint file"
            disabled={chat.isPending}
          >
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 0A3 3 0 1011.293 13.5l-3.536 3.536m7.071-7.071L12.5 12.5m5.864-5.864a7.5 7.5 0 11-10.606 10.606l-3.536-3.536m3.536 3.536L4 20" />
            </svg>
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept=".pdf" 
            onChange={(e) => handleFileUpload(e.target.files[0])}
          />

          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type a message or paste a complaint..."
            disabled={chat.isPending}
          />
          
          <button type="submit" className="btn-send" disabled={!chatInput.trim() || chat.isPending}>
            <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </form>
        <div className="copilot-footer">
          POWERED BY LANGGRAPH
        </div>
      </div>
    </div>
  );
}
