# CIVICAI AI Services

Multilingual AI Pipeline, Language Processing, Infrastructure Classification, Entity Extraction, and Triage Engine.

---

## 🤖 Modules

- `language_service.py`: Language detection (Malayalam, Hindi, English, Tamil, Kannada) & translation layer.
- `classification_service.py`: Infrastructure categorization, subcategory mapping, and urgency scoring.
- `extraction_service.py`: Entity extraction (locations, infrastructure terms, urgency signals).
- `triage_service.py`: Agency routing matrix, SLA computation, and triage score engine.
- `pipeline.py`: End-to-end processing pipeline (`process_citizen_input`).
- `main.py`: Standalone FastAPI microservice server (`http://localhost:8002`).

---

## 🚀 Running the AI Microservice

```bash
cd civicai/ai-services
pip install -r requirements.txt
python main.py
```

### Endpoints
- `GET /health`: Microservice health check
- `POST /process`: Complete intake pipeline
- `POST /detect-language`: Language detection & translation
- `POST /classify`: Infrastructure classification & urgency
- `POST /extract-entities`: Entity extraction
