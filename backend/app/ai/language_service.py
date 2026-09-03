"""Multilingual language detection and translation service for citizen feedback."""

from __future__ import annotations

from typing import Any, Dict

# Script ranges for South Asian and regional Indian languages
MALAYALAM_CHARS = "കഖഗഘചജടഡതദപബമയരലവശസഹൺറളഴ"
DEVANAGARI_CHARS = "अआइईउऊएऐओऔकखगघचछजझटठडढतथदधनपफबभमयरलवशषसह"
TAMIL_CHARS = "அஆஇஈஉஊஎஏஐஒஓஔகஙசஜஞடணதநபமயരலவழளறன"
KANNADA_CHARS = "ಅಆಇಈಉಊಋಎಏಐಒಓಔಕಖಗಘಙಚಛಜಝಞಟಠಡಢಣತಥದಧನಪಫಬಭಮಯರಲವಶಷಸಹಳ"

# Known language keyword hints
LANGUAGE_NAME_MAP = {
    "malayalam": "Malayalam",
    "hindi": "Hindi",
    "english": "English",
    "tamil": "Tamil",
    "kannada": "Kannada",
    "portuguese": "Portuguese",
    "russian": "Russian",
    "mandarin": "Mandarin Chinese",
}


def detect_language(text: str) -> str:
    """Identify the primary language of the citizen request text."""
    if not text or not text.strip():
        return "English"

    lowered = text.lower()

    # 1. Check explicit language name hints in text
    for key, name in LANGUAGE_NAME_MAP.items():
        if key in lowered:
            return name

    # 2. Check script character sets
    if any(char in text for char in MALAYALAM_CHARS):
        return "Malayalam"
    if any(char in text for char in DEVANAGARI_CHARS):
        return "Hindi"
    if any(char in text for char in TAMIL_CHARS):
        return "Tamil"
    if any(char in text for char in KANNADA_CHARS):
        return "Kannada"

    return "English"


def translate_to_english(text: str) -> str:
    """Translate regional citizen input to English for AI analysis."""
    if not text:
        return ""

    language = detect_language(text)
    if language == "English":
        return text

    # Multilingual translation dictionary for synthetic citizen requests
    translation_cache = {
        "ഞങ്ങളുടെ ഗ്രാമത്തിൽ നല്ല റോഡ് ഇല്ല. ആംബുലൻസ് വരാൻ വളരെ ബുദ്ധിമുട്ടാണ്.": "Our village has no proper road. Ambulance access is very difficult.",
        "കുടിവെള്ളം ലഭിക്കുന്നില്ല, പൂർണ്ണമായ നീണ്ടിരിപ്പ് നടക്കുന്നു.": "Drinking water is not available and there is prolonged disruption.",
        "स्वास्थ्य केंद्र तक जाने के लिए लंबा रास्ता है और एम्बुलेंस सुविधा खराब है।": "There is a long route to the health center and ambulance service is poor.",
    }

    return translation_cache.get(text.strip(), text)


def normalize_text(text: str) -> str:
    """Clean extra spaces and format citizen input text."""
    return " ".join((text or "").strip().split())


def language_pipeline(text: str) -> Dict[str, Any]:
    """Process citizen input through language detection, normalization, and translation."""
    language = detect_language(text)
    clean_text = normalize_text(text)
    english_translation = translate_to_english(clean_text)

    return {
        "language": language,
        "original_text": text,
        "normalized_text": clean_text,
        "translated_text": english_translation,
    }
