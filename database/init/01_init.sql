CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'CITIZEN',
    is_active BOOLEAN DEFAULT TRUE,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS citizen_requests (
    id SERIAL PRIMARY KEY,
    request_id VARCHAR(100) UNIQUE NOT NULL,
    citizen_id VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    language VARCHAR(50) DEFAULT 'Malayalam',
    original_text TEXT NOT NULL,
    translated_text TEXT,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    location VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    administrative_region VARCHAR(255),
    urgency DOUBLE PRECISION DEFAULT 0,
    severity VARCHAR(50) DEFAULT 'medium',
    population_affected INTEGER DEFAULT 0,
    infrastructure_type VARCHAR(100),
    sentiment VARCHAR(50) DEFAULT 'neutral',
    verification_status VARCHAR(50) DEFAULT 'pending',
    duplicate_probability DOUBLE PRECISION DEFAULT 0,
    ai_confidence DOUBLE PRECISION DEFAULT 0,
    evidence TEXT,
    status VARCHAR(50) DEFAULT 'submitted',
    normalized_content TEXT,
    extracted_entities JSONB,
    content_quality VARCHAR(50) DEFAULT 'good',
    triage_score DOUBLE PRECISION DEFAULT 0,
    severity_band VARCHAR(50) DEFAULT 'medium',
    routed_agency VARCHAR(255),
    backup_agencies JSONB,
    escalation_level VARCHAR(50) DEFAULT 'normal',
    sla_hours INTEGER DEFAULT 0,
    escalation_priority INTEGER DEFAULT 3,
    created_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    assigned_to VARCHAR(255),
    assigned_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);
CREATE INDEX IF NOT EXISTS ix_citizen_requests_request_id ON citizen_requests(request_id);
CREATE INDEX IF NOT EXISTS ix_citizen_requests_location ON citizen_requests(location);
CREATE INDEX IF NOT EXISTS ix_citizen_requests_category ON citizen_requests(category);
CREATE INDEX IF NOT EXISTS ix_citizen_requests_language ON citizen_requests(language);
CREATE INDEX IF NOT EXISTS idx_citizen_requests_geom ON citizen_requests USING GIST (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));

INSERT INTO users (email, full_name, role, is_active, password_hash)
VALUES (
    'admin@civicai.gov',
    'CIVICAI Admin',
    'ADMIN',
    TRUE,
    '$2b$12$MDxEj3wNki5wJg7YkI2P6OQhIB.sHOgdrt2xRBPmZ9Bz6Ykp7.U8S'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO citizen_requests (
    request_id, citizen_id, language, original_text, translated_text, category, subcategory,
    location, latitude, longitude, administrative_region, urgency, severity, population_affected,
    infrastructure_type, sentiment, verification_status, duplicate_probability, ai_confidence,
    evidence, status, normalized_content, extracted_entities, content_quality, triage_score,
    severity_band, routed_agency, backup_agencies, escalation_level, sla_hours, escalation_priority
) VALUES
('CIV-000001', 'anon-citizen-001', 'Malayalam', 'ഞങ്ങളുടെ ഗ്രാമത്തിൽ നല്ല റോഡ് ഇല്ല. ആംബുലൻസ് വരാൻ വളരെ ബുദ്ധിമുട്ടാണ്.', 'Our village has no proper road. Ambulance access is very difficult.', 'Roads', 'Road Connectivity', 'Kochi', 9.967, 76.2458, 'Ernakulam', 9.2, 'high', 4200, 'Roads', 'concerned', 'pending', 0.18, 0.94, 'Road complaint with emergency access issue and local geographic cluster.', 'submitted', 'Our village has no proper road. Ambulance access is very difficult.', '{"locations": ["Kochi"], "infrastructure_terms": ["road", "ambulance"], "urgency_keywords": ["difficult", "issue"]}', 'good', 8.76, 'critical', 'Public Works Department (PWD)', '["Municipal Engineering", "District Administration"]', 'high', 72, 1),
('CIV-000002', 'anon-citizen-002', 'Malayalam', 'കുടിവെള്ളം ലഭിക്കുന്നില്ല, പൂർണ്ണമായ നീണ്ടിരിപ്പ് നടക്കുന്നു.', 'Drinking water is not available and there is prolonged disruption.', 'Drinking Water', 'Water Supply', 'Thrissur', 10.5276, 76.2144, 'Thrissur', 7.8, 'medium', 3100, 'Water', 'frustrated', 'pending', 0.09, 0.9, 'Water scarcity complaint with repeat community pattern.', 'submitted', 'Drinking water is not available and there is prolonged disruption.', '{"locations": ["Thrissur"], "infrastructure_terms": ["water"], "urgency_keywords": ["not available"]}', 'good', 6.24, 'high', 'Water Authority', '["Public Health Engineering", "District Administration"]', 'normal', 48, 2),
('CIV-000003', 'anon-citizen-003', 'Hindi', 'स्वास्थ्य केंद्र तक जाने के लिए लंबा रास्ता है और एम्बुलेंस सुविधा खराब है।', 'There is a long route to the health center and ambulance service is poor.', 'Healthcare', 'Hospital Access', 'Palakkad', 10.7867, 76.6548, 'Palakkad', 8.9, 'high', 5800, 'Healthcare', 'worried', 'pending', 0.21, 0.92, 'Healthcare access issue with high urgency and vulnerable population.', 'submitted', 'There is a long route to the health center and ambulance service is poor.', '{"locations": ["Palakkad"], "infrastructure_terms": ["health center", "ambulance"], "urgency_keywords": ["poor"]}', 'good', 8.41, 'critical', 'District Health Officer (DHO)', '["Medical College", "District Administration"]', 'critical', 2, 1);
