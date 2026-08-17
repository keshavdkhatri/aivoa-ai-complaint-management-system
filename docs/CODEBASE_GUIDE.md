# Codebase Guide

This guide is designed to help developers quickly understand the structure, components, and concepts of the **AIVOA Customer Complaint Management System**. Use it to prepare for discussions and technical walkthroughs during your interview.

---

## Existing Files vs. Planned Files/Folders

Currently, the workspace contains only configuration and documentation files. Here is the layout of the project, highlighting what exists now and what will be created in future phases:

### Existing Files (Phase 0)
- [`README.md`](file:///d:/AIVOA%20Internship%20Assignment/README.md): Simple introduction, tech stack, and goals.
- [`.gitignore`](file:///d:/AIVOA%20Internship%20Assignment/.gitignore): Standard git ignore file for Node.js, Python, and environments.
- [`docs/`](file:///d:/AIVOA%20Internship%20Assignment/docs/): Architectural documentation and guidelines.

### Planned Folder Structure (Phases 1-4)
```
aivoa-ai-complaint-management-system/
├── frontend/                     # React UI (Planned)
│   ├── public/                   # Static assets
│   └── src/
│       ├── components/           # UI Components (Form, Chat, Ledger)
│       ├── store/                # Redux State Management
│       ├── App.jsx               # Main application entry and view switcher
│       ├── index.js              # Application entry point
│       └── index.css             # Main styling using Vanilla CSS and Inter font
│
├── backend/                      # FastAPI Python Backend (Planned)
│   ├── app/
│   │   ├── api/                  # API routers and endpoints
│   │   ├── agents/               # LangGraph workflows and AI logic
│   │   ├── db/                   # SQL database configuration and models
│   │   ├── schemas/              # Pydantic data schemas
│   │   └── main.py               # Backend server entry point
│   ├── requirements.txt          # Python dependencies
│   └── .env                      # API tokens and database credentials
│
└── reference/                    # Reference files (Existing)
    ├── AIVOA- complaints module demo.mp4
    └── internship assignment.pdf
```

---

## Folder Responsibilities

### `frontend/src/components/`
- **`ComplaintForm.jsx`**: Renders the left-hand form inputs categorized into:
  1. Origin & Customer Details
  2. Product & Batch Identification
  3. Facility & Material Impact
  4. Defect Analysis
  5. AI Copilot Risk Assessment
- **`AICopilot.jsx`**: Renders the right-hand panel, including the PDF/Text uploader interface and the chat copilot interface.
- **`QMSLedgerView.jsx`**: Renders a simple list/table view showing previously committed complaints pulled from the database.

### `frontend/src/store/`
- **`complaintSlice.js`**: Manages the local UI state of the form fields. Provides actions to update single fields or batch-update all fields when AI outputs a response.
- **`chatSlice.js`**: Stores user and AI messages in a history list for the chatbot interface.

### `backend/app/api/`
- Defines the routing logic (`/api/extract`, `/api/upload-pdf`, `/api/chat`, `/api/save`) using FastAPI routers. Validates request payloads against Pydantic models.

### `backend/app/agents/`
- **`workflow.py`**: Builds the LangGraph `StateGraph`. Defines the states, nodes (e.g., `extract_node`, `chatbot_node`), and edges that govern conversational correction and extraction.
- **`prompts.py`**: Contains system instructions for entity extraction and conversational corrections, optimized for Groq models.

### `backend/app/db/`
- Contains database connection scripts (SQLAlchemy engine/session) and the PostgreSQL table schemas defining the SQL table layout.

---

## Beginner-Friendly Tech Stack Explanations

### 1. React
React is a JavaScript library for building user interfaces. Instead of manually updating the HTML page when data changes, React lets you build "components" that automatically re-render (update themselves) whenever their data ("state") changes.

### 2. Redux (Redux Toolkit)
Redux is a centralized state container. In a large React app, passing data between far-apart components (like updating a form on the left using a chatbot on the right) is hard. Redux acts as a single global "source of truth" database inside the browser memory. The chatbot sends an action to Redux, Redux updates its store, and the form automatically updates because it is "subscribed" to that store.

### 3. FastAPI
FastAPI is a modern, fast (high-performance) web framework for building APIs with Python. It automatically validates incoming data models (e.g. checks if a date is formatted correctly) and automatically generates interactive API documentation.

### 4. LangGraph
LangGraph is a library for building stateful, multi-actor applications with LLMs. Unlike simple prompts, LangGraph structures the AI's logic as a graph (like a flowchart) where nodes represent actions (e.g., "extract entities", "formulate response") and edges represent transitions. This is critical for making sure the chatbot remembers what complaint it is discussing and applies corrections relative to that state.

### 5. Groq & Gemma-2-9b-it
Groq is a high-speed inference engine for LLMs. Gemma-2-9b-it is a lightweight, efficient LLM developed by Google. Groq allows us to call Gemma-2-9b-it with sub-second response times, which is essential for making the chatbot feel interactive and responsive.

### 6. SQL & PostgreSQL
PostgreSQL is a relational database management system. It stores our complaint data in rows and columns (tables), ensuring records are structured and audit-ready (complying with pharmaceutical QMS requirements).

---

## Expected End-to-End Request Flow

Let's walk through what happens when a user types a correction like *"Actually, the product was Paracetamol 500mg"* into the Copilot:

```
[ User Input ]
      │
      ▼
[ React Component ] ──► Dispatches User Message
      │
      ▼
[ Redux Store ] ──► Updates chat history (user message added)
      │
      ▼ (POST /api/chat)
[ FastAPI Endpoint ] ──► Receives: User Message + Chat History + Current Form State
      │
      ▼
[ LangGraph Agent ] ──► Processes the inputs using StateGraph
      │
      ▼ (Inference Call)
[ Groq LLM (Gemma-2) ] ──► Evaluates user request against current form state.
      │                    Returns: Chat reply + JSON of updated fields (Product Name: "Paracetamol", Product Strength: "500mg").
      │
      ▼ (JSON Response)
[ FastAPI Endpoint ] ──► Sends back JSON payload
      │
      ▼
[ Redux Store ] ──► Updates `complaintForm` with new product details;
      │             Updates `chatHistory` with the AI's reply.
      │
      ▼ (Reactive Re-render)
[ React Form & Chat ] ──► Form field updates on screen; Chat window displays AI reply.
```

---

## What I Need to Understand Before the Interview

Be ready to explain the following core concepts during an interview:
1. **How does the AI update specific form fields?**
   - *Answer*: By instructing the LLM to output a structured JSON format (specifically a dictionary of changed keys and values) alongside its conversational response. The frontend reads this JSON and merges it into the Redux state.
2. **Why use LangGraph instead of simple LangChain or OpenAI direct calls?**
   - *Answer*: LangGraph provides stateful cycle management. It makes it easy to maintain the "chat state" and "form state" as persistent data in the graph, making the conversation feel coherent across multiple user corrections.
3. **How does PDF parsing work without heavy OCR?**
   - *Answer*: We read digital text streams directly from PDF files using lightweight Python packages. Since this is a QA operator portal, we assume standard digital complaint documents rather than raw handwritten scans.
4. **How are risk assessments determined?**
   - *Answer*: The LLM is provided with prompt guidelines defining pharmaceutical severity rules (e.g., contamination or incorrect strength is High severity; minor package scuffs are Low severity). The LLM classifies the text and returns a structured output.
