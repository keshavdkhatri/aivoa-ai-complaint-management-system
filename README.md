# AIVOA – AI-Powered Customer Complaint Management System

AI-Powered Customer Complaint Management System designed for the pharmaceutical manufacturing industry (API & FDF Quality Assurance contexts). 

This repository is built as part of the Round 1 AI Product Engineer internship assignment.

---

## Planned Technology Stack
- **Frontend**: React (Inter Font, Vanilla CSS for modern and responsive layout)
- **State Management**: Redux (Toolkit) for form and conversation state synchronization
- **Backend**: Python with FastAPI (REST endpoints for extraction, chat, and database persistence)
- **AI Agent Framework**: LangGraph (for multi-turn stateful complaint correction flows)
- **LLM Engine**: Groq API using Google's `gemma2-9b-it` (primary model) and `llama-3.3-70b-versatile` (advanced context)
- **Database**: PostgreSQL (QMS audit ledger table)

---

## High-Level Workflow
1. **Intake & OCR**: Pasting unstructured complaint emails or uploading a digital complaint PDF.
2. **AI Extraction & Risk Assessment**: The AI parses the complaint, identifies the product/batch info, details, evaluates severity/priority, and auto-populates the form.
3. **Conversational Copilot**: The user converses with the AI chatbot to correct or update form values (e.g. "change customer name to X"). The chatbot updates the UI form dynamically.
4. **QMS Ledger Persistence**: Saving the completed complaint form directly into a SQL database.

---

## Detailed Project Documentation
Please refer to the following documentation files under the [`docs/`](file:///d:/AIVOA%20Internship%20Assignment/docs/) directory for detailed insights:
- [`PROJECT_CONTEXT.md`](file:///d:/AIVOA%20Internship%20Assignment/docs/PROJECT_CONTEXT.md): Goals, scope, reference video workflow details, and deliverables.
- [`ARCHITECTURE.md`](file:///d:/AIVOA%20Internship%20Assignment/docs/ARCHITECTURE.md): System layout, components, and detailed step-by-step request lifecycles.
- [`CODEBASE_GUIDE.md`](file:///d:/AIVOA%20Internship%20Assignment/docs/CODEBASE_GUIDE.md): Planned folder structure, technological explanations, and interview prep questions.
- [`COMMITS.md`](file:///d:/AIVOA%20Internship%20Assignment/docs/COMMITS.md): Log of development checkpoint milestones.
