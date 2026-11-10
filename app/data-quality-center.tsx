import { formatSwedishDate } from "@/lib/date-format";
import catalog from "@/data/public-catalog.json";
import history from "@/data/history-coverage.json";
import observations from "@/data/politician-observations.json";
import network from "@/data/document-network.json";
import followups from "@/data/followups.json";
import protocolArchive from "@/data/historical-protocol-archive-index.json";
import { AlertTriangle, CheckCircle2, Database, FileWarning, ShieldCheck } from "lucide-react";

export default function DataQualityCenter() {
  const readable = catalog.documents.filter((doc) => doc.fetchStatus === "ok").length;
  const notObserved = catalog.documents.filter((doc) => "sourcePresence" in doc && doc.sourcePresence === "not_observed_on_latest_meeting_page").length;
  const meetingIds = new Set(catalog.meetings.map((meeting) => meeting.id));
  const itemIds = new Set(catalog.meetings.flatMap((meeting) => meeting.items.map((item) => item.id)));
  const brokenRelations = catalog.documents.filter((doc) => !meetingIds.has(doc.meetingId) || !itemIds.has(doc.itemId)).length;
  const checks = [
    { label: "Dagordningstäckning", value: `${catalog.meetings[0].items.length}/18 registrerade punkter`, ok: catalog.meetings[0].items.length === 18 },
    { label: "Textläsbarhet", value: `${readable}/${catalog.documents.length} handlingar med läsbar text`, ok: readable === catalog.documents.length },
    { label: "Dokumentrelationer", value: `${brokenRelations} brutna dokument→ärende/möte-relationer`, ok: brokenRelations === 0 },
    { label: "Källnärvaro", value: `${notObserved} dokument observerades inte på senaste mötessidan; posterna har bevarats`, ok: notObserved === 0 },
    { label: "Diarienummer", value: `${network.dockets.length} exakta eller granskade identiteter`, ok: true },
    { label: "Historisk protokolltäckning", value: `${protocolArchive.summary.verifiedProtocols} verifierade protokoll med ${protocolArchive.summary.searchablePages} sökbara sidor från ${protocolArchive.summary.bodiesWithVerifiedProtocols} av 15 organ; ${protocolArchive.summary.manualReviewFiles} filer kräver manuell kontroll`, ok: protocolArchive.summary.manualReviewFiles === 0 },
    { label: "Politikerstatistik", value: `${observations.meetingsObserved} observerade möten; fullständig nämnare saknas`, ok: false },
    { label: "Uppföljning", value: `${followups.records.length} källregistrerade poster`, ok: true },
  ];
  return <div className="quality-center" id="datakvalitet">
    <section className="panel quality-hero"><div><p className="eyebrow">DATAKVALITET · VAD KAN SIFFRORNA BÄRA?</p><h2>Öppet om luckor, urval och verifiering</h2><p>Den här sidan visar både fungerande källkedjor och sådant som ännu inte kan användas för jämförelser eller ranking.</p></div><ShieldCheck size={40}/></section>
    <section className="quality-kpis"><article className="panel"><strong>{catalog.documents.length}</strong><span>offentliga dokument</span></article><article className="panel"><strong>{readable}/{catalog.documents.length}</strong><span>med importerad text</span></article><article className="panel"><strong>{brokenRelations}</strong><span>brutna relationer</span></article><article className="panel"><strong>{history.summary.listedMeetings}</strong><span>listade KF-möten 2022–2026</span></article></section>
    <section className="panel"><div className="sectionhead"><h2>Kvalitetskontroller</h2><Database size={22}/></div><div className="quality-list">{checks.map((check) => <article key={check.label}>{check.ok ? <CheckCircle2 size={20}/> : <AlertTriangle size={20}/>}<div><strong>{check.label}</strong><span>{check.value}</span></div><b>{check.ok ? "Användbart inom angiven täckning" : "Kontrollpunkt eller begränsat underlag"}</b></article>)}</div></section>
    <section className="notice"><FileWarning size={20}/><div><strong>Grundregel</strong><br/>Hämtningsfel, saknad exakt träff eller ofullständig historik får aldrig beskrivas som att ett ärende, dokument eller uppdrag har försvunnit eller inte genomförts. Senast lyckade katalogkontroll: {formatSwedishDate(catalog.checkedAt, { dateStyle: "long", timeStyle: "short" })}.</div></section>
  </div>;
}
