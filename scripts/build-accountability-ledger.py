#!/usr/bin/env python3
"""Build a source-qualified decision-to-follow-up ledger."""
import hashlib, json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
followups=json.loads((ROOT/"data/followups.json").read_text())
catalog=json.loads((ROOT/"data/catalog.json").read_text())
public=json.loads((ROOT/"data/public-catalog.json").read_text())
docs={row["id"]:row for row in catalog["documents"] if row["id"] in {d["id"] for d in public["documents"]}}
later={
 "hylte-rydo":[("2026-04-22","dc68c621463d99543b57bed8",[1,2,3]),("2026-04-28","8f87f06cc163b12dcab1afb3",[2]),("2026-05-12","df7087178c3b276169587303",[3,7]),("2026-06-02","886542ee665e2bfe8118b6dd",[3,6]),("2026-06-04","7584eec4223c75a656782b4a",[1]),("2026-07-15","b0d62065fec40ea6cacb1252",[1,2,3]),("2026-08-18","72546d942b6a897ce9b3b76d",[2,7]),("2026-08-25","95a81ab2d5597e3452f83aaf",[2])],
 "hylte-radsorganisation":[("2026-04-02","784aee4488ba18324d4ca3ce",[1]),("2026-08-18","04b822fbf06810b319bebe5b",[2]),("2026-08-25","73495afae4bdc7c44b98093b",[2])]
}
def event_id(*parts): return "evt-"+hashlib.sha256("|".join(str(x or "") for x in parts).encode()).hexdigest()[:16]
def status(row):
 return {"follow_up":("source_check_needed","Behöver ny källkontroll","Saknad slutredovisning betyder inte att uppdraget är ogjort."),"reported":("reported_by_municipality","Rapporterat av kommunen","Rapportering är inte samma sak som verifierad effekt."),"closed":("closed_by_recorded_decision","Avslutat genom protokollfört beslut","Avslutet har en protokollkälla i registret.")}[row["status"]]
records=[]
for row in followups["records"]:
 code,label,qualification=status(row); events=[]
 for old in row.get("history",[]):
  src=followups["sources"][old["source"]]
  events.append({"id":event_id(row["id"],old["source"],old["date"],src["sha256"],old["page"]),"kind":"recorded_decision" if old["source"]=="protocol" else "followup_report","date":old["date"],"statement":old["text"],"evidenceLevel":"source_backed","source":{"type":old["source"],"title":src["title"],"url":src["url"],"sourceDate":src["date"],"pages":[old["page"]],"sha256":src["sha256"]}})
 matches=[]
 for date,docid,pages in later.get(row["id"],[]):
  doc=docs[docid];matches.append(docid)
  events.append({"id":event_id(row["id"],"exact_document_match",date,doc["sha256"],",".join(map(str,pages)),docid),"kind":"exact_document_match","date":date,"statement":"Senare exakt diarienummerträff i importerad Hylte-handling.","evidenceLevel":"source_backed","source":{"type":"document","title":doc["title"],"url":doc["url"],"sourceDate":date,"pages":pages,"sha256":doc["sha256"],"documentId":docid}})
 continuity="not_applicable"
 note="Kontinuitetsmåttet används bara för uppdrag som behöver ny källkontroll."
 if row["status"]=="follow_up":
  continuity="later_exact_match" if matches else "no_later_exact_match_in_import"
  note="Senare exakta dokumentträffar finns; de bevisar inte slutligt genomförande." if matches else "Ingen senare exakt diarieträff i importen; detta bevisar inte passivitet eller försening."
 records.append({"id":"accountability:"+row["id"],"followupId":row["id"],"title":row["title"],"dockets":[x.strip() for x in row["docket"].split("/")],"assignedOn":row["assignedOn"],"responsible":row["responsible"],"location":row["location"],"status":{"code":code,"label":label,"qualification":qualification},"continuity":{"code":continuity,"observedOn":public["checkedAt"][:10],"documentIds":matches,"qualification":note},"history":sorted(events,key=lambda x:(x["date"] or "",x["id"]))})
summary={"records":len(records),"sourceCheckNeeded":sum(x["status"]["code"]=="source_check_needed" for x in records),"reported":sum(x["status"]["code"]=="reported_by_municipality" for x in records),"closed":sum(x["status"]["code"]=="closed_by_recorded_decision" for x in records),"openWithLaterExactMatch":sum(x["continuity"]["code"]=="later_exact_match" for x in records),"openSourceGaps":sum(x["continuity"]["code"]=="no_later_exact_match_in_import" for x in records),"laterExactDocuments":sum(len(x["continuity"]["documentIds"]) for x in records)}
output={"schemaVersion":1,"generatedAt":public["checkedAt"],"scope":"Hylte kommun","method":"Dated follow-up records plus exact docket-number matches in imported public Hylte documents.","caveats":["Saknad slutredovisning betyder inte att uppdraget är ogjort.","Ett källglapp visar importens täckning, inte passivitet eller försening.","Återrapportering bevisar inte verksamhetseffekt."],"summary":summary,"records":records}
(ROOT/"data/accountability-ledger.json").write_text(json.dumps(output,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(summary,ensure_ascii=False))
