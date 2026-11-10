"use client";

import { useEffect, useMemo, useState } from "react";
import catalogData from "@/data/public-catalog.json";
import questionData from "@/data/question-bank.json";
import journeyData from "@/data/motion-journeys.json";
import type { Catalog } from "@/lib/types";
import { ArrowRight, Columns3, FileText, ShieldAlert } from "lucide-react";

const catalog = catalogData as unknown as Catalog;
const meeting = catalog.meetings[0];
const choices = meeting.items.filter((item) => item.documentIds.length > 0);

export default function CaseComparison() {
  const defaults = choices.filter((item) => [10, 11, 12].includes(item.number)).map((item) => item.id);
  const [selected, setSelected] = useState(defaults);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = [params.get("a"), params.get("b"), params.get("c")].filter((id): id is string => Boolean(id) && choices.some((item) => item.id === id));
    if (requested.length >= 2 && new Set(requested).size === requested.length) setSelected(requested.slice(0, 3));
  }, []);
  const rows = useMemo(() => selected.map((id) => {
    const item = choices.find((candidate) => candidate.id === id) || choices[0];
    const docs = item.documentIds.map((docId) => catalog.documents.find((doc) => doc.id === docId)).filter((doc): doc is NonNullable<typeof doc> => Boolean(doc));
    return { item, docs, readable: docs.filter((doc) => doc.fetchStatus === "ok").length, questions: questionData.records.find((record) => record.itemId === id)?.questions.length || 0, stages: journeyData.records.find((record) => record.itemId === id)?.stages.length || 0 };
  }), [selected]);
  function change(index: number, id: string) { setSelected((current) => { const next = current.map((value, rowIndex) => rowIndex === index ? id : value); const params = new URLSearchParams({ a: next[0], b: next[1], ...(next[2] ? { c: next[2] } : {}) }); window.history.replaceState(null, "", `/jamfor?${params}`); return next; }); }
  return <section className="case-comparison panel"><div className="sectionhead"><div><p className="eyebrow">ÄRENDEJÄMFÖRAREN · KÄLLTÄCKNING</p><h2>Jämför underlag, inte politiska värden</h2></div><Columns3 size={26}/></div><p>Välj tre dagordningspunkter. Jämförelsen visar enbart importerad omfattning och granskningsstatus — inte vilket ärende som är viktigast eller bäst.</p><div className="comparison-selects">{selected.map((id, index) => <label key={index}><span>Ärende {index + 1}</span><select value={id} onChange={(event) => change(index, event.target.value)}>{choices.map((item) => <option value={item.id} key={item.id} disabled={selected.some((value, selectedIndex) => selectedIndex !== index && value === item.id)}>Punkt {item.number} · {item.title}</option>)}</select></label>)}</div><div className="comparison-grid">{rows.map(({ item, docs, readable, questions, stages }) => <article key={item.id}><span className="comparison-number">{item.number}</span><h3>{item.title}</h3><p>{item.topic} · {item.location}</p><dl><div><dt>Handlingar</dt><dd>{docs.length}</dd></div><div><dt>Läsbar text</dt><dd>{readable}/{docs.length}</dd></div><div><dt>Kontrollfrågor</dt><dd>{questions || "Inte särskilt granskat"}</dd></div><div><dt>Motionssteg</dt><dd>{stages || "Inte registrerat"}</dd></div></dl><span className="comparison-protocol"><ShieldAlert size={14}/> {meeting.protocolPublished ? "Protokoll publicerat, kräver granskning" : "Justerat KF-protokoll inväntas"}</span><a href={`/arenden/${item.id}`}>Öppna ärendet <ArrowRight size={14}/></a>{docs[0] && <a href={`/dokument/${docs[0].id}`}><FileText size={14}/> Första handlingen</a>}<a href={`/kallpaket?arende=${item.id}`}>Öppna källpaket <ArrowRight size={14}/></a></article>)}</div></section>;
}
