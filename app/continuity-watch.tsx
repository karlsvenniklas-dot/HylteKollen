"use client";

import { useState } from "react";
import watch from "@/data/continuity-watch.json";
import followups from "@/data/followups.json";
import catalog from "@/data/public-catalog.json";
import { ArrowRight, CalendarClock, CheckCircle2, FileQuestion, FileSearch, Info, Link2 } from "lucide-react";

type WatchState = "all" | "later_treatment" | "no_exact_match_in_import";

export default function ContinuityWatch() {
  const [filter, setFilter] = useState<WatchState>("all");
  const entries = watch.entries.filter((entry) => filter === "all" || entry.state === filter);
  const linked = watch.entries.filter((entry) => entry.state === "later_treatment").length;
  const gaps = watch.entries.length - linked;

  return <div className="continuity-watch">
    <section className="panel continuity-head">
      <div><p className="eyebrow">KÄLLGLAPP · EXAKTA DIARIENUMMER</p><h2>Frågan som försvann</h2><p>Se vilka öppna uppdrag som har en senare dokumentkedja — och vilka som ännu saknar en ny exakt träff i Hyltekollens begränsade import.</p></div>
      <FileSearch size={38}/>
    </section>
    <section className="continuity-kpis">
      <article><CheckCircle2 size={21}/><strong>{linked}</strong><span>har senare behandling i importen</span></article>
      <article><FileQuestion size={21}/><strong>{gaps}</strong><span>saknar ny exakt diarieträff</span></article>
      <article><CalendarClock size={21}/><strong>{watch.entries.length}</strong><span>öppna uppdrag kontrollerade</span></article>
    </section>
    <div className="continuity-filters" aria-label="Filtrera källglapp">
      <button type="button" className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Alla</button>
      <button type="button" className={filter === "later_treatment" ? "active" : ""} onClick={() => setFilter("later_treatment")}>Senare behandling</button>
      <button type="button" className={filter === "no_exact_match_in_import" ? "active" : ""} onClick={() => setFilter("no_exact_match_in_import")}>Källglapp</button>
    </div>
    <section className="continuity-list">
      {entries.map((entry) => {
        const record = followups.records.find((item) => item.id === entry.followupId)!;
        const documents = entry.matchedDocumentIds.map((id) => catalog.documents.find((doc) => doc.id === id)).filter(Boolean);
        const isGap = entry.state === "no_exact_match_in_import";
        return <article className="panel continuity-card" key={entry.followupId}>
          <div className="continuity-status"><span className={isGap ? "gap" : "found"}>{isGap ? "KÄLLGLAPP I IMPORTEN" : "SENARE BEHANDLING HITTAD"}</span><time>{entry.observedOn}</time></div>
          <div className="continuity-title"><div><p className="smallmeta">{record.docket} · {record.responsible.join(" / ")}</p><h2>{record.title}</h2></div><span>{record.location}</span></div>
          <p>{entry.note}</p>
          {documents.length > 0 && <div className="continuity-docs"><strong>Senare källor</strong>{documents.map((document) => document && <a key={document.id} href={`/dokument/${document.id}`}><Link2 size={15}/><span>{document.title}</span><ArrowRight size={15}/></a>)}</div>}
          <div className="continuity-actions"><a className="out" href={`/uppfoljning/${record.id}`}>Öppna uppdragets tidslinje <ArrowRight size={15}/></a>{record.relatedItem && <a className="out" href={`/arenden/${record.relatedItem}`}>Öppna senare ärende <ArrowRight size={15}/></a>}</div>
        </article>;
      })}
    </section>
    <section className="notice continuity-method"><Info size={19}/><div><strong>Vad betyder ett källglapp?</strong><br/>{watch.method} Kontrollen är daterad {watch.checkedAt}.</div></section>
  </div>;
}
