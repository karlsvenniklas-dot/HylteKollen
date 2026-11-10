#!/usr/bin/env python3
"""Import identity-verified historical protocols from Hylte MeetingPlus.

Stable IDs, source hashes and observed versions are retained. Failed fetches
and missing links never remove earlier verified records or observations.
"""

from __future__ import annotations

import argparse
import hashlib
import html.parser
import json
import re
import subprocess
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parents[1]
HISTORY_PATH = ROOT / "data" / "history-coverage.json"
OUTPUT_PATH = ROOT / "data" / "historical-protocols.json"
INDEX_PATH = ROOT / "data" / "historical-protocol-index.json"
USER_AGENT = "Hyltekollen/1.0 (+source registry)"
YEAR_FROM = 2022

BODIES = [
    {"slug": "kommunfullmaktige", "code": "kf", "name": "Kommunfullmäktige", "pattern": r"Kommunfullmäktige"},
    {"slug": "kommunstyrelsen", "code": "ks", "name": "Kommunstyrelsen", "pattern": r"Kommunstyrelsen"},
    {"slug": "kommunstyrelsens-arbetsutskott", "code": "ksau", "name": "Kommunstyrelsens arbetsutskott", "pattern": r"Kommunstyrelsens\s+arbetsutskott"},
    {"slug": "barn-och-ungdomsnamnden", "code": "bun", "name": "Barn- och ungdomsnämnden", "pattern": r"Barn-\s*och\s+ungdomsnämnden"},
    {"slug": "kultur-och-folkhalsonamnden", "code": "kfn", "name": "Kultur- och folkhälsonämnden", "pattern": r"Kultur-\s*och\s+folkhälsonämnden"},
    {"slug": "omsorgsnamnden", "code": "on", "name": "Omsorgsnämnden", "pattern": r"Omsorgsnämnden"},
    {"slug": "samhallsbyggnadsnamnden", "code": "sbn", "name": "Samhällsbyggnadsnämnden", "pattern": r"Samhällsbyggnadsnämnden"},
    {"slug": "tillsynsnamnden", "code": "tsn", "name": "Tillsynsnämnden", "pattern": r"Tillsynsnämnden"},
    {"slug": "personalutskott", "code": "pu", "name": "Personalutskottet", "pattern": r"Personalutskott(?:et)?"},
    {"slug": "tillvaxtutskott", "code": "tu", "name": "Tillväxtutskottet", "pattern": r"Tillväxtutskott(?:et)?"},
    {"slug": "valnamnden", "code": "vn", "name": "Valnämnden", "pattern": r"Valnämnden"},
    {"slug": "kommunala-pensionarsradet", "code": "kpr", "name": "Kommunala pensionärsrådet", "pattern": r"Kommunala\s+pensionärsrådet"},
    {"slug": "kommunala-tillganglighetsradet", "code": "ktr", "name": "Kommunala tillgänglighetsrådet", "pattern": r"Kommunala\s+tillgänglighetsrådet"},
    {"slug": "folkhalso-och-trygghetsradet", "code": "ftr", "name": "Folkhälso- och trygghetsrådet", "pattern": r"Folkhälso-\s*och\s+trygghetsrådet"},
]


class MainProtocolParser(html.parser.HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.href: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "a":
            return
        values = dict(attrs)
        href = values.get("href") or ""
        if values.get("id") == "openProtocol" and "/protocol/" in href:
            self.href = href


def read_json(path: Path, fallback: dict) -> dict:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else fallback


def write_json(path: Path, value: dict) -> None:
    text = json.dumps(value, ensure_ascii=False, indent=2) + "\n"
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(text, encoding="utf-8")
    temporary.replace(path)


def fetch(url: str, attempts: int = 3) -> tuple[bytes, str]:
    last_error = "unknown fetch error"
    for attempt in range(attempts):
        result = subprocess.run(
            ["curl", "-fsSL", "--max-time", "35", "-A", USER_AGENT, "-w", "\n%{content_type}", url],
            capture_output=True,
        )
        if result.returncode == 0 and b"\n" in result.stdout:
            body, content_type = result.stdout.rsplit(b"\n", 1)
            return body, content_type.decode("ascii", "replace").split(";", 1)[0]
        last_error = result.stderr.decode("utf-8", "replace").strip() or f"curl exit {result.returncode}"
        if attempt + 1 < attempts:
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(last_error)


def extract_pages(pdf: bytes) -> tuple[list[str], int]:
    with tempfile.NamedTemporaryFile(suffix=".pdf") as source:
        source.write(pdf)
        source.flush()
        extracted = subprocess.run(["pdftotext", "-layout", source.name, "-"], check=True, capture_output=True)
        info = subprocess.run(["pdfinfo", source.name], check=True, capture_output=True, text=True).stdout
    pages = [page.strip() for page in extracted.stdout.decode("utf-8", "replace").split("\f")]
    while pages and not pages[-1]:
        pages.pop()
    match = re.search(r"^Pages:\s+(\d+)", info, re.MULTILINE)
    page_count = int(match.group(1)) if match else len(pages)
    if len(pages) < page_count:
        pages.extend([""] * (page_count - len(pages)))
    return pages[:page_count], page_count


def identity_checks(pages: list[str], meeting_date: str, body: dict) -> tuple[list[str], list[str]]:
    header = "\n".join(pages[:5])
    rules = [
        ("MÖTESPROTOKOLL", bool(re.search(r"(?:MÖTES|SAMMANTRÄDES)PROTOKOLL", header, re.I))),
        (body["name"], bool(re.search(body["pattern"], header, re.I))),
        (meeting_date, meeting_date in header),
        ("justerat", bool(re.search(r"Protokollet är justerat|Justeringens plats och tid|Justerat den", header, re.I))),
    ]
    return ([label for label, passed in rules if passed], [label for label, passed in rules if not passed])


def cache_path(cache_dir: Path | None, body: dict, meeting_date: str) -> Path | None:
    return cache_dir / f"{body['code']}-{meeting_date}.pdf" if cache_dir else None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache-dir", type=Path, help="Optional resumable local PDF cache.")
    parser.add_argument("--only", help="Comma-separated committee slugs to import.")
    args = parser.parse_args()
    selected = BODIES
    if args.only:
        allowed = {value.strip() for value in args.only.split(",") if value.strip()}
        selected = [body for body in BODIES if body["slug"] in allowed]
        unknown = allowed - {body["slug"] for body in selected}
        if unknown:
            raise SystemExit("Unknown committee slug(s): " + ", ".join(sorted(unknown)))
    if args.cache_dir:
        args.cache_dir.mkdir(parents=True, exist_ok=True)

    now = datetime.now(timezone.utc).isoformat()
    today = date.today().isoformat()
    previous = read_json(OUTPUT_PATH, {"records": [], "observedProtocolLinks": [], "coverage": [], "issues": []})
    history = read_json(HISTORY_PATH, {})
    body_by_slug = {body["slug"]: body for body in BODIES}
    records: dict[tuple[str, str], dict] = {}
    for record in previous.get("records", []):
        slug = record.get("bodySlug") or "kommunfullmaktige"
        records[(slug, record["meetingDate"])] = {**record, "bodySlug": slug, "bodyCode": body_by_slug[slug]["code"]}
    old_links: dict[tuple[str, str], str] = {}
    for row in previous.get("observedProtocolLinks", []):
        if "/protocol/" in row.get("url", ""):
            old_links[(row.get("bodySlug", "kommunfullmaktige"), row["meetingDate"])] = row["url"]
    for row in history.get("observedProtocolLinks", []):
        if "/protocol/" in row.get("url", ""):
            old_links.setdefault(("kommunfullmaktige", row["meetingDate"]), row["url"])
    observed_links = dict(old_links)
    issues: list[dict] = []

    def discover_index(body: dict) -> tuple[dict, list[str], str | None]:
        index_url = f"https://meetings.hylte.se/committees/{body['slug']}"
        try:
            page, content_type = fetch(index_url)
            if content_type != "text/html":
                raise RuntimeError(f"unexpected index content type: {content_type}")
            pattern = rf"/committees/{re.escape(body['slug'])}/mote-(20\d\d-\d\d-\d\d)"
            dates = sorted({value for value in re.findall(pattern, page.decode("utf-8", "replace")) if str(YEAR_FROM) <= value[:4] and value <= today})
            return body, dates, None
        except Exception as error:
            return body, [], str(error)

    with ThreadPoolExecutor(max_workers=8) as executor:
        index_results = list(executor.map(discover_index, selected))
    meetings: list[tuple[dict, str]] = []
    listed_by_slug: dict[str, list[str]] = {}
    for body, dates, error in index_results:
        listed_by_slug[body["slug"]] = dates
        if error:
            issues.append({"bodySlug": body["slug"], "body": body["name"], "stage": "committee_index", "status": "fetch_failed", "detail": error[:240]})
        meetings.extend((body, meeting_date) for meeting_date in dates)

    def discover_meeting(entry: tuple[dict, str]) -> tuple[dict, str, str | None, str | None]:
        body, meeting_date = entry
        meeting_url = f"https://meetings.hylte.se/committees/{body['slug']}/mote-{meeting_date}"
        try:
            page, content_type = fetch(meeting_url)
            if content_type != "text/html":
                raise RuntimeError(f"unexpected meeting-page content type: {content_type}")
            protocol_parser = MainProtocolParser()
            protocol_parser.feed(page.decode("utf-8", "replace"))
            protocol_url = urljoin(meeting_url, protocol_parser.href) if protocol_parser.href else None
            return body, meeting_date, protocol_url, None
        except Exception as error:
            return body, meeting_date, None, str(error)

    with ThreadPoolExecutor(max_workers=12) as executor:
        discoveries = list(executor.map(discover_meeting, meetings))

    candidates: list[tuple[dict, str, str]] = []
    for body, meeting_date, protocol_url, error in discoveries:
        key = (body["slug"], meeting_date)
        if error:
            issues.append({"bodySlug": body["slug"], "body": body["name"], "meetingDate": meeting_date, "stage": "meeting_page", "status": "fetch_failed", "detail": error[:240]})
            continue
        if not protocol_url:
            if key in old_links:
                issues.append({"bodySlug": body["slug"], "body": body["name"], "meetingDate": meeting_date, "stage": "discovery", "status": "previous_link_not_observed", "detail": "Tidigare observerad protokolllänk bevaras för granskning."})
            continue
        observed_links[key] = protocol_url
        candidates.append((body, meeting_date, protocol_url))

    def import_protocol(candidate: tuple[dict, str, str]) -> tuple[dict, str, dict | None, str | None]:
        body, meeting_date, protocol_url = candidate
        try:
            cached = cache_path(args.cache_dir, body, meeting_date)
            if cached and cached.exists():
                pdf, content_type = cached.read_bytes(), "application/pdf"
            else:
                pdf, content_type = fetch(protocol_url)
                if cached and content_type == "application/pdf" and pdf.startswith(b"%PDF-"):
                    cached.write_bytes(pdf)
            if content_type != "application/pdf" or not pdf.startswith(b"%PDF-"):
                raise RuntimeError(f"unexpected protocol content type: {content_type}")
            pages, page_count = extract_pages(pdf)
            checks, failures = identity_checks(pages, meeting_date, body)
            if failures:
                raise RuntimeError("identity checks failed: " + ", ".join(failures))
            digest = hashlib.sha256(pdf).hexdigest()
            old = records.get((body["slug"], meeting_date), {})
            versions = list(old.get("versions", []))
            if digest not in {version.get("sha256") for version in versions}:
                versions.append({"sha256": digest, "observedAt": now, "pageCount": page_count})
            meeting_url = f"https://meetings.hylte.se/committees/{body['slug']}/mote-{meeting_date}"
            record = {
                "id": f"{body['code']}-protokoll-{meeting_date}", "kind": "historical_protocol",
                "title": f"Justerat protokoll – {body['name']} {meeting_date}", "body": body["name"],
                "bodySlug": body["slug"], "bodyCode": body["code"], "meetingDate": meeting_date,
                "meetingUrl": meeting_url, "url": protocol_url, "checkedAt": now, "sha256": digest,
                "fetchStatus": "ok", "pageCount": page_count, "pages": pages,
                "identityChecks": checks, "status": "published_verified", "versions": versions,
            }
            return body, meeting_date, record, None
        except Exception as error:
            return body, meeting_date, None, str(error)

    with ThreadPoolExecutor(max_workers=6) as executor:
        imported = list(executor.map(import_protocol, candidates))
    for body, meeting_date, record, error in imported:
        if record:
            records[(body["slug"], meeting_date)] = record
        else:
            issues.append({"bodySlug": body["slug"], "body": body["name"], "meetingDate": meeting_date, "stage": "protocol_pdf", "status": "fetch_or_identity_failed", "url": observed_links[(body["slug"], meeting_date)], "detail": (error or "unknown error")[:240]})

    ordered_records = sorted(records.values(), key=lambda item: (item["meetingDate"], item["body"]), reverse=True)
    coverage_by_slug = {row.get("bodySlug"): row for row in previous.get("coverage", [])}
    for body in selected:
        dates = listed_by_slug.get(body["slug"], [])
        observed_count = sum(1 for slug, _ in observed_links if slug == body["slug"])
        verified_count = sum(1 for record in ordered_records if record["bodySlug"] == body["slug"])
        coverage_by_slug[body["slug"]] = {
            "body": body["name"], "bodySlug": body["slug"], "bodyCode": body["code"],
            "yearFrom": YEAR_FROM, "yearTo": int(today[:4]), "listedMeetings": len(dates),
            "pastOrCurrentMeetings": len(dates), "protocolLinksObserved": observed_count,
            "verifiedProtocolDocuments": verified_count, "noMainProtocolLinkObserved": max(0, len(dates) - observed_count),
            "importComplete": len(dates) == verified_count,
        }
    observed = [{"bodySlug": slug, "meetingDate": meeting_date, "url": url} for (slug, meeting_date), url in sorted(observed_links.items())]
    output = {
        "schemaVersion": 2, "checkedAt": now,
        "scope": {"publisher": "Hylte kommun", "yearFrom": YEAR_FROM, "yearTo": int(today[:4]), "bodies": [body["name"] for body in BODIES]},
        "method": "Fulltext hämtas endast från huvudprotokollet på rätt MeetingPlus-mötessida och publiceras först efter kontroll av organ, mötesdatum och justeringsmarkör.",
        "coverage": sorted(coverage_by_slug.values(), key=lambda row: row["body"]),
        "observedProtocolLinks": observed, "records": ordered_records, "issues": issues,
    }
    write_json(OUTPUT_PATH, output)
    public_records = [
        {key: record[key] for key in ["id", "meetingDate", "body", "bodySlug", "bodyCode", "url", "pageCount", "sha256", "checkedAt", "identityChecks", "status"]}
        for record in ordered_records
    ]
    write_json(INDEX_PATH, {
        "schemaVersion": 1,
        "checkedAt": now,
        "scope": output["scope"],
        "method": output["method"],
        "coverage": output["coverage"],
        "records": public_records,
        "summary": {
            "bodiesChecked": len(output["coverage"]),
            "bodiesWithVerifiedProtocols": len({record["bodySlug"] for record in ordered_records}),
            "listedMeetings": sum(row["pastOrCurrentMeetings"] for row in output["coverage"]),
            "verifiedProtocols": len(ordered_records),
            "searchablePages": sum(record["pageCount"] for record in ordered_records),
            "meetingPagesWithoutMainProtocolLink": sum(row["noMainProtocolLinkObserved"] for row in output["coverage"]),
        },
    })

    kf_records = sorted((record for record in ordered_records if record["bodySlug"] == "kommunfullmaktige"), key=lambda item: item["meetingDate"])
    kf_links = [{"meetingDate": meeting_date, "url": url} for (slug, meeting_date), url in sorted(observed_links.items()) if slug == "kommunfullmaktige"]
    if history:
        kf_dates = [meeting_date for year in history.get("years", []) for meeting_date in year.get("dates", []) if meeting_date <= today]
        history["checkedAt"] = today
        history["summary"].update({"pastOrCurrentMeetings": len(kf_dates), "futureMeetings": history["summary"]["listedMeetings"] - len(kf_dates), "protocolLinksObserved": len(kf_links), "verifiedProtocolDocuments": len(kf_records), "protocolLinksAwaitingIdentityCheck": max(0, len(kf_links) - len(kf_records)), "noMainProtocolLinkObserved": max(0, len(kf_dates) - len(kf_links)), "historyImportComplete": len(kf_dates) == len(kf_records)})
        history["verifiedProtocols"] = [{key: record[key] for key in ["id", "meetingDate", "body", "url", "pageCount", "sha256", "checkedAt", "identityChecks", "status"]} for record in kf_records]
        history["observedProtocolLinks"] = kf_links
        write_json(HISTORY_PATH, history)

    print(json.dumps({"bodiesChecked": len(selected), "meetingsChecked": sum(row["pastOrCurrentMeetings"] for row in coverage_by_slug.values()), "protocolLinksObserved": len(observed), "verifiedProtocols": len(ordered_records), "searchablePages": sum(record["pageCount"] for record in ordered_records), "issues": len(issues)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
