"use client";
import { formatSwedishDate } from "@/lib/date-format";

import { useMemo, useState } from "react";
import catalogData from "@/data/public-catalog.json";
import type { Catalog } from "@/lib/types";
import { AlertCircle, CheckCircle2, Download, FileSearch, FileText, ShieldAlert } from "lucide-react";

const catalog = catalogData as unknown as Catalog;
const meeting = catalog.meetings[0];
const topics = ["Alla ämnen", ...Array.from(new Set(meeting.items.map((item) => item.topic))).sort()];

export default function ArchiveCoverage() {
  const [topic, setTopic] = useState("Alla ämnen");
  const [onlyGaps, setOnlyGaps] = useState(false);
  const rows = useMemo(() => meeting.items.map((item) => {
    const docs = item.documentIds.map((id) => catalog.documents.find((doc) => doc.id === id)).filter((doc): doc is NonNullable<typeof doc> => Boolean(doc));
    const readable = docs.filter((doc) => doc.fetchStatus === "ok").length;
    const errors = docs.filter((doc) => doc.fetchStatus !== "ok").length;
    return { item, docs, readable, errors };
  }).filter((row) => (topic === "Alla ämnen" || row.item.topic === topic) && (!onlyGaps || row.docs.length === 0 || row.errors > 0 || !meeting.protocolPublished)), [topic, onlyGaps]);

  const readableTotal = catalog.documents.filter((doc) => doc.fetchStatus === "ok").length;
  const errorTotal = catalog.documents.length - readableTotal;

  return <section className="archive-coverage" id="tackning">
    <div className="panel coverage-head"><div><p className="eyebrow">ARKIVTÄCKNING · SYNLIG NÄMNARE</p><h2>Vad går faktiskt att kontrollera?</h2><p>Vyn visar hela den importerade mötesmängden utan att tolka hämtningsfel som att en handling har försvunnit.</p></div><FileSearch size={38}/></div>
    <div className="coverage-kpis"><article className="panel"><strong>{meeting.items.length}</strong><span>dagordningspunkter</span></article><article className="panel"><strong>{catalog.documents.length}</strong><span>unika handlingar</span></article><article className="panel"><strong>{readableTotal}</strong><span>med läsbar text</span></article><article className="panel"><strong>{errorTotal}</strong><span>kräver annan läsning</span></article></div>
    <div className="panel coverage-controls"><label><span>Filtrera ämne</span><select value={topic} onChange={(event) => setTopic(event.target.value)}>{topics.map((value) => <option key={value}>{value}</option>)}</select></label><label className="coverage-check"><input type="checkbox" checked={onlyGaps} onChange={(event) => setOnlyGaps(event.target.checked)}/> Visa bara kontrollpunkter</label><span>Kontrollerad {formatSwedishDate(meeting.checkedAt, { dateStyle: "long", timeStyle: "short" })}</span></div>
    <div className="coverage-table" role="table" aria-label="Källtäckning per ärende">
      <div className="coverage-table-head" role="row"><span>Punkt och ärende</span><span>Handlingar</span><span>Text</span><span>Protokoll</span><span>Öppna</span></div>
      {rows.map(({ item, docs, readable, errors }) => <article role="row" key={item.id}>
        <div><b>{item.number}</b><span><strong>{item.title}</strong><small>{item.topic} · {item.location}</small></span></div>
        <span>{docs.length ? <><FileText size={15}/>{docs.length}</> : <><AlertCircle size={15}/>Inga bilagor</>}</span>
        <span className={errors ? "coverage-warn" : "coverage-ok"}>{errors ? <ShieldAlert size={15}/> : <CheckCircle2 size={15}/>} {readable}/{docs.length}</span>
        <span className="coverage-warn"><ShieldAlert size={15}/> {meeting.protocolPublished ? "Publicerat, ej granskat" : "Inte publicerat"}</span>
        <span className="coverage-actions"><a href={`/arenden/${item.id}`}>Ärende</a>{docs[0] && <><a href={`/dokument/${docs[0].id}`}>Läs</a><a href={`/api/original/${docs[0].id}`} aria-label={`Ladda ner första handlingen för punkt ${item.number}`}><Download size={14}/></a></>}</span>
      </article>)}
    </div>
    <p className="coverage-method"><strong>Statusförklaring:</strong> “Inte publicerat” gäller det justerade protokollet i den kontrollerade kommunala källan. “Kräver annan läsning” betyder att automatisk textutvinning inte lyckades; originalhandlingen finns kvar i registret.</p>
  </section>;
}
