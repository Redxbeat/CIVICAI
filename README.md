# CIVICAI

CIVICAI is a multilingual, AI-powered Digital Public Good prototype for infrastructure demand intelligence.

This repository contains the Phase 1 foundation:

- Monorepo structure
- PostgreSQL + PostGIS database
- FastAPI backend
- Next.js frontend shell
- Basic authentication
- Initial schema and synthetic demo data
- Docker Compose orchestration
- Health check and dashboard endpoints

## Phase 1 Deliverables

1. Project architecture
2. Repository structure
3. Docker environment
4. PostgreSQL database
5. PostGIS
6. FastAPI backend
7. React/Next.js frontend
8. Basic authentication
9. Initial database schema
10. Basic dashboard shell
11. Synthetic demo dataset
12. Health-check API

## Quick Start

```bash
cd civicai
cp .env.example .env
docker compose up --build
```

Then open:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8001/docs

## Demo Credentials

- Username: `admin@civicai.gov`
- Password: `CivicAI123!`

## Important Note

All demo data is synthetic and clearly marked as DEMO DATA only.
