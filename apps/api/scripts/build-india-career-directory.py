#!/usr/bin/env python3
"""Convert the supplied India careers DOCX tables into a deterministic JSON catalog."""

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

from docx import Document


def canonical_url(value: str) -> str:
    value = value.strip()
    if not value or "{" in value:
        return value
    if not re.match(r"^https?://", value, flags=re.I):
        value = "https://" + value.lstrip("/")
    parts = urlsplit(value)
    path = re.sub(r"/{2,}", "/", parts.path).rstrip("/")
    return urlunsplit((parts.scheme.lower(), parts.netloc.lower(), path, parts.query, ""))


def slugify(value: str) -> str:
    value = re.sub(r"\([^)]*\)", "", value).lower()
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value or "source"


def table_kind(index: int) -> tuple[str, str]:
    if index == 0:
        return "job_portal", "licensed_connector_required"
    if index in (1, 2):
        return "government_jobs", "dedicated_adapter_required"
    if 3 <= index <= 30:
        return "company_career", "ats_or_jsonld_discovery"
    if index == 31:
        return "company_directory", "discovery_only"
    return "ats_pattern", "connector_pattern"


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: build-india-career-directory.py SOURCE.docx OUTPUT.json")
    source_path, output_path = map(Path, sys.argv[1:])
    document = Document(source_path)
    records = []
    seen = set()
    slug_counts = {}

    for table_index, table in enumerate(document.tables):
        source_kind, ingestion_mode = table_kind(table_index)
        for row in table.rows[1:]:
            values = [cell.text.strip() for cell in row.cells]
            if len(values) < 2 or not values[0] or not values[1]:
                continue
            name, raw_url = values[0], values[1]
            url = canonical_url(raw_url)
            dedupe_key = (source_kind, url.lower())
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)
            base_slug = slugify(name)
            slug_counts[base_slug] = slug_counts.get(base_slug, 0) + 1
            slug = base_slug if slug_counts[base_slug] == 1 else f"{base_slug}-{slug_counts[base_slug]}"
            records.append({
                "slug": slug,
                "name": name,
                "url": url,
                "sourceKind": source_kind,
                "ingestionMode": ingestion_mode,
                "enabled": False,
            })

    summary = {}
    for record in records:
        summary[record["sourceKind"]] = summary.get(record["sourceKind"], 0) + 1
    payload = {
        "sourceDocument": source_path.name,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "summary": summary,
        "sources": records,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
