#!/usr/bin/env python3
"""Build exact, public Hylte docket relations for the Data workbench."""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
catalog = json.loads((ROOT / "data/catalog.json").read_text())
public = json.loads((ROOT / "data/public-catalog.json").read_text())
followups = json.loads((ROOT / "data/followups.json").read_text())
motions = json.loads((ROOT / "data/motion-journeys.json").read_text())
public_docs = {row["id"] for row in public["documents"]}
pattern = re.compile(r"(?<!\w)(20\d{2})\s+(KS|KFN|SBN|ON|BUN|KPR|KTR|PU)\s?(\d{4})(?!\w)", re.I)

def labels(text):
    return {f"{year} {body.upper()}{number}" for year, body, number in pattern.findall(text or "")}

records = {}
def record(label):
    return records.setdefault(label, {"id": "docket:" + label.lower().replace(" ", "-"), "label": label, "documentMentions": [], "motionLinks": [], "followupLinks": [], "itemLinks": []})

for document in catalog["documents"]:
    if document["id"] not in public_docs:
        continue
    per_label = {}
    for index, page in enumerate(document.get("pages") or [], start=1):
        for label in labels(page):
            per_label.setdefault(label, []).append(index)
    for label, pages in per_label.items():
        node = record(label)
        node["documentMentions"].append({"documentId": document["id"], "pages": pages, "relation": "exact_text_mention"})
        item = next((row for meeting in public["meetings"] for row in meeting["items"] if row["id"] == document["itemId"]), None)
        if item:
            link = next((row for row in node["itemLinks"] if row["itemId"] == item["id"]), None)
            if link:
                link["viaDocumentIds"].append(document["id"])
            else:
                node["itemLinks"].append({"itemId": item["id"], "viaDocumentIds": [document["id"]], "relation": "document_listed_under_item"})

for motion in motions["records"]:
    for label in labels(motion.get("docket")):
        record(label)["motionLinks"].append({"motionId": motion["id"], "relation": "curated_motion_docket"})

for followup in followups["records"]:
    for label in labels(followup.get("docket")):
        record(label)["followupLinks"].append({"followupId": followup["id"], "relation": "curated_followup_docket"})

output = {
    "schemaVersion": 1,
    "checkedAt": public["checkedAt"],
    "scope": "Hylte kommun",
    "method": "Exact docket-number matches in public imported PDF text, plus reviewed motion and follow-up registry links.",
    "dockets": sorted(records.values(), key=lambda row: row["label"]),
}
(ROOT / "data/document-network.json").write_text(json.dumps(output, ensure_ascii=False, indent=2))
print(json.dumps({"dockets": len(output["dockets"]), "document_mentions": sum(len(row["documentMentions"]) for row in output["dockets"])}, ensure_ascii=False))
