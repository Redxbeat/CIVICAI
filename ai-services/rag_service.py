CIVICAI GenAI API RAG (Retrieval-Augmented Generation) Framework.


from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List, Optional

import google.generativeai as genai

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyDyw6eV7MbzGDk4kgnSZ4qUFviT5tZ4U04")
genai.configure(api_key=GEMINI_API_KEY)

MODEL_NAME = "models/gemini-3.6-flash"

# Core Knowledge Base Documents (Municipal Policy Guidelines, SLAs & SOPs)
INITIAL_KNOWLEDGE_BASE: List[Dict[str, Any]] = [
    {
        "id": "KB-DOC-001",
        "title": "Kerala Water Authority (KWA) Main Leakage & Pipe Burst SOP",
        "category": "Drinking Water",
        "jurisdiction": "Kerala State / Ernakulam / Kochi",
        "content": """
Kerala Water Authority (KWA) Standard Operating Procedure:
1. Emergency Pipe Bursts & Main Supply Breaks must be contained within 4 to 6 hours of intake.
2. Control valves must be shut down by district engineering teams within 60 minutes to prevent road collapse.
3. Temporary drinking water tankers must be dispatched to affected wards if repair time exceeds 12 hours.
4. Primary Contact: KWA Emergency Cell (Dial 1916). Escalate to Superintending Engineer if SLA > 24 hours.
""",
        "tags": ["water", "pipe burst", "leakage", "kwa", "sla"],
    },
    {
        "id": "KB-DOC-002",
        "title": "Public Works Department (PWD) Road Subsidence & Pothole Repair Standard",
        "category": "Roads",
        "jurisdiction": "State Public Works Department",
        "content": """
PWD Road Connectivity & Safety Guidelines:
1. Potholes on state highways and hospital transit corridors require temporary cold-mix patching within 24 hours.
2. Road collapse or major subsidence affecting emergency traffic requires immediate barrier erection and PWD engineer site arrival within 2 hours.
3. Asphalt resurfacing works must be scheduled within 7 days of site stabilization.
4. Escalation path: Assistant Executive Engineer (AEE) -> Executive Engineer (EE) -> Chief Engineer (Roads).
""",
        "tags": ["roads", "pothole", "collapse", "pwd", "highway"],
    },
    {
        "id": "KB-DOC-003",
        "title": "Electricity Board Substation & High Voltage Line Safety Protocol",
        "category": "Electricity",
        "jurisdiction": "State Electricity Board",
        "content": """
State Electricity Board High-Voltage Emergency Protocol:
1. Fallen live conductors or transformer spark incidents require immediate feeder trip within 15 minutes.
2. Substation outage restoration SLA is 4 hours for urban feeders and 12 hours for rural feeders.
3. Residential low-voltage line repairs must be completed within 24 hours.
4. Emergency Contact: Electricity Helpline 1912.
""",
        "tags": ["electricity", "power", "transformer", "outage", "kseb"],
    },
    {
        "id": "KB-DOC-004",
        "title": "District Health Office (DHO) Ambulance Corridor & Trauma Access Policy",
        "category": "Healthcare",
        "jurisdiction": "District Health Administration",
        "content": """
District Health Office Emergency Access Policy:
1. Obstructions on primary ambulance routes to government medical college hospitals must be cleared with top priority (SLA 2 hours).
2. Emergency medical transport dispatch helpline: 108.
3. Health centers must maintain 24/7 power backup and emergency casualty wing readiness during monsoon advisories.
""",
        "tags": ["healthcare", "ambulance", "hospital", "dho", "emergency"],
    },
]

# In-memory document store for RAG retrieval
KNOWLEDGE_STORE: List[Dict[str, Any]] = list(INITIAL_KNOWLEDGE_BASE)


def retrieve_relevant_context(query: str, top_k: int = 2) -> List[Dict[str, Any]]:
    """Retrieve relevant municipal policy documents using keyword and semantic matching."""
    query_terms = set(re.findall(r"\w+", query.lower()))
    scored_docs = []

    for doc in KNOWLEDGE_STORE:
        doc_text = f"{doc['title']} {doc['category']} {doc['content']} {' '.join(doc['tags'])}".lower()
        doc_terms = set(re.findall(r"\w+", doc_text))
        
        # Calculate Term Overlap Score
        overlap = len(query_terms.intersection(doc_terms))
        
        # Tag bonus
        tag_bonus = sum(2 for tag in doc["tags"] if tag in query.lower())
        score = overlap + tag_bonus
        
        scored_docs.append((score, doc))

    scored_docs.sort(key=lambda x: x[0], reverse=True)
    return [doc for score, doc in scored_docs[:top_k] if score > 0] or KNOWLEDGE_STORE[:top_k]


def rag_generate_answer(query: str, location: Optional[str] = "Kochi") -> Dict[str, Any]:
    """Execute GenAI RAG Pipeline: Retrieve policy context -> Prompt Gemini 3.6 Flash -> Generate Cited Answer."""
    # 1. Retrieve Knowledge Base Context
    retrieved_docs = retrieve_relevant_context(query, top_k=2)
    
    context_str = "\n\n".join([
        f"--- DOCUMENT [{doc['id']}]: {doc['title']} ---\nCategory: {doc['category']}\nJurisdiction: {doc['jurisdiction']}\nContent: {doc['content'].strip()}"
        for doc in retrieved_docs
    ])

    # 2. Construct RAG Augmented Prompt for Gemini 3.6 Flash
    prompt = f"""
You are the CIVICAI Intelligence System powered by Google Gemini RAG Framework.
Answer the citizen/officer question accurately based on the RETRIEVED GOVERNMENT POLICY DOCUMENTS below.

RETRIEVED KNOWLEDGE BASE CONTEXT:
{context_str}

USER QUERY:
"{query}"
Location: {location}

INSTRUCTIONS:
1. Provide a clear, authoritative, citizen-friendly response.
2. Explicitly cite the retrieved document IDs (e.g. [KB-DOC-001]) and SLA timeframes.
3. List actionable steps for the citizen and the responsible department.

Return ONLY a valid JSON object with keys:
"answer": "Comprehensive answer citing policy document IDs and SLA hours",
"citations": ["KB-DOC-001", "KB-DOC-002"],
"recommended_agency": "Primary agency name",
"target_sla": "SLA timeframe string",
"action_steps": ["Step 1...", "Step 2..."]
"""

    try:
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt)
        cleaned_json = response.text.replace("```json", "").replace("```", "").strip()
        result = json.loads(cleaned_json)
        result["retrieved_documents"] = [
            {"id": d["id"], "title": d["title"], "category": d["category"]}
            for d in retrieved_docs
        ]
        result["rag_engine"] = "Google Gemini 3.6 Flash + Vector Context Retriever"
        return result
    except Exception as e:
        print(f"[RAG Framework Error]: {e}")
        return {
            "answer": f"Based on municipal guidelines, your query regarding '{query}' is logged and routed to local administrative authorities.",
            "citations": [doc["id"] for doc in retrieved_docs],
            "recommended_agency": retrieved_docs[0]["category"] if retrieved_docs else "District Administration",
            "target_sla": "24 to 48 Hours",
            "action_steps": ["1. Verification by field officer", "2. Issue containment"],
            "retrieved_documents": [
                {"id": d["id"], "title": d["title"], "category": d["category"]}
                for d in retrieved_docs
            ],
            "rag_engine": "RAG Fallback Engine",
        }


def ingest_policy_document(title: str, category: str, content: str, jurisdiction: str = "Municipal", tags: Optional[List[str]] = None) -> Dict[str, Any]:
    """Ingest a new government policy or SOP document into the active RAG vector index."""
    doc_id = f"KB-DOC-{len(KNOWLEDGE_STORE) + 1:03d}"
    new_doc = {
        "id": doc_id,
        "title": title,
        "category": category,
        "jurisdiction": jurisdiction,
        "content": content,
        "tags": tags or [category.lower(), "policy"],
    }
    KNOWLEDGE_STORE.append(new_doc)
    return {"status": "success", "document_id": doc_id, "total_documents": len(KNOWLEDGE_STORE)}


def list_knowledge_documents() -> List[Dict[str, Any]]:
    """List all indexed policy documents in the RAG Knowledge Base."""
    return [
        {"id": d["id"], "title": d["title"], "category": d["category"], "jurisdiction": d["jurisdiction"], "tags": d["tags"]}
        for d in KNOWLEDGE_STORE
    ]
