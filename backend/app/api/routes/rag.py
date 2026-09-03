"""FastAPI RAG API Router for GenAI Policy Retrieval & Ingestion."""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from app.ai.rag_service import rag_generate_answer, ingest_policy_document, list_knowledge_documents

router = APIRouter(prefix="/rag", tags=["GenAI RAG Framework"])


class RAGQueryRequest(BaseModel):
    query: str = Field(..., min_length=3, description="Citizen or officer query regarding policy, SLA, or infrastructure guidelines.")
    location: Optional[str] = Field("Kochi", description="Geographic location context.")


class PolicyIngestRequest(BaseModel):
    title: str = Field(..., min_length=5)
    category: str = Field(..., min_length=2)
    content: str = Field(..., min_length=20)
    jurisdiction: Optional[str] = "State / Municipal"
    tags: Optional[List[str]] = []


@router.post("/query")
def query_rag_framework(payload: RAGQueryRequest):
    """Execute GenAI RAG Pipeline: Retrieve retrieved policy documents -> Prompt Gemini 3.6 Flash -> Return Cited Answer."""
    try:
        return rag_generate_answer(payload.query, payload.location)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG Processing Error: {str(e)}")


@router.get("/documents")
def get_rag_documents():
    """List all indexed policy guidelines and SLAs in the RAG Knowledge Base."""
    return {
        "total_documents": len(list_knowledge_documents()),
        "documents": list_knowledge_documents(),
    }


@router.post("/ingest")
def ingest_rag_document(payload: PolicyIngestRequest):
    """Ingest a new government policy document or SOP into the active RAG vector index."""
    try:
        return ingest_policy_document(
            title=payload.title,
            category=payload.category,
            content=payload.content,
            jurisdiction=payload.jurisdiction,
            tags=payload.tags,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion Error: {str(e)}")
