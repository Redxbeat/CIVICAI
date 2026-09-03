# CIVICAI Architecture

## Phase 1 Overview

This phase establishes the foundation of the CIVICAI platform.

### Core Components

- Frontend: Next.js dashboard shell for citizens and government users
- Backend: FastAPI REST API with auth and citizen request flow
- Database: PostgreSQL with PostGIS for geospatial and relational records
- Demo data: Synthetic dataset labeled as DEMO DATA only
- Docker: Compose environment for local orchestration

### Governance Principle

The platform is a decision-support system. It never autonomously approves government spending or makes binding policy decisions.

### Architecture

Frontend
  ↓
API Gateway
  ↓
FastAPI Backend
  ↓
PostgreSQL + PostGIS
  ↓
Synthetic Data + future AI services

## Future Phases

Phase 2: citizen request workflows and multilingual AI
Phase 3: GIS clustering and hotspot detection
Phase 4: infrastructure gap and priority engines
Phase 5: governance AI copilot and scenario simulation
