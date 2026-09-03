import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_repo_structure_exists():
    required = [
        ROOT / 'backend',
        ROOT / 'frontend',
        ROOT / 'database',
        ROOT / 'docs',
        ROOT / 'docker-compose.yml',
    ]
    for path in required:
        assert path.exists(), f"Missing required path: {path}"


def test_docker_compose_has_expected_services():
    compose_path = ROOT / 'docker-compose.yml'
    text = compose_path.read_text(encoding='utf-8')
    assert 'database:' in text
    assert 'backend:' in text
    assert 'frontend:' in text
    assert 'redis:' in text


def test_readme_mentions_phase_1():
    readme = (ROOT / 'README.md').read_text(encoding='utf-8')
    assert 'Phase 1' in readme
