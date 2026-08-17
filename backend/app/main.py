import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db.database import engine, Base
from .api.endpoints import router as api_router

# Create database tables on startup if they do not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AIVOA Quality Assurance API",
    description="Backend service for AI-powered customer complaint parsing and storage.",
    version="1.0.0"
)

# Setup CORS middleware for local React dev server communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for the assignment/demo simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "AIVOA QMS Backend API is running successfully."}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
