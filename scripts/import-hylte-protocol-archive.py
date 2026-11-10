#!/usr/bin/env python3
"""Collect Hylte's official SiteVision protocol archive.

Each PDF is retained by SiteVision file ID. Fetch failures never delete old
versions. Searchable records require PDF, date, body and adjustment checks.
"""
from __future__ import annotations

import concurrent.futures
import hashlib
import html
import json
import re
import subprocess
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote, urljoin
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "municipal-protocol-archive.json"
CACHE = ROOT / ".cache" / "hylte-protocols"
CURRENT = "https://www.hylte.se/kommun-och-politik/moten-och-protokoll"
ARCHIVE = CURRENT + "/aldre-protokoll"
UA = "Hyltekollen/1.0 (public municipal document index)"
BODIES = [
    ("Kommunfullmäktige", "kf", r"kommunfullmäktige"),
    ("Kommunstyrelsen", "ks", r"kommunstyrelsen"),
    ("Kommunstyrelsens arbetsutskott", "ksau", r"kommunstyrelsens\s+arbetsutskott"),
    ("Kommunstyrelsens personalutskott", "pu", r"kommunstyrelsens\s+personalutskott|personalutskottet"),
    ("Kommunstyrelsens tillväxtutskott", "tu", r"kommunstyrelsens\s+tillväxtutskott|tillväxtutskottet"),
    ("Kultur- och folkhälsonämnden", "kfn", r"kultur-\s*och\s+folkhälsonämnden"),
    ("Barn- och ungdomsnämnden", "bun", r"barn\s*-\s*och\s+ungdomsnämnden"),
    ("Omsorgsnämnden", "on", r"omsorgsnämnden"),
    ("Samhällsbyggnadsnämnden", "sbn", r"samhällsbyggnadsnämnden"),
    ("Tillsynsnämnden", "tsn", r"tillsynsnämnden"),
    ("Revisionen", "rev", r"revision(?:en)?|revisorerna"),
    ("Valnämnden", "vn", r"valnämnden"),
    ("Kommunala tillgänglighetsrådet", "ktr", r"kommunala\s+tillgänglighetsrådet"),
    ("Kommunala pensionärsrådet", "kpr", r"kommunala\s+pensionärsrådet"),
    ("Folkhälso- och trygghetsrådet", "ftr", r"folkhälso-\s*och\s+trygghetsrådet"),
]

def fetch(url: str, accept: str = "*/*") -> tuple[bytes, str]:
    req = Request(url, headers={"User-Agent": UA, "Accept": accept, "X-Requested-With": "XMLHttpRequest"})
    with urlopen(req, timeout=40) as response:
        return response.read(), response.headers.get("content-type", "").split(";", 1)[0]

def body_for(text: str):
    cleaned = html.unescape(re.sub(r"<[^>]+>", " ", text))
    cleaned = re.sub(r"\s+", " ", cleaned)
    hits = []
    for name, code, pattern in BODIES:
        for match in re.finditer(pattern, cleaned, re.I):
            hits.append((match.start(), len(match.group(0)), name, code))
    if hits:
        _, _, name, code = max(hits)
        return name, code
    return None

def initial_states(page: str):
    result = []
    for match in re.finditer(r"AppRegistry\.registerInitialState\('([^']+)',(\{.*?\})\);</script>", page, re.S):
        try:
            state = json.loads(match.group(2))
        except json.JSONDecodeError:
            continue
        if "files" not in state:
            continue
        marker = re.search(r"id=\"Fildelning(\d+)\"", page[:match.start()][-1200:])
        start = max(0, match.start() - 1800)
        label = page[start:match.start()]
        # File-share blocks are in source order. The immediately preceding body heading is stable.
        name_code = body_for(label)
        result.append({"portlet": match.group(1), "state": state, "body": name_code, "widget": int(marker.group(1)) if marker else None})
    return result

def dated(name: str):
    m = re.search(r"(?<!\d)(20\d{2})[-_. ](\d{1,2})[-_. ](\d{1,2})(?!\d)", name)
    if not m:
        m = re.search(r"(?<!\d)(20\d{2})(\d{2})(\d{2})(?!\d)", name)
    if not m:
        return None
    try:
        return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3))).date().isoformat()
    except ValueError:
        return None

def canonical_modified(value):
    """Compare SiteVision modification timestamps across API format changes."""
    if value in (None, ""):
        return None
    if isinstance(value, (int, float)):
        # SiteVision has returned both epoch milliseconds and numeric strings.
        return int(round(float(value)))
    text = str(value).strip()
    if re.fullmatch(r"\d+(?:\.\d+)?", text):
        return int(round(float(text)))
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
        return int(round(parsed.timestamp() * 1000))
    except ValueError:
        return text

def list_child_folder(page_url: str, portlet: str, folder: dict):
    url = f"{page_url}?sv.target={quote(portlet)}&sv.{quote(portlet)}.route=%2Ffiles&folderId={quote(folder['id'])}"
    raw, content_type = fetch(url, "application/json")
    if "json" not in content_type:
        raise RuntimeError(f"unexpected folder response type {content_type}")
    state = json.loads(raw)
    return state.get("files", [])

def discover():
    observed = {}
    errors = []
    pages = []
    for page_url, archive_mode in [(CURRENT, False), (ARCHIVE, True)]:
        raw, ctype = fetch(page_url, "text/html")
        if "html" not in ctype:
            raise RuntimeError(f"unexpected index response type: {ctype}")
        page = raw.decode("utf-8", "replace")
        for widget in initial_states(page):
            if not widget["body"]:
                # Bodies can be named by their heading just before a widget, not its generic block label.
                continue
            pages.append((page_url, archive_mode, widget))
    folders = []
    for page_url, archive_mode, widget in pages:
        if not archive_mode:
            continue
        for folder in widget["state"].get("files", []):
            if folder.get("isFolder") and re.fullmatch(r"Protokoll\s+20\d{2}", folder.get("name", "")) and int(folder["name"][-4:]) >= 2021:
                folders.append((page_url, widget, folder))
    folder_results = {}
    def load_folder(entry):
        page_url, widget, folder = entry
        return folder["id"], list_child_folder(page_url, widget["portlet"], folder), widget["body"]
    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as pool:
        futures = {pool.submit(load_folder, entry): entry for entry in folders}
        for future in concurrent.futures.as_completed(futures):
            entry = futures[future]
            try:
                folder_id, files, body = future.result()
                folder_results[folder_id] = (files, body)
            except Exception as e:
                page_url, widget, folder = entry
                errors.append({"stage": "folder", "body": widget["body"][0], "folder": folder.get("name"), "status": "fetch_failed", "detail": str(e)[:220]})
    for page_url, archive_mode, widget in pages:
        body, code = widget["body"]
        files = list(widget["state"].get("files", []))
        if archive_mode:
            for folder in widget["state"].get("files", []):
                files.extend(folder_results.get(folder.get("id"), ([], None))[0])
            files = [f for f in files if not f.get("isFolder")]
        for file in files:
                filename = file.get("name", "")
                meeting_date = dated(filename)
                if not meeting_date or not filename.lower().endswith(".pdf") or "protokoll" not in filename.lower():
                    continue
                if meeting_date[:4] < "2021":
                    continue
                source_id = file.get("id")
                if not source_id:
                    continue
                observed[source_id] = {
                    "sourceFileId": source_id, "body": body, "bodyCode": code,
                    "meetingDate": meeting_date, "title": filename,
                    "url": file.get("url") or urljoin("https://www.hylte.se", file.get("uri", "")),
                    "sourcePage": page_url, "lastModifiedDateTime": file.get("lastModifiedDateTime"),
                    "listedFileSize": file.get("fileSize"),
                }
    return observed, errors

def extract(pdf: bytes):
    with tempfile.NamedTemporaryFile(suffix=".pdf") as f:
        f.write(pdf); f.flush()
        txt = subprocess.run(["pdftotext", "-layout", f.name, "-"], capture_output=True, check=True).stdout.decode("utf-8", "replace")
        info = subprocess.run(["pdfinfo", f.name], capture_output=True, check=True, text=True).stdout
    pages = [x.strip() for x in txt.split("\f")]
    while pages and not pages[-1]: pages.pop()
    m = re.search(r"^Pages:\s+(\d+)", info, re.M)
    count = int(m.group(1)) if m else len(pages)
    pages += [""] * max(0, count - len(pages))
    return pages[:count], count

def ocr(pdf: bytes):
    with tempfile.TemporaryDirectory() as directory:
        source = Path(directory) / "source.pdf"
        target = Path(directory) / "searchable.pdf"
        source.write_bytes(pdf)
        result = subprocess.run(["ocrmypdf", "--force-ocr", "--deskew", "--rotate-pages", "--optimize", "0", str(source), str(target)], capture_output=True, timeout=300)
        if result.returncode != 0 or not target.exists():
            raise RuntimeError("OCR-försöket misslyckades: " + result.stderr.decode("utf-8", "replace")[-300:])
        return target.read_bytes()

def identity(record, pages):
    head = "\n".join(pages[:5])
    pattern = next(pattern for name, code, pattern in BODIES if code == record["bodyCode"])
    checks = {
        "meetingProtocol": bool(re.search(r"(?:M[ÖO]TES|SAMMANTRÄDES)PROTOKOLL", head, re.I)),
        "body": bool(re.search(pattern, head, re.I)),
        "meetingDate": record["meetingDate"] in head,
        "adjusted": bool(re.search(r"Protokollet är justerat|Justeringens plats och tid|Datum för anslags\s+uppsättande|Justerat den|Protokollet justerat", head, re.I)),
    }
    return checks

def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    now = datetime.now(timezone.utc).isoformat()
    previous = json.loads(OUT.read_text()) if OUT.exists() else {"records": [], "changes": [], "issues": []}
    old = {r["sourceFileId"]: r for r in previous.get("records", []) if r.get("sourceFileId")}
    observed, issues = discover()
    candidates = list(observed.values())
    def process(meta):
        cached = CACHE / f"{meta['sourceFileId'].replace('.', '-')}.pdf"
        prior = old.get(meta["sourceFileId"], {})
        try:
            fetched = False
            source_changed = bool(prior) and (canonical_modified(prior.get("lastModifiedDateTime")) != canonical_modified(meta.get("lastModifiedDateTime")) or prior.get("url") != meta.get("url"))
            refresh = "--refresh" in __import__("sys").argv
            if prior.get('manualIdentityReview') and cached.exists() and not source_changed and not refresh and hashlib.sha256(cached.read_bytes()).hexdigest()==prior.get('sha256'):
                return {**prior, **meta, 'checkedAt': now}, None
            # A daily metadata scan need not redownload unchanged historical PDFs.
            # Reuse the previously identity-verified extraction only when the
            # source file ID, URL and modification timestamp are unchanged.
            # Explicit --refresh still fetches and hashes every listed source.
            if prior and not cached.exists() and not source_changed and not refresh:
                identity_keys = ("sourceFileId", "url", "lastModifiedDateTime", "bodyCode", "meetingDate", "title")
                if all(prior.get(key) == meta.get(key) for key in identity_keys) and prior.get("status") == "published_verified" and prior.get("sha256") and prior.get("pages"):
                    rec = {**prior, **meta, "checkedAt": now, "fetchStatus": "ok"}
                    return rec, None
            if cached.exists() and not source_changed and not refresh:
                pdf = cached.read_bytes()
            else:
                pdf, ctype = fetch(meta["url"], "application/pdf")
                if "pdf" not in ctype.lower() or not pdf.startswith(b"%PDF-"):
                    raise RuntimeError(f"unexpected document response: {ctype}, {len(pdf)} bytes")
                cached.write_bytes(pdf)
                fetched = True
            digest = hashlib.sha256(pdf).hexdigest()
            if prior.get('manualIdentityReview') and digest==prior.get('sha256'):
                return {**prior, **meta, 'checkedAt': now}, None
            # Avoid rewriting stable metadata merely because SiteVision changed
            # ISO timestamps/file sizes to display-oriented JSON values.
            if prior and prior.get("sha256") == digest and not source_changed:
                meta["lastModifiedDateTime"] = prior.get("lastModifiedDateTime")
                meta["listedFileSize"] = prior.get("listedFileSize")
            pages, page_count = extract(pdf)
            checks = identity(meta, pages)
            ocr_applied = False
            if not all(checks.values()):
                readable = sum(character.isalpha() for page in pages[:5] for character in page)
                if readable < 300 or (not checks["meetingProtocol"] and not checks["body"]):
                    ocr_pdf = ocr(pdf)
                    ocr_pages, ocr_page_count = extract(ocr_pdf)
                    ocr_checks = identity(meta, ocr_pages)
                    if sum(character.isalpha() for page in ocr_pages[:5] for character in page) > readable:
                        pages, page_count, checks, ocr_applied = ocr_pages, ocr_page_count, ocr_checks, True
            failed = [key for key, passed in checks.items() if not passed]
            if failed:
                raise RuntimeError("identity checks failed: " + ", ".join(failed))
            versions = list(prior.get("versions", []))
            if digest not in {v.get("sha256") for v in versions}:
                versions.append({"sha256": digest, "observedAt": now, "pageCount": page_count})
            source_versions = list(prior.get("sourceVersions", []))
            observed_source = {"url": meta["url"], "fileId": meta["sourceFileId"], "lastModifiedDateTime": meta.get("lastModifiedDateTime"), "sha256": digest, "observedAt": now}
            if not any(
                item.get("url") == observed_source["url"]
                and item.get("fileId") == observed_source["fileId"]
                and canonical_modified(item.get("lastModifiedDateTime")) == canonical_modified(observed_source.get("lastModifiedDateTime"))
                and item.get("sha256") == observed_source["sha256"]
                for item in source_versions
            ):
                source_versions.append(observed_source)
            rec = {**meta, "id": prior.get("id", ""), "checkedAt": now, "sha256": digest, "pageCount": page_count,
                   "pages": pages, "identityChecks": checks, "ocrApplied": ocr_applied or prior.get("ocrApplied", False), "status": "published_verified", "fetchStatus": "ok", "versions": versions, "sourceVersions": source_versions}
            if prior.get("sha256") and prior["sha256"] != digest:
                rec["changeReview"] = {"status": "review_needed", "previousHash": prior["sha256"], "newHash": digest, "observedAt": now}
            return rec, None
        except Exception as e:
            if prior:
                kept = dict(prior); kept["lastAttemptAt"] = now; kept["lastError"] = str(e)[:220]
                return kept, {"sourceFileId": meta["sourceFileId"], "body": meta["body"], "meetingDate": meta["meetingDate"], "stage": "refresh", "status": "fetch_failed_previous_version_preserved", "detail": str(e)[:220]}
            return None, {"sourceFileId": meta["sourceFileId"], "body": meta["body"], "meetingDate": meta["meetingDate"], "stage": "pdf_or_identity", "status": "manual_review", "url": meta["url"], "detail": str(e)[:220]}
    imported = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as pool:
        futures = [pool.submit(process, meta) for meta in candidates]
        for index, future in enumerate(concurrent.futures.as_completed(futures), 1):
            imported.append(future.result())
            if index % 50 == 0 or index == len(futures):
                print(json.dumps({"processed": index, "listedFiles": len(candidates)}, ensure_ascii=False), flush=True)
    records = {r["sourceFileId"]: r for r in previous.get("records", []) if r.get("sourceFileId")}
    issues.extend(issue for _, issue in imported if issue)
    for record, _ in imported:
        if record:
            records[record["sourceFileId"]] = record
    # Stable IDs use organ/date, with deterministic source suffixes for multiple files on one date.
    groups = {}
    for record in records.values():
        groups.setdefault((record["bodyCode"], record["meetingDate"]), []).append(record)
    for (code, meeting_date), group in groups.items():
        group.sort(key=lambda r: (r["title"].lower(), r["sourceFileId"]))
        for item in group:
            slug = re.sub(r"[^a-z0-9]+", "-", re.sub(r"[^\x00-\x7f]", "", item["title"].lower())).strip("-")
            item["id"] = f"{code}-protokoll-{meeting_date}" if len(group) == 1 else f"{code}-protokoll-{meeting_date}-{slug[-24:]}"
    ordered = sorted(records.values(), key=lambda r: (r["meetingDate"], r["bodyCode"], r["title"]), reverse=True)
    coverage = []
    for name, code, _ in BODIES:
        rows = [r for r in ordered if r["bodyCode"] == code]
        listed = [r for r in observed.values() if r["bodyCode"] == code]
        coverage.append({"body": name, "bodyCode": code, "yearFrom": 2021, "yearTo": int(now[:4]), "listedFiles": len(listed),
                         "verifiedProtocols": sum(r.get("status") == "published_verified" for r in rows),
                         "manualReviewFiles": sum(i.get("body") == name for i in issues), "source": "Hylte kommuns SiteVision-arkiv"})
    output = {"schemaVersion": 1, "checkedAt": now, "sourcePages": [CURRENT, ARCHIVE],
              "method": "PDF får status verifierat och sökbart efter kontroll av protokolltyp, organ, mötesdatum och justeringsmarkör på dokumentets första fem sidor. Källans fil-ID, SHA-256 och tidigare versioner bevaras. Hämtningsfel tar aldrig bort äldre versioner.",
              "coverage": coverage, "records": ordered, "issues": issues, "reviewHistory": previous.get('reviewHistory', [])}
    temp = OUT.with_suffix(".tmp"); temp.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n"); temp.replace(OUT)
    index = {"schemaVersion": 1, "checkedAt": now, "sourcePages": output["sourcePages"], "scope": {"publisher": "Hylte kommun", "bodies": [name for name, _, _ in BODIES], "yearFrom": 2021, "yearTo": int(now[:4])},
             "method": output["method"], "summary": {"listedFiles": len(observed), "verifiedProtocols": sum(r.get("status") == "published_verified" for r in ordered),
             "searchablePages": sum(r.get("pageCount", 0) for r in ordered if r.get("status") == "published_verified"), "bodiesWithVerifiedProtocols": sum(bool(x["verifiedProtocols"]) for x in coverage),
             "manualReviewFiles": len(issues)}, "coverage": coverage,
             "records": [{k: r[k] for k in ["id", "sourceFileId", "title", "body", "bodyCode", "meetingDate", "url", "pageCount", "sha256", "checkedAt", "status", "identityChecks", "sourcePage"] if k in r} for r in ordered if r.get("status") == "published_verified"],
             "issues": issues}
    index_path = ROOT / "data" / "historical-protocol-archive-index.json"
    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n")
    public_dir = ROOT / "public" / "data"
    public_dir.mkdir(parents=True, exist_ok=True)
    public_records = [{**{k: r[k] for k in ["id", "title", "body", "bodyCode", "meetingDate", "url", "pageCount", "sha256", "checkedAt", "pages"]}, "kind": "historical_protocol"}
                      for r in ordered if r.get("status") == "published_verified"]
    public_corpus = {"checkedAt": now, "scope": "Hylte kommun", "records": public_records}
    (public_dir / "protocol-search-corpus.json").write_text(json.dumps(public_corpus, ensure_ascii=False, separators=(",", ":")) + "\n")
    protocol_dir = public_dir / "protocols"
    protocol_dir.mkdir(parents=True, exist_ok=True)
    current_names = {f'{record["id"]}.json' for record in public_records}
    for old_file in protocol_dir.glob("*.json"):
        if old_file.name not in current_names:
            old_file.unlink()
    for record in public_records:
        (protocol_dir / f'{record["id"]}.json').write_text(json.dumps(record, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(json.dumps({"listedFiles": len(observed), "verifiedProtocols": sum(r.get("status") == "published_verified" for r in ordered),
                      "searchablePages": sum(r.get("pageCount", 0) for r in ordered), "issues": len(issues),
                      "bodiesWithVerifiedProtocols": sum(bool(x["verifiedProtocols"]) for x in coverage), "checkedAt": now}, ensure_ascii=False))

if __name__ == "__main__":
    main()
