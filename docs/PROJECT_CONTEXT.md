# Project Context

## Assignment Objective
The objective of this assignment is to build **AIVOA**, an AI-Powered Customer Complaint Management System for the pharmaceutical manufacturing industry (specifically targeting Active Pharmaceutical Ingredient (API) and Finished Dosage Form (FDF) contexts). The system automates and streamlines the handling of customer complaints by using Generative AI to extract structured data from unstructured inputs (like emails, text, or PDFs), classify risk, and allow interactive chat-based corrections.

---

## Reference Materials Analyzed

The system specification is established based on the following verified project reference files located in [`reference/`](file:///d:/AIVOA%20Internship%20Assignment/reference/):

### Directly Analyzed Specifications
1. **[`internship assignment.pdf`](file:///d:/AIVOA%20Internship%20Assignment/reference/internship%20assignment.pdf)**:
   - Primary source of truth for the mandatory technology stack, required database structure (SQL), UI layout details, and submission deliverables.
   - Page 3 contains the **Reference UI Screenshot** and field descriptions outlining the exact visual structure, form categories, and intake options.
2. **[`AIVOA- complaints module demo.mp4`](file:///d:/AIVOA%20Internship%20Assignment/reference/AIVOA-%20complaints%20module%20demo.mp4) (Metadata Verification)**:
   - File size: ~175 MB (175,022,888 bytes)
   - Duration: 186.18 seconds (~3 minutes, 6 seconds)
   - Video track: H.264 / AVC video stream
   - Audio track: AAC stereo audio stream
   - Note: Because video frame processing and audio speech transcription were not performed directly in this initial phase due to system environment limits, the video's contents were verified by technical metadata.

---

## Core System Workflow & UI Layout
Based on the reference UI screenshot and specifications inside the PDF, the customer complaints module comprises a full-screen split-screen layout:

### 1. Log Customer Complaint Form (Left Panel)
- **Section 1: Origin & Customer Details**:
  - *Complaint Source*: Pasted email, pasted text, or uploaded document path.
  - *Customer Name*: Name of the entity submitting the complaint.
- **Section 2: Product & Batch Identification**:
  - *Product Name*: Active Pharmaceutical Ingredient (API) or Finished Dosage Form (FDF) name.
  - *Product Strength/Grade*: Quantitative strength (e.g., 500mg) or material grade.
  - *Batch / Lot Number*: Unique manufacturing run identifier.
  - *Affected Quantity*: Numeric quantity with a unit suffix (e.g., kg, tablets).
  - *Manufacturing Date*: Date selector.
  - *Expiry Date*: Date selector.
- **Section 3: Facility & Material Impact**:
  - *Originating Site Block*: Site production block (e.g., Block A, Block B).
  - *Impacted Non-Product Materials (NPM)*: Impact on non-product materials (e.g., packaging material, solvents).
- **Section 4: Defect Analysis**:
  - *Complaint Category*: Dropdown classification of the quality defect.
  - *Complaint Description*: Multi-line text field capturing the raw customer complaint.
- **Section 5: AI Copilot Risk Assessment**:
  - *Severity (Suggested)*: Suggested severity classification determined by AI.
  - *Suggested Next Action*: Next QA steps recommended by AI.
  - *Initial Risk Assessment*: Multi-line description evaluating the initial risk context.

**Commit Action Button**:
- **Commit to QMS Ledger**: Persists the validated form data to the secure SQL database.

### 2. AI Complaint Intake Assistant (Right Panel)
- **Document Drag & Drop Area**: Prompts the user to browse or drop complaint documents (supports PDF, DOCX, TXT, EML up to 10MB).
- **Paste Text / Email Trigger**: Activates an intake text area for copy-pasted complaint text.
- **Extraction Progress Indicator**: Displays progress bar during AI processing (e.g. 10%, 40%, 100%).
- **AI Copilot Chat Interface**:
  - A chat log displaying assistant messages and user replies.
  - Chat input field: *"Ask me anything about this complaint..."* allowing conversational adjustments.

### Expected Interactive Flow
1. **Intake**: User uploads a digital PDF or pastes raw email text.
2. **Auto-Population**: The backend extracts structured data matching the form schema and computes the initial risk priority. The UI form fields immediately update with the extracted JSON properties.
3. **Conversational Correction**: If any details are parsed incorrectly, the user instructs the chatbot (e.g., *"Change product name to Paracetamol and quantity to 50 kg"*). The AI Copilot identifies the specific updates, updates the active form state in Redux, and explains the correction in the chat log.
4. **QMS Ledger Persistence**: Clicking **Commit to QMS Ledger** saves the structured records to the SQL database.

---

## Mandatory Technology Stack
- **Frontend**: React (Google Inter font, Vanilla CSS responsive layout)
- **State Management**: Redux (Toolkit preferred) for managing form and chat states
- **Backend**: Python with FastAPI
- **AI Agent Framework**: LangGraph (for conversational state management)
- **LLMs (via Groq)**:
  - `gemma2-9b-it` (Primary model)
  - `llama-3.3-70b-versatile` (Alternative/context-justified model if larger context is needed)
- **Database**: SQL (PostgreSQL preferred)

---

## In-Scope vs. Out-of-Scope

### In-Scope Features
- Full-screen split-screen layout (Left form, Right AI Copilot).
- Paste text/email processing and digital PDF text extraction.
- Automatic form pre-fill and dynamic dropdown risk selection.
- Multi-turn conversational chat correction that incrementally updates active form states in Redux.
- Persistent QMS Ledger list view for inspecting committed complaints.
- Minimal navigation toggling between Intake Assistant and Ledger view.

### Out-of-Scope Features
The following modules and features are NOT part of the required assignment scope:
- Dashboard / analytics dashboard
- Investigations module
- CAPA management module
- Reports module
- Settings module
- Support module
- User login / signup authentication system
- Other generic enterprise pages or sidebars
- Production-grade scanned document OCR or handwritten handwriting interpretation.
- Unnecessary microservices, background job queues, or secondary routing frameworks.

