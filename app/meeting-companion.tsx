"use client";

import { useMemo, useState } from "react";
import catalog from "@/data/public-catalog.json";
import { ArrowLeft, ArrowRight, CalendarDays, ExternalLink, FileText, ListFilter, MapPin, PlayCircle, ShieldCheck } from "lucide-react";

const meeting = catalog.meetings[0];
const allItems = meeting.items;

const friendly: Record<number, string> = {
  6: "Rydö skola: lokalerna efter återremissen",
  7: "Arbetsformer för kommunens råd",
  8: "Regler för hemsjukvård och hjälpmedel",
  9: "Regler för Patientnämnden Halland",
  10: "Motion om bygglovsavgifter",
  11: "Motion om en välkomstskylt",
  12: "Motion om kommunens resepolicy",
  13: "Interpellation om aktivitetskravet",
  14: "Inkomna interpellationer",
  15: "Motion om laddning för tung trafik",
};

const context: Record<number, string> = {
  6: "Frågan gäller avtal, driftbidrag och framtida användning av gymnastiksalen och den tidigare förskolan i Rydöbruk.",
  7: "Förslaget reglerar hur kommunens tillgänglighets- och pensionärsråd ska arbeta och vara organiserat.",
  8: "Ärendet gäller ett gemensamt regionalt reglemente för hemsjukvård och hjälpmedel.",
  9: "Ärendet gäller reglerna för Patientnämnden Halland.",
  10: "Motionen vill ta bort bygglovsavgifter. Underlagen beskriver förvaltningens bedömning och tidigare politisk behandling.",
  11: "Motionen gäller välkomstskyltar och innehåller kostnadsbedömningar samt tidigare behandling i nämnd och styrelse.",
  12: "Motionen föreslår att kommunens resepolicy ska öppna för flygresor i fler situationer.",
  13: "Interpellationen frågar hur kommunen förberett sig för aktivitetskravet inom ekonomiskt bistånd.",
  14: "Punkten samlar nya interpellationer som lämnas in till fullmäktige.",
  15: "Punkten gäller en ny motion om laddinfrastruktur för tung trafik.",
};

type Filter = "all" | "issues" | "initiatives";

export default function MeetingCompanion() {
  const [filter, setFilter] = useState<Filter>("issues");
  const [selectedId, setSelectedId] = useState(() => {
    const point = typeof window === "undefined" ? null : Number(new URLSearchParams(window.location.search).get("punkt"));
    return allItems.find((item) => item.number === point)?.id || allItems.find((item) => item.number === 6)?.id || allItems[0].id;
  });
  const visible = useMemo(() => allItems.filter((item) => filter === "all" || (filter === "issues" ? item.topic !== "Mötesformalia" : /motion|interpellation/i.test(item.title))), [filter]);
  const selected = visible.find((item) => item.id === selectedId) || visible[0] || allItems[0];
  const selectedIndex = visible.findIndex((item) => item.id === selected.id);
  const documents = catalog.documents.filter((document) => selected.documentIds.includes(document.id));

  function choose(id: string) {
    setSelectedId(id);
    const item = allItems.find((entry) => entry.id === id);
    if (item) history.replaceState(null, "", `/moteskompisen?punkt=${item.number}`);
  }

  function move(step: number) {
    const next = visible[selectedIndex + step];
    if (next) choose(next.id);
  }

  return (
    <div className="meeting-mode">
      <section className="panel meeting-mode-head">
        <div><p className="eyebrow">MÖTESKOMPISEN · KOMMUNFULLMÄKTIGE</p><h2>Dagordning och källor i samma vy</h2><p>{meeting.date} · {meeting.time} · {meeting.venue}</p></div>
        <div className="meeting-source-state"><ShieldCheck size={20}/><span>{meeting.protocolPublished ? "Justerat protokoll importerat" : "Justerat fullmäktigeprotokoll saknas i importen"}</span></div>
      </section>

      <div className="meeting-workspace">
        <aside className="panel agenda-pane">
          <div className="sectionhead"><h2>Dagordning</h2><span>{visible.length} {filter === "issues" ? "sakpunkter" : "punkter"}</span></div>
          <div className="agenda-filters" aria-label="Filtrera dagordningen">
            <button type="button" className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Alla</button>
            <button type="button" className={filter === "issues" ? "active" : ""} onClick={() => setFilter("issues")}>Sakfrågor</button>
            <button type="button" className={filter === "initiatives" ? "active" : ""} onClick={() => setFilter("initiatives")}>Initiativ</button>
          </div>
          <div className="agenda-list">
            {visible.map((item) => <button type="button" key={item.id} onClick={() => choose(item.id)} className={selected.id === item.id ? "active" : ""}><span>{String(item.number).padStart(2, "0")}</span><div><strong>{friendly[item.number] || item.title}</strong><small>{item.topic} · {item.documentIds.length} {item.documentIds.length === 1 ? "handling" : "handlingar"}</small></div></button>)}
          </div>
        </aside>

        <section className="panel meeting-focus" aria-live="polite">
          <div className="meeting-focus-meta"><span>Punkt {selected.number}</span><span><MapPin size={14}/>{selected.location}</span><span>{selected.topic}</span></div>
          <h2>{friendly[selected.number] || selected.title}</h2>
          <p className="meeting-context">{context[selected.number] || "Punkten saknar en redaktionell sammanfattning. Läs originalhandlingarna för fullständig information."}</p>

          <div className="meeting-actions">
            <a className="primary" href={`/arenden/${selected.id}`}>Öppna ärendesidan <ArrowRight size={16}/></a>
            <a className="out" href={meeting.url} target="_blank" rel="noreferrer">Mötets originalsida <ExternalLink size={14}/></a>
          </div>

          <div className="meeting-documents">
            <div className="sectionhead"><h3>Handlingar för punkten</h3><span>{documents.length}</span></div>
            {documents.length ? documents.slice(0, 8).map((document) => <a key={document.id} href={`/dokument/${document.id}`}><FileText size={18}/><div><strong>{document.title}</strong><small>{document.pageCount} sidor · {document.fetchStatus === "ok" ? "text importerad" : "original länkat"}</small></div><ArrowRight size={15}/></a>) : <div className="meeting-empty"><FileText size={22}/><p>Inga offentliga bilagor finns i den aktuella importen för denna punkt.</p></div>}
            {documents.length > 8 && <a className="meeting-more" href={`/arenden/${selected.id}`}>Visa alla {documents.length} handlingar <ArrowRight size={14}/></a>}
          </div>

          <div className="meeting-nav"><button type="button" disabled={selectedIndex <= 0} onClick={() => move(-1)}><ArrowLeft size={16}/> Föregående</button><span>{selectedIndex + 1} av {visible.length}</span><button type="button" disabled={selectedIndex < 0 || selectedIndex >= visible.length - 1} onClick={() => move(1)}>Nästa <ArrowRight size={16}/></button></div>
        </section>

        <aside className="panel meeting-media">
          <PlayCircle size={35}/><p className="eyebrow">OFFICIELL SÄNDNING</p><h3>Ingen video är ännu kopplad till mötet</h3><p>När en officiell Hylte-video har importerats visas den här tillsammans med tidsstämplar för varje ärende.</p>
          <a className="out" href="https://youtube.com/@hyltekommun" target="_blank" rel="noreferrer">Hylte kommuns YouTube <ExternalLink size={14}/></a>
          <div className="meeting-media-note"><CalendarDays size={17}/><span>Videoinformation markeras som preliminär tills beslutet har verifierats mot justerat protokoll.</span></div>
        </aside>
      </div>

      <section className="notice"><ListFilter size={18}/><div><strong>Ett arbetsläge, inte en ny datakälla</strong><br/>Möteskompisen samlar samma Hylte-handlingar i en snabbare vy. Originalhandling och justerat protokoll gäller alltid före sammanfattningen.</div></section>
    </div>
  );
}
