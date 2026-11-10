"use client";

import { useState } from "react";
import diffs from "@/data/decision-diffs.json";
import { ArrowRight, CheckCircle2, FileDiff, FileText, HelpCircle, ShieldAlert, XCircle } from "lucide-react";

const states: Record<string, { label: string; icon: typeof CheckCircle2 }> = {
  examined: { label: "Utredd", icon: CheckCircle2 },
  answered: { label: "Bemött i beredningen", icon: CheckCircle2 },
  rejected: { label: "Föreslogs avslås", icon: XCircle },
  not_advanced: { label: "Fördes inte vidare", icon: XCircle },
  unclear: { label: "Inte verifierat", icon: HelpCircle },
};

export default function DecisionDiff() {
  const [selectedId, setSelectedId] = useState(diffs.records[0].id);
  const selected = diffs.records.find((record) => record.id === selectedId) || diffs.records[0];

  return <div className="decision-diff">
    <section className="panel diff-head"><div><p className="eyebrow">BESLUTSDIFFEN · FÖRSLAG MOT BEREDNING</p><h2>Vad hände med förslaget?</h2><p>Jämför motionens egna att-satser med kommunens beredning, punkt för punkt. Redovisat mötesutfall visas separat tills det justerade protokollet kan kontrolleras.</p></div><FileDiff size={46}/></section>

    <div className="diff-tabs" role="tablist" aria-label="Välj motion">{diffs.records.map((record) => <button type="button" role="tab" aria-selected={record.id === selected.id} key={record.id} className={record.id === selected.id ? "active" : ""} onClick={() => setSelectedId(record.id)}><span>{record.party}</span><strong>{record.title}</strong></button>)}</div>

    <section className="panel diff-summary"><div><p className="eyebrow">{selected.protocolVerified?"BESLUT I JUSTERAT PROTOKOLL":"REDOVISAT EFTER MÖTET"}</p><h2>{selected.title}</h2><p>{selected.reportedOutcome}</p>{selected.protocolVerified&&<a className="out" href={`/dokument/${selected.protocolDocumentId}#sida-${selected.protocolPage}`}>KF §{selected.protocolParagraph} · PDF sida {selected.protocolPage}<ArrowRight size={14}/></a>}</div><div className="diff-protocol"><ShieldAlert size={20}/><span><strong>{selected.protocolVerified?"Protokollsverifierat":"Väntar på protokollverifiering"}</strong>{selected.protocolVerified?"Justerat KF-protokoll kontrollerat. Tabellen nedan beskriver fortfarande beredningens hantering.":"Justerat KF-protokoll med paragraf och sida inväntas."}</span></div></section>

    <section className="diff-table">
      <div className="diff-table-head"><span>Motionens förslag</span><span>Beredningens hantering</span><span>Status i beredningen</span></div>
      {selected.requests.map((row, index) => { const StateIcon = states[row.state].icon; return <article key={row.request}><div><b>{index + 1}</b><p>{row.request}</p></div><div><ArrowRight size={17}/><p>{row.preparation}</p></div><div className={row.state}><StateIcon size={17}/><strong>{states[row.state].label}</strong></div></article>; })}
    </section>

    <section className="panel diff-sources"><div><FileText size={21}/><span><strong>Ursprungsförslaget</strong><a className="out" href={`/dokument/${selected.motionDocumentId}`}>Läs motionen <ArrowRight size={14}/></a></span></div><div><FileText size={21}/><span><strong>Beredningen</strong><a className="out" href={`/dokument/${selected.preparationDocumentId}`}>Läs kommunstyrelsens handling <ArrowRight size={14}/></a></span></div><div><ShieldAlert size={21}/><span><strong>Slutligt utfall</strong><a className="out" href="/beslutskontroll">Följ protokollstatus <ArrowRight size={14}/></a></span></div><a className="primary" href={`/arenden/${selected.itemId}`}>Öppna hela ärendet <ArrowRight size={15}/></a></section>

    <p className="note">Statuskolumnen beskriver hur enskilda förslag hanterades i beredningen. Den är inte ett betyg och ersätter inte kommunfullmäktiges justerade protokoll.</p>
  </div>;
}
