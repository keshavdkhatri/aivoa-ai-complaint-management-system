# Architecture Guide

This document describes the high-level architecture and data flows of the **AIVOA Customer Complaint Management System**. The system is built with simplicity, clean separation of concerns, and ease of demonstration in mind.

---

## Architecture Diagram

```
+--------------------------------------------------------------------------------+
|                                   FRONTEND                                     |
|                                                                                |
|  +-----------------------------+           +--------------------------------+  |
|  |       React UI Form         |           |       AI Copilot Panel         |  |
|  |                             |           |                                |  |
|  | - Displays complaint fields |           | - Upload PDF/Paste Email       |  |
|  | - Pre-filled by AI          |           | - AI chatbot chat history      |  |
|  | - Reactive updates          |           | - Interactive correction field |  |
|  +--------------+--------------+           +---------------+----------------+  |
|                 ^                                          |                   |
|                 | (Form Pre-fill / Update)                 | (User Messages)   |
|                 v                                          v                   |
|  +--------------+------------------------------------------+----------------+  |
|  |                              Redux Store                                 |  |
|  |  (Manages current complaint state, chat history, extraction progress)    |  |
|  +-----------------------------------+--------------------------------------+  |
+--------------------------------------|-----------------------------------------+
                                       |
                     HTTP JSON/Files   |   (REST API Calls)
                                       v
+--------------------------------------|-----------------------------------------+
|                                   BACKEND                                      |
|                                                                                |
|  +-----------------------------------+--------------------------------------+  |
|  |                            FastAPI Router                                |  |
|  |  (Exposes: /api/extract, /api/chat, /api/save, /api/upload-pdf)           |  |
|  +--------------------+------------------------------------+----------------+  |
|                       |                                    |                   |
|                       v (LangGraph Invocation)             v (SQL Connection)  |
|  +--------------------+--------------------+   +-----------+----------------+  |
|  |             LangGraph Workflow          |   |       SQL Database         |  |
|  |  (StateGraph that coordinates state)    |   |      (PostgreSQL)          |  |
|  +--------------------+--------------------+   |                            |  |
|                       |                        | - Table: complaints        |  |
|                       v (Tool Call / Prompt)   | - Records auditing ledger  |  |
|  +--------------------+--------------------+   +----------------------------+  |
|  |                 Groq LLM                |                                   |
|  |             (gemma2-9b-it)              |                                   |
|  +-----------------------------------------+                                   |
+--------------------------------------------------------------------------------+
```

---

## Component Responsibilities

### Frontend (React & Redux)
- **React UI**: Renders the form fields and layout using Vanilla CSS. Interacts with the user.
- **Redux State**:
  - `complaintForm`: Stores all form fields currently visible on screen.
  - `chatHistory`: Stores the message threads for the AI Assistant.
  - `extractionStatus`: Tracks file uploading and extraction progress (0% to 100%).
- **Google Inter Font**: Applied globally to typography for a clean, modern aesthetic.

### Backend (FastAPI & LangGraph)
- **FastAPI Endpoints**:
  - `POST /api/extract`: Receives pasted text or email body and extracts structured fields.
  - `POST /api/upload-pdf`: Receives a binary PDF file, extracts raw text, and triggers structured extraction.
  - `POST /api/chat`: Receives the current chat message, complete chat history, and current form state. Returns the AI reply along with any proposed form field updates.
  - `POST /api/save`: Receives the validated form JSON and saves it to the database ledger.
  - `GET /api/complaints`: Lists saved complaints (the QMS Ledger view).
- **LangGraph Agent Workflow**:
  - Defines a StateGraph representing the AI agent session.
  - Keeps track of state including: raw text, extracted fields, chat history, and proposed corrections.
  - Formulates LLM prompts, parses outputs into structured JSON (using Pydantic models), and recommends updates.
- **Groq LLM**:
  - Runs inference using the primary model `gemma2-9b-it`.
  - For advanced structured extraction or large context windows, fallback option `llama-3.3-70b-versatile` may be utilized.

### Database (PostgreSQL)
- Relational database schema with a single main table: `complaints`.
- Fields match the structured UI form.
- Contains auto-incrementing ID, timestamps, and audit-friendly structure (representing a secure ledger).

---

## Detailed Data Flows

### Flow A: Text/Email Complaint Processing
1. User pastes unstructured complaint text in the AI panel and triggers extraction.
2. React dispatches an action calling `POST /api/extract` with the raw text.
3. FastAPI receives the request and executes the LangGraph extraction node.
4. Groq LLM (Gemma-2-9b) analyzes the text and populates a Pydantic schema representing the complaint form.
5. The structured JSON response is returned to the frontend.
6. Redux store updates `complaintForm` with the extracted values, and the UI form displays them.

### Flow B: PDF Complaint Processing
1. User uploads a PDF file using the file uploader component.
2. React dispatches a multi-part form request to `POST /api/upload-pdf`.
3. FastAPI extracts the raw text from the PDF using a lightweight Python package (e.g., `pypdf` or `pdfplumber`).
4. The extracted text is sent to the same LangGraph extraction workflow as Flow A.
5. The structured JSON response is returned, updating the Redux store and the UI form.

### Flow C: Conversational Complaint Correction (AI Copilot)
1. User enters a message in the chat input (e.g., *"Change customer name to MediLife Care"*).
2. React dispatches a call to `POST /api/chat` sending the user's message, `chatHistory`, and current `complaintForm` values.
3. FastAPI executes the LangGraph conversation node.
4. The agent prompts Groq LLM with the context: **"Based on the user's correction request, the current form state, and the chat history, identify which fields need to be updated and format them as structured changes. Also provide a natural language response explaining the action."**
5. Groq returns:
   - A list of fields to modify with their new values.
   - A friendly chat reply (e.g., *"Understood. I have updated the Customer Name to MediLife Care."*).
6. FastAPI returns the JSON response.
7. Redux dispatches actions to update:
   - The specific form fields in `complaintForm`.
   - The message history in `chatHistory`.
8. The UI reflects both updates in real-time.

### Flow D: AI Risk Assessment & Priority
1. During both Flow A and Flow B, the LLM is prompted to perform an initial risk assessment of the complaint.
2. The model analyzes the description to evaluate:
   - **Severity** (Low, Medium, High): Based on whether the issue affects safety, purity, or product efficacy (e.g., discoloration, chipping, wrong label).
   - **Priority** (Low, Medium, High, Critical): Based on the combination of severity and batch size or urgency.
3. These evaluated values are returned in the structured JSON and pre-selected in the UI dropdowns.

### Flow E: SQL Persistence (QMS Ledger)
1. User clicks the **Commit to QMS Ledger** button on the UI form.
2. React gathers the current values of all fields from the Redux store.
3. React makes a `POST /api/save` request containing the full form data.
4. FastAPI validates the schema and inserts a row into the database table `complaints` using SQL (SQLAlchemy / psycopg2).
5. On success, a notification is displayed, and the form can be reset.
