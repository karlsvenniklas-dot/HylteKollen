#!/usr/bin/env python3
"""Build a compact, source-linked analysis index from verified protocols.

The output is deliberately descriptive: paragraph headings, exact docket IDs,
amount tokens, source wording and place mentions. It does not infer outcomes,
importance, delays or political merit.
"""

from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "historical-protocols.json"
OUTPUT = ROOT / "data" / "protocol-insights.json"
ARCHIVE = ROOT / "data" / "municipal-protocol-archive.json"

PLACES = ["Hyltebruk", "Torup", "Kinnared", "Landeryd", "Unnaryd", "Rydöbruk", "Långaryd", "Femsjö", "Drängsered", "Jälluntofta", "Brännögård"]
TOPICS = [
    ("Motioner och initiativ", r"\b(motion|initiativ|interpellation)"),
    ("Ekonomi och investeringar", r"\b(budget|ekonomi|ekonomisk|investering|bokslut|resultatbalansering|statsbidrag|verksamhetsstöd|ersättning)"),
    ("Styrning och uppföljning", r"\b(mål|uppföljning|återrapport|återredovis|internkontroll|riktlinj|strategi|planprioriter|sammanträdesdatum|organisation)"),
    ("Kultur, fritid och föreningar", r"\b(kultur|fritid|förening|idrott|örnahallen|allaktivitetshus|ungdomsledarpris|sysselsättning)"),
    ("Socialt stöd och omsorg", r"\b(social|bistånd|lex sarah|vårdnad|ifo|avvikelse|ej verkställda)"),
    ("Skola och barn", r"\b(skola|förskola|barn|ungdom)"),
    ("Miljö, trafik och infrastruktur", r"\b(klimat|energi|trafik|buss|infrastruktur|laddinfrastruktur|fastighet|planbesked|lucktomt|ortsutveckling)"),
]


def compact(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def classify(title: str) -> str:
    lowered = title.lower()
    for label, pattern in TOPICS:
        if re.search(pattern, lowered, re.I):
            return label
    return "Mötesformalia och övrigt"


def extract_sections(record: dict) -> list[dict]:
    starts: list[tuple[int, int, int]] = []
    for page_index, page in enumerate(record["pages"]):
        for match in re.finditer(r"(?m)^\s*§\s*(\d+)\s*$", page):
            starts.append((page_index, match.start(), int(match.group(1))))
    sections: list[dict] = []
    for index, (page_index, offset, paragraph) in enumerate(starts):
        chunks = [record["pages"][page_index][offset:]]
        if index + 1 < len(starts):
            next_page, next_offset, _ = starts[index + 1]
            if next_page == page_index:
                chunks = [record["pages"][page_index][offset:next_offset]]
            else:
                chunks[0] = record["pages"][page_index][offset:]
                chunks.extend(record["pages"][page_index + 1:next_page])
                chunks.append(record["pages"][next_page][:next_offset])
        else:
            chunks.extend(record["pages"][page_index + 1:])
        segment = "\n".join(chunks)
        lines = [compact(line) for line in segment.splitlines()]
        title_parts: list[str] = []
        for line in lines[1:]:
            if not line:
                continue
            if re.fullmatch(r"\(20\d{2}\s+[A-ZÅÄÖ]{1,8}\d{4}\)", line) or line in {"Beslut", "Ärende", "Beskrivning av ärendet"}:
                break
            if line.startswith("Justerandes sign") or re.match(r"^(MÖTES|SAMMANTRÄDES)PROTOKOLL", line, re.I):
                continue
            title_parts.append(line)
            if len(" ".join(title_parts)) > 220:
                break
        title = re.sub(r"^§\s*\d+\s*", "", compact(" ".join(title_parts)))
        if not title or title.isdigit():
            continue
        docket_match = re.search(r"\((20\d{2}\s+[A-ZÅÄÖ]{1,8}\d{4})\)", segment)
        decision_match = re.search(
            r"(?ms)^Beslut\s*$\s*(.+?)(?=^(?:Beskrivning av ärendet|Ekonomisk konsekvens|Handlingar i ärendet|Förslag till beslut|Yrkande(?:n)?|Beslutsgång|Reservation|Protokollsanteckning|Beslutet skickas till|Paragrafen är justerad)\s*$)",
            segment,
        )
        decision = compact(decision_match.group(1)) if decision_match else ""
        amounts = sorted({compact(value) for value in re.findall(r"\b\d[\d\s]*(?:[,.]\d+)?\s*(?:tkr|mnkr|mkr|kr)\b", segment, re.I)}, key=str.lower)
        title_places = [place for place in PLACES if re.search(rf"\b{re.escape(place)}\b", title, re.I)]
        text_places = [place for place in PLACES if place not in title_places and re.search(rf"\b{re.escape(place)}\b", segment, re.I)]
        sections.append({
            "id": f"{record['id']}-paragraf-{paragraph}",
            "documentId": record["id"],
            "body": record["body"],
            "bodyCode": record["bodyCode"],
            "meetingDate": record["meetingDate"],
            "paragraph": paragraph,
            "page": page_index + 1,
            "title": title,
            "docket": docket_match.group(1) if docket_match else None,
            "topic": classify(title),
            "decisionExcerpt": decision[:420] if decision else None,
            "decisionExcerptTruncated": len(decision) > 420,
            "hasYrkande": bool(re.search(r"(?m)^Yrkande(?:n)?\s*$", segment)),
            "hasReservation": bool(re.search(r"(?m)^Reservation\s*$", segment)),
            "hasRecordedVote": bool(re.search(r"(?m)^(?:Omröstning|Resultat)\s*$", segment)),
            "amounts": amounts,
            "titlePlaces": title_places,
            "textPlaces": text_places,
            "sourceUrl": f"/dokument/{record['id']}#sida-{page_index + 1}",
            "originalUrl": record["url"],
            "sourceSha256": record["sha256"],
        })
    return sections


def main() -> None:
    source = json.loads(SOURCE.read_text(encoding="utf-8"))
    archive = json.loads(ARCHIVE.read_text(encoding="utf-8")) if ARCHIVE.exists() else {"records": [], "checkedAt": None}
    archive_records = [row for row in archive.get("records", []) if row.get("status") == "published_verified"]
    archive_meetings = {(row.get("bodySlug"), row.get("meetingDate")) for row in archive_records}
    # When both source systems publish the same Hylte meeting, keep the archive PDF
    # as the analysis document while retaining the other source record in its own register.
    meeting_records = [row for row in source["records"] if (row.get("bodySlug"), row.get("meetingDate")) not in archive_meetings]
    analysis_records = meeting_records + archive_records
    extracted = [section for record in analysis_records for section in extract_sections(record)]
    # Some tables of contents wrap a paragraph number onto its own line. Keep
    # the strongest occurrence: the actual paragraph normally has a docket,
    # decision text and a clean heading.
    paragraphs_by_id: dict[str, dict] = {}
    for row in extracted:
        score = (20 if row["decisionExcerpt"] else 0) + (8 if row["docket"] else 0) + (3 if "§" not in row["title"] else 0) + min(row["page"], 5)
        previous = paragraphs_by_id.get(row["id"])
        if previous is None or score > previous[0]:
            paragraphs_by_id[row["id"]] = (score, row)
    paragraphs = [value[1] for value in paragraphs_by_id.values()]
    docket_groups: dict[str, list[dict]] = defaultdict(list)
    for row in paragraphs:
        if row["docket"]:
            docket_groups[row["docket"]].append(row)
    chains = []
    for docket, rows in docket_groups.items():
        unique_documents = {row["documentId"] for row in rows}
        if len(unique_documents) < 2:
            continue
        ordered = sorted(rows, key=lambda row: (row["meetingDate"], row["body"], row["paragraph"]))
        chains.append({
            "docket": docket,
            "eventCount": len(ordered),
            "bodyCount": len({row["body"] for row in ordered}),
            "firstObserved": ordered[0]["meetingDate"],
            "lastObserved": ordered[-1]["meetingDate"],
            "events": [{key: row[key] for key in ["documentId", "body", "meetingDate", "paragraph", "page", "title", "sourceUrl"]} for row in ordered],
        })
    chains.sort(key=lambda row: (-row["eventCount"], row["docket"]))
    topic_counts = Counter(row["topic"] for row in paragraphs)
    body_counts = Counter(row["body"] for row in paragraphs)
    place_title_counts = Counter(place for row in paragraphs for place in row["titlePlaces"])
    output = {
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceCheckedAt": max(value for value in [source.get("checkedAt"), archive.get("checkedAt")] if value),
        "scope": "Identitetsverifierade justerade protokoll från Hylte kommun",
        "method": "Paragrafer identifieras från exakta paragrafmarkörer. Ämnen klassas endast från rubrikord. Diariekedjor kräver exakt diarienummer. Belopp och orter är textträffar, inte automatiskt beslut eller geografisk påverkan.",
        "summary": {
            "protocols": len(analysis_records),
            "pages": sum(record["pageCount"] for record in analysis_records),
            "paragraphs": len(paragraphs),
            "paragraphsWithDecisionText": sum(bool(row["decisionExcerpt"]) for row in paragraphs),
            "paragraphsWithAmounts": sum(bool(row["amounts"]) for row in paragraphs),
            "exactDocketChains": len(chains),
            "placesInHeadings": len(place_title_counts),
        },
        "topics": [{"name": name, "count": count} for name, count in sorted(topic_counts.items(), key=lambda item: (-item[1], item[0]))],
        "bodies": [{"name": name, "paragraphs": count} for name, count in sorted(body_counts.items())],
        "placeHeadingCounts": [{"place": name, "count": count} for name, count in sorted(place_title_counts.items(), key=lambda item: (-item[1], item[0]))],
        "docketChains": chains,
        "paragraphs": paragraphs,
    }
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    public_dir = ROOT / "public" / "data"
    public_dir.mkdir(parents=True, exist_ok=True)
    (public_dir / "protocol-insights.json").write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(json.dumps(output["summary"], ensure_ascii=False))


if __name__ == "__main__":
    main()
