"""Analytics service for request aggregation, metrics, and dashboards."""

from __future__ import annotations

from typing import Any, Dict, List


def compute_request_metrics(requests: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Aggregate metrics across a batch of requests."""
    if not requests:
        return {
            "total_requests": 0,
            "by_category": {},
            "by_status": {},
            "by_language": {},
            "by_urgency_band": {},
            "average_triage_score": 0.0,
            "critical_count": 0,
        }

    metrics = {
        "total_requests": len(requests),
        "by_category": {},
        "by_status": {},
        "by_language": {},
        "by_urgency_band": {},
        "urgency_stats": {"min": 10.0, "max": 0.0, "avg": 0.0},
        "critical_count": 0,
        "high_count": 0,
    }

    total_urgency = 0.0
    for req in requests:
        category = req.get("category", "Unknown")
        status = req.get("status", "unknown")
        language = req.get("language", "Unknown")
        severity_band = req.get("severity_band", "medium")
        urgency = req.get("urgency", 0.0)

        metrics["by_category"][category] = metrics["by_category"].get(category, 0) + 1
        metrics["by_status"][status] = metrics["by_status"].get(status, 0) + 1
        metrics["by_language"][language] = metrics["by_language"].get(language, 0) + 1
        metrics["by_urgency_band"][severity_band] = metrics["by_urgency_band"].get(severity_band, 0) + 1

        if severity_band == "critical":
            metrics["critical_count"] += 1
        elif severity_band == "high":
            metrics["high_count"] += 1

        total_urgency += urgency
        metrics["urgency_stats"]["min"] = min(metrics["urgency_stats"]["min"], urgency)
        metrics["urgency_stats"]["max"] = max(metrics["urgency_stats"]["max"], urgency)

    metrics["urgency_stats"]["avg"] = round(total_urgency / len(requests), 2)
    metrics["average_triage_score"] = round(
        sum(r.get("triage_score", 0.0) for r in requests) / len(requests), 2
    )

    return metrics


def compute_agency_workload(
    requests: List[Dict[str, Any]],
) -> Dict[str, Dict[str, Any]]:
    """Aggregate requests by routed agency for workload balancing."""
    workload = {}
    for req in requests:
        agency = req.get("routed_agency", "Unassigned")
        status = req.get("status", "submitted")

        if agency not in workload:
            workload[agency] = {
                "total_queue": 0,
                "critical": 0,
                "high": 0,
                "medium": 0,
                "low": 0,
                "status_breakdown": {},
                "avg_sla_hours": 0,
            }

        workload[agency]["total_queue"] += 1
        severity_band = req.get("severity_band", "medium")
        workload[agency][severity_band] = workload[agency].get(severity_band, 0) + 1
        workload[agency]["status_breakdown"][status] = workload[agency]["status_breakdown"].get(status, 0) + 1
        workload[agency]["avg_sla_hours"] += req.get("sla_hours", 0)

    for agency in workload:
        if workload[agency]["total_queue"] > 0:
            workload[agency]["avg_sla_hours"] = round(
                workload[agency]["avg_sla_hours"] / workload[agency]["total_queue"], 1
            )

    return workload


def compute_geographic_hotspots(
    requests: List[Dict[str, Any]],
) -> Dict[str, Dict[str, Any]]:
    """Identify geographic regions with high concentration of issues."""
    hotspots = {}
    for req in requests:
        region = req.get("administrative_region", "Unknown")
        category = req.get("category", "Unknown")
        urgency = req.get("urgency", 0.0)
        population_affected = req.get("population_affected", 0)

        if region not in hotspots:
            hotspots[region] = {
                "total_requests": 0,
                "categories": {},
                "total_population_affected": 0,
                "avg_urgency": 0.0,
            }

        hotspots[region]["total_requests"] += 1
        hotspots[region]["categories"][category] = hotspots[region]["categories"].get(category, 0) + 1
        hotspots[region]["total_population_affected"] += population_affected
        hotspots[region]["avg_urgency"] += urgency

    for region in hotspots:
        if hotspots[region]["total_requests"] > 0:
            hotspots[region]["avg_urgency"] = round(
                hotspots[region]["avg_urgency"] / hotspots[region]["total_requests"], 2
            )

    return dict(sorted(hotspots.items(), key=lambda x: x[1]["total_requests"], reverse=True))


def compute_language_distribution(
    requests: List[Dict[str, Any]],
) -> Dict[str, Dict[str, Any]]:
    """Analyze language distribution and multilingual intake patterns."""
    distribution = {}
    for req in requests:
        language = req.get("language", "Unknown")
        category = req.get("category", "Unknown")

        if language not in distribution:
            distribution[language] = {
                "total": 0,
                "by_category": {},
                "avg_ai_confidence": 0.0,
            }

        distribution[language]["total"] += 1
        distribution[language]["by_category"][category] = distribution[language]["by_category"].get(category, 0) + 1
        distribution[language]["avg_ai_confidence"] += req.get("ai_confidence", 0.0)

    for lang in distribution:
        if distribution[lang]["total"] > 0:
            distribution[lang]["avg_ai_confidence"] = round(
                distribution[lang]["avg_ai_confidence"] / distribution[lang]["total"], 3
            )

    return distribution
