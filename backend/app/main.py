from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.requests import router as requests_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.rag import router as rag_router
from app.core.config import get_settings
from app.core.database import Base, engine

settings = get_settings()

app = FastAPI(
    title="CIVICAI API",
    description="Multilingual infrastructure intelligence platform for citizen feedback and public investment decisions.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "backend",
        "app": settings.app_name,
        "environment": settings.app_env,
        "demo_data": "synthetic",
    }


@app.get("/")
def root():
    return {
        "message": "CIVICAI API is running.",
        "status": "ready",
        "phase": "Phase 1 - Foundation"
    }


app.include_router(auth_router)
app.include_router(requests_router)
app.include_router(dashboard_router)
app.include_router(rag_router)
