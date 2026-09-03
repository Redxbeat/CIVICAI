"""Standalone FastAPI AI Microservice for CIVICAI."""

from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

from pipeline import process_citizen_input
from language_service import language_pipeline
from classification_service import classify_infrastructure
from extraction_service import extract_entities
from triage_service import compute_triage_score, route_to_agency


app = FastAPI(
    title="CIVICAI AI Microservice API",
    description="Dedicated microservice for multilingual language processing, classification, entity extraction, and triage routing.",
    version="1.0.0",
)


class IntakeRequest(BaseModel):
    original_text: str = Field(..., min_length=5)
    location: Optional[str] = "Kochi"
    category: Optional[str] = None
    urgency: Optional[float] = None
    population_affected: Optional[int] = 2500
    duplicate_probability: Optional[float] = 0.12


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "ai-services",
        "supported_languages": ["Malayalam", "Hindi", "English", "Tamil", "Kannada"],
        "pipeline_version": "v1.0.0",
    }


@app.post("/process")
def process_request(payload: IntakeRequest):
    try:
        return process_citizen_input(payload.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/detect-language")
def detect_lang(text: str):
    return language_pipeline(text)


@app.post("/classify")
def classify_text(text: str):
    return classify_infrastructure(text)


@app.post("/extract-entities")
def extract_text_entities(text: str):
    return extract_entities(text)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
