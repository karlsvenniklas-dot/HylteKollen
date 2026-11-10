"use client";
import { formatSwedishDate } from "@/lib/date-format";

import { useEffect, useMemo, useState } from "react";
import journeys from "@/data/motion-journeys.json";
import { ArrowRight, CalendarClock, CheckCircle2, FileText, GitBranch, Hourglass, Info, Scale } from "lucide-react";

type RecordType = typeof journeys.records[number];

const pretty = (date: string) => formatSwedishDate(date, { day: "numeric", month: "short", year: "numeric" });

export default function MotionJourneys() {
  const [selectedId, setSelectedId] = useState(journeys.records[0].id);
  useEffect(() => { const requested = new URLSearchParams(window.location.search).get("motion"); if (requested && journeys.records.some((record) => record.id === requested)) setSelectedId(requested); }, []);
  const selected = journeys.records.find((record) => record.id === selectedId) || journeys.records[0];
  const computedDays = useMemo(() => Math.round((new Date("2026-09-08T12:00:00Z").getTime() - new Date(selected.receivedDate + "T12:00:00Z").getTime()) / 86400000), [selected]);
  const intervals = useMemo(() => selected.stages.slice(1).map((stage, index) => ({ from: selected.stages[index], to: stage, days: Math.round((new Date(stage.date + "T12:00:00Z").getTime() - new Date(selected.stages[index].date + "T12:00:00Z").getTime()) / 86400000) })), [selected]);
  const longest = intervals.reduce((best, interval) => interval.days > best.days ? interval : best, { from: selected.stages[0], to: selected.stages[0], days: 0 });

  return <div className="motion-journeys">
    <section className="panel motion-head">
      <div><p className="eyebrow">MOTIONSRESAN · KÄLLA FÖR KÄLLA</p><h2>Från förslag till verifierat utfall</h2><p>Välj en motion och följ den genom fullmäktige, remiss, nämnd, utskott och kommunstyrelse. Varje steg öppnar den handling som belägger just det steget.</p></div><GitBranch size={44}/>
    </section>

    <section className="motion-overview" aria-label="Motioner i den importerade ärendekedjan">
      {journeys.records.map((record) => <button type="button" key={record.id} className={record.id === selected.id ? "panel active" : "panel"} onClick={() => { setSelectedId(record.id); window.history.replaceState(null, "", `/motioner?motion=${record.id}`); }}><span className="motion-party">{record.party}</span><strong>{record.shortTitle}</strong><small>{record.stages.length} källbelagda steg</small><span className="motion-state">{record.protocolVerified ? `KF §${record.protocolParagraph} · protokollsverifierat` : record.stages.length <= 2 ? "Nyinkommen" : "Kommunens redovisning · protokollkontroll återstår"}</span></button>)}
    </section>

    <div className="motion-workspace">
      <section className="panel motion-detail" aria-live="polite">
        <div className="motion-title"><div><p className="eyebrow">{selected.docket}</p><h2>{selected.shortTitle}</h2><p>{selected.authors} · {selected.party}</p></div><span className="motion-party large">{selected.party}</span></div>
        <div className="motion-facts"><div><CalendarClock size={18}/><strong>{pretty(selected.receivedDate)}</strong><span>Mottagen/redovisad</span></div><div><GitBranch size={18}/><strong>{selected.stages.length}</strong><span>Dokumenterade steg</span></div><div><Hourglass size={18}/><strong>{computedDays} dagar</strong><span>Observerad kedjetid till 8 sep 2026</span></div></div>
        {intervals.length > 0 && <div className="motion-intervals"><div className="sectionhead"><h3>Observerade intervall</h3><span>Längsta luckan i källkedjan: {longest.days} dagar</span></div>{intervals.map((interval) => <div key={`${interval.from.date}-${interval.to.date}`}><span>{interval.from.label} → {interval.to.label}</span><b>{interval.days} dagar</b></div>)}<p>Intervallen är beräknade mellan daterade källhändelser. De är inte lagstadgade handläggningstider och visar inte att ett ärende varit försenat.</p></div>}
        <div className="motion-timeline">
          {selected.stages.map((stage, index) => <article key={stage.date + stage.label} className={stage.kind}>
            <div className="motion-rail"><span>{stage.kind === "decision" ? <CheckCircle2 size={15}/> : stage.kind === "reported" ? <Info size={15}/> : <FileText size={15}/>}</span>{index < selected.stages.length - 1 && <i/>}</div>
            <div><time>{pretty(stage.date)}</time><h3>{stage.label}</h3><p>{stage.body}</p>{stage.documentId ? <a className="out" href={`/dokument/${stage.documentId}${stage.page?`#sida-${stage.page}`:""}`}>Läs källhandlingen{stage.page?` · PDF sida ${stage.page}`:""} <FileText size={14}/></a> : <a className="out" href={journeys.municipalSummaryUrl} target="_blank" rel="noreferrer">Kommunens sammanfattning <ArrowRight size={14}/></a>}</div>
          </article>)}
        </div>
      </section>

      <aside className="motion-side">
        <section className="panel motion-outcome"><Scale size={25}/><p className="eyebrow">{selected.protocolVerified?"JUSTERAT KF-PROTOKOLL":"REDOVISAT UTFALL"}</p><h3>{selected.protocolVerified?`Beslut verifierat · §${selected.protocolParagraph}`:selected.stages.length <= 2 ? "Beredning inväntas" : "Kommunens sammanfattning finns"}</h3><p>{selected.summaryOutcome}</p>{selected.protocolVerified?<a className="out" href={`/dokument/${selected.protocolDocumentId}#sida-${selected.protocolPage}`}>PDF sida {selected.protocolPage} <ArrowRight size={14}/></a>:<span className="motion-unverified">Ej verifierat mot justerat KF-protokoll</span>}</section>
        <section className="panel motion-method"><Info size={22}/><h3>Tre skilda nivåer</h3><ol><li><strong>Fakta:</strong> daterade handlingar och justerade protokoll från varje organ.</li><li><strong>Kommunens redovisning:</strong> separat nyhetssammanfattning efter mötet.</li><li><strong>Slutligt KF-utfall:</strong> publiceras först med paragraf och sida i justerat protokoll.</li></ol></section>
      </aside>
    </div>
  </div>;
}
