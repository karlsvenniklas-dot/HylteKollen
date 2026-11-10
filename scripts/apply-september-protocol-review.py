#!/usr/bin/env python3
"""Apply reviewed 2026-09-08 KF protocol evidence to linked Hylte records."""
import json, re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "data/municipal-protocol-archive.json"

def read(path): return json.loads(path.read_text(encoding="utf-8"))
def write(path, value): path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

archive = read(ARCHIVE)
protocol = next((row for row in archive["records"] if row.get("bodyCode") == "kf" and row.get("meetingDate") == "2026-09-08" and row.get("status") == "published_verified"), None)
if not protocol:
    raise SystemExit("Justerat KF-protokoll 2026-09-08 saknas i den identitetsverifierade SiteVision-importen.")
checks = protocol.get("identityChecks", {})
if not all(checks.get(key) for key in ("meetingProtocol", "body", "meetingDate", "adjusted")):
    raise SystemExit("KF-protokollets identitets- och justeringskontroller är inte kompletta.")
for page, paragraph, phrase in [(8, 92, "delegera till kommunstyrelsens ordförande"), (12, 93, "anta Arbetsformer"), (22, 96, "avslå motionen"), (27, 97, "avslå motionen"), (30, 98, "anse motionen besvarad")]:
    content = protocol["pages"][page - 1]
    if not re.search(rf"(?m)^§\s*{paragraph}\s*$", content) or phrase.lower() not in content.lower():
        raise SystemExit(f"Källkontrollen stämde inte för §{paragraph}, PDF sida {page}.")

source_date = datetime.fromtimestamp((protocol.get("lastModifiedDateTime") or 0) / 1000, timezone.utc).date().isoformat() if protocol.get("lastModifiedDateTime") else "2026-09-15"
source = {"title": "Justerat protokoll, kommunfullmäktige 8 september 2026", "url": protocol["url"], "date": source_date,
          "sha256": protocol["sha256"], "documentId": protocol["id"], "sourceFileId": protocol["sourceFileId"], "pageCount": protocol["pageCount"]}
verified = [
    {"itemNumber": 6, "itemId": "kf-2026-09-08-6", "paragraph": 92, "page": 8, "docket": "2023 KS0190", "title": "Hantering av fastighet Rydö skola", "decision": "KF ansåg minoritetsåterremissen besvarad, delegerade avtalssignering till kommunstyrelsens ordförande och gav kommunstyrelsen i uppdrag att verkställa kommunens avtalsåtaganden och omfördela medel."},
    {"itemNumber": 7, "itemId": "kf-2026-09-08-7", "paragraph": 93, "page": 12, "docket": "2025 KS0061", "title": "Arbetsformer för kommunala tillgänglighets- och pensionärsrådet", "decision": "KF antog arbetsformerna för kommunala tillgänglighets- och pensionärsrådet. Genomförandet efter beslutet har inte verifierats."},
    {"itemNumber": 10, "itemId": "kf-2026-09-08-10", "paragraph": 96, "page": 22, "docket": "2026 KS0076", "title": "Slopa bygglovsavgifterna", "decision": "KF avslog motionen. Omröstningen i §96 gav 26 JA för kommunstyrelsens avslagsförslag, 9 NEJ och 4 avstår; individlistan står på PDF sidorna 25–26."},
    {"itemNumber": 11, "itemId": "kf-2026-09-08-11", "paragraph": 97, "page": 27, "docket": "2024 KS0207", "title": "Välkommen skylt", "decision": "KF avslog motionen. Reservation till förmån för bifallsyrkandet anges på PDF sida 29."},
    {"itemNumber": 12, "itemId": "kf-2026-09-08-12", "paragraph": 98, "page": 30, "docket": "2025 KS0190", "title": "Ändring av resepolicy för att inkludera flygalternativ", "decision": "KF ansåg motionen besvarad med hänvisning till att flyg redan är ett möjligt resealternativ enligt gällande resepolicy."},
]

for filename in ("catalog.json", "public-catalog.json"):
    path = ROOT / "data" / filename
    data = read(path)
    meeting = data["meetings"][0]
    meeting.update({"protocolPublished": True, "protocolReviewed": True, "protocolUrl": source["url"], "protocolDocumentId": protocol["id"],
                    "protocolSource": "Hylte kommuns officiella protokollarkiv", "protocolObservedAt": archive["checkedAt"],
                    "protocolPublicationEvidence": source, "verifiedDecisions": verified,
                    "meetingPageProtocolStatus": "MötesPlus-sidan visar fortsatt texten ‘Inget protokoll har publicerats’. Den separata officiella kommunala protokollarkivsidan innehåller den justerade PDF:en."})
    data["meetings"][0] = meeting
    if filename == "catalog.json":
        for item in meeting["items"]:
            match = next((row for row in verified if row["itemId"] == item["id"]), None)
            if match:
                item["protocolReview"] = {"status": "decision_verified", "documentId": protocol["id"], "sha256": protocol["sha256"], "paragraph": match["paragraph"], "page": match["page"]}
    write(path, data)

followup_path = ROOT / "data/followups.json"
followups = read(followup_path)
followups["checkedAt"] = archive["checkedAt"][:10]
followups["sources"]["protocolSeptember"] = source
for row in followups["records"]:
    if row["id"] == "hylte-rydo":
        text = "KF §92: återremissen förklarades besvarad; kommunstyrelsens ordförande fick i uppdrag att ingå avtal med Rydöbruks IF och kommunstyrelsen fick i uppdrag att verkställa kommunens avtalsåtaganden och omfördela medel. Protokollet visar beslutet och ett fortsatt genomförandeuppdrag, inte att åtagandena redan är utförda."
        row.update({"latest": "Justerat KF-protokoll §92 den 8 september 2026 besvarar återremissen, delegerar avtalssignering och ger kommunstyrelsen i uppdrag att verkställa kommunens avtalsåtaganden och omfördela medel. Genomförandet följs vidare; ingen verifierad deadline eller slutredovisning anges här.", "evidenceAsOf": source["date"], "latestSource": "protocolSeptember", "latestPage": 8})
        row["history"] = [entry for entry in row["history"] if entry.get("date") != source["date"] or entry.get("source") != "protocolSeptember"]
        row["history"].append({"date": source["date"], "text": text, "source": "protocolSeptember", "page": 8, "documentId": protocol["id"], "docket": "2023 KS0190", "sha256": source["sha256"]})
    elif row["id"] == "hylte-radsorganisation":
        text = "KF §93 antog Arbetsformer för kommunala tillgänglighets- och pensionärsrådet. Fullmäktige avslog även ett ändringsyrkande om obetald ersättarnärvaro. Genomförande efter beslutet har inte verifierats."
        row.update({"status": "reported", "latest": "Justerat KF-protokoll §93 den 8 september 2026 visar att fullmäktige antog arbetsformerna för kommunala tillgänglighets- och pensionärsrådet. Antagandet är verifierat; hur arbetssättet därefter genomförts har inte granskats.", "evidenceAsOf": source["date"], "latestSource": "protocolSeptember", "latestPage": 12})
        row["history"] = [entry for entry in row["history"] if entry.get("date") != source["date"] or entry.get("source") != "protocolSeptember"]
        row["history"].append({"date": source["date"], "text": text, "source": "protocolSeptember", "page": 12, "documentId": protocol["id"], "docket": "2025 KS0061", "sha256": source["sha256"]})
write(followup_path, followups)

diff_path = ROOT / "data/decision-diffs.json"
diffs = read(diff_path)
diffs["checkedAt"] = archive["checkedAt"][:10]
outcomes = {
    "bygglovsavgifter": (96, 22, "KF §96 avslog motionen. Omröstningen gav 26 JA för kommunstyrelsens avslagsförslag, 9 NEJ och 4 avstår."),
    "valkomstskylt": (97, 27, "KF §97 avslog motionen. Reservation till förmån för bifallsyrkandet anges på PDF sida 29."),
    "resepolicy": (98, 30, "KF §98 ansåg motionen besvarad med hänvisning till att flyg redan är ett möjligt resealternativ enligt gällande resepolicy."),
}
for row in diffs["records"]:
    if row["id"] not in outcomes: continue
    paragraph, page, outcome = outcomes[row["id"]]
    row["municipalReportedOutcome"] = row.get("reportedOutcome")
    row.update({"reportedOutcome": outcome, "protocolVerified": True, "protocolDocumentId": protocol["id"], "protocolParagraph": paragraph, "protocolPage": page, "protocolSourceHash": source["sha256"]})
write(diff_path, diffs)

journey_path = ROOT / "data/motion-journeys.json"
journeys = read(journey_path)
journeys["checkedAt"] = archive["checkedAt"][:10]
journey_outcomes = {
    "bygglovsavgifter-2026": (96, 22, "KF §96 avslog motionen. Omröstningen gav 26 JA för kommunstyrelsens avslagsförslag, 9 NEJ och 4 avstår."),
    "valkomstskylt-2024": (97, 27, "KF §97 avslog motionen. Reservation till förmån för bifallsyrkandet anges på PDF sida 29."),
    "resepolicy-2025": (98, 30, "KF §98 ansåg motionen besvarad med hänvisning till att flyg redan är ett möjligt resealternativ enligt gällande resepolicy."),
}
for row in journeys["records"]:
    if row["id"] not in journey_outcomes: continue
    paragraph, page, outcome = journey_outcomes[row["id"]]
    row["municipalSummaryOutcome"] = row.get("summaryOutcome")
    row.update({"summaryOutcome": outcome, "protocolVerified": True, "protocolDocumentId": protocol["id"], "protocolParagraph": paragraph, "protocolPage": page, "protocolSourceHash": source["sha256"]})
    if not any(stage.get("kind") == "decision" and stage.get("documentId") == protocol["id"] and stage.get("paragraph") == str(paragraph) for stage in row["stages"]):
        row["stages"].append({"date": "2026-09-08", "label": f"Kommunfullmäktige §{paragraph} · justerat protokoll", "body": outcome, "documentId": protocol["id"], "page": page, "paragraph": str(paragraph), "sourceHash": source["sha256"], "kind": "decision"})
write(journey_path, journeys)

ledger_path = ROOT / "data/proposal-ledger.json"
ledger = read(ledger_path)
for row in ledger["motions"]:
    match = next((item for item in verified if item["docket"] in str(row["source"].get("diaryNumber", ""))), None)
    if match and match["itemNumber"] in (10, 11, 12):
        row["finalDecision"] = {"text": match["decision"], "documentId": protocol["id"], "paragraph": str(match["paragraph"]), "page": match["page"], "sha256": source["sha256"], "date": "2026-09-08"}

# Record the individually printed vote only after matching the complete roll-call to its aggregate.
page25, page26 = protocol["pages"][24], protocol["pages"][25]
individual = []
for line in page25.splitlines():
    if not re.search(r"\sX\s*$", line): continue
    x = line.rfind("X")
    raw = line[:x].strip()
    match = re.match(r"(.+?)(?:\s*,\s*(?:ordförande|vice ordförande|\d+:e vice ordförande|ledamot|ersättare))?$", raw, re.I)
    label = match.group(1).strip() if match else raw
    person = re.match(r"(.+?)\s*(?:\(([A-ZÅÄÖ]{1,3})\))?$", label)
    if not person or len(person.group(1).split()) < 2: continue
    choice = "yes" if x < 73 else "no" if x < 85 else "abstain"
    individual.append({"name": person.group(1).strip(), "party": person.group(2), "choice": choice})
for line in page26.splitlines():
    if "Lars Löfvall (SD)" in line and re.search(r"\sX\s*$", line):
        individual.append({"name": "Lars Löfvall", "party": "SD", "choice": "no"})
counts = {choice: sum(row["choice"] == choice for row in individual) for choice in ("yes", "no", "abstain")}
if len(individual) != 39 or counts != {"yes": 26, "no": 9, "abstain": 4}:
    raise SystemExit(f"Individlistan stämmer inte mot protokollets summering: {len(individual)} röster, {counts}.")
vote = {"id": "vote-kf2026-09-08-kf96", "question": "Kommunstyrelsens avslagsförslag (JA) mot bifall till motionen (NEJ)", "aggregate": {"yes": 26, "no": 9, "abstain": 4}, "ballotCoverage": "complete_list", "ballotCount": 39,
        "individualVotes": individual, "individualPageRange": [25, 26], "source": {"documentId": protocol["id"], "body": "Kommunfullmäktige", "date": "2026-09-08", "paragraph": "96", "diaryNumber": "2026 KS0076", "page": 24, "adjusted": True, "sha256": source["sha256"]}}
ledger["votes"] = [item for item in ledger["votes"] if item["id"] != vote["id"]] + [vote]
ledger["sourceHashes"][protocol["id"]] = source["sha256"]
ledger["coverage"]["individualBallots"] = sum(item.get("ballotCount", 0) for item in ledger["votes"] if item.get("ballotCoverage") == "complete_list")
ledger["coverage"]["aggregateVotes"] = len(ledger["votes"])
ledger["coverage"]["dateTo"] = "2026-09-08"
write(ledger_path, ledger)

obs_path = ROOT / "data/politician-observations.json"
observations = read(obs_path)
by_name = {person["name"]: person for person in observations["politicians"]}
for ballot in individual:
    person = by_name.get(ballot["name"])
    if not person:
        continue
    person.setdefault("votes", [])
    person["votes"] = [item for item in person["votes"] if item.get("voteId") != vote["id"]]
    person["votes"].append({"voteId": vote["id"], "body": "Kommunfullmäktige", "date": "2026-09-08", "docket": "2026 KS0076", "paragraph": "96", "page": 25 if ballot["name"] != "Lars Löfvall" else 26, "choice": ballot["choice"], "party": ballot["party"], "documentId": protocol["id"], "sha256": source["sha256"]})
observations["checkedAt"] = archive["checkedAt"]
write(obs_path, observations)
print(json.dumps({"documentId": protocol["id"], "sha256": source["sha256"], "verifiedDecisions": len(verified), "individualVotes": len(individual), "voteCounts": counts}, ensure_ascii=False))
