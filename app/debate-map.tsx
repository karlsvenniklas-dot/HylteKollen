"use client";

import { useMemo, useState } from "react";
import catalog from "@/data/public-catalog.json";
import { ArrowRight, Clock3, ExternalLink, FileText, Newspaper, PlayCircle, ShieldAlert } from "lucide-react";

const meeting = catalog.meetings.find((entry) => entry.id === "kf-2026-09-08")!;
const webcastNotice = "https://www.hylte.se/nyheter/nyhetsarkiv/2026-09-08-webbsandning-av-kommunfullmaktige-8-september";
const webcastArchive = "https://www.hylte.se/kommun-och-politik/kommunens-organisation/kommunfullmaktige/webbsandning-av-kommunfullmaktige";
const municipalSummary = "https://www.hylte.se/nyheter/nyhetsarkiv/2026-09-10-sammanfattning-av-kommunfullmaktige-8-september";

const friendly: Record<number, string> = {
  6: "Rydö skola", 7: "Kommunens råd", 8: "Hemsjukvård och hjälpmedel",
  9: "Patientnämnden Halland", 10: "Bygglovsavgifter", 11: "Välkomstskylt",
  12: "Resepolicy", 13: "Aktivitetskravet", 14: "Inkomna interpellationer",
  15: "Laddning för tung trafik",
};

const summaries: Record<number, string> = {
  6: "Kommunens nyhetssammanfattning beskriver att återremissen ansågs besvarad, att avtal ska undertecknas och att kommunstyrelsen fick ett genomförandeuppdrag.",
  7: "Kommunens nyhetssammanfattning uppger att arbetsformerna för det gemensamma tillgänglighets- och pensionärsrådet antogs.",
  8: "Kommunens nyhetssammanfattning beskriver stöd för ett reviderat gemensamt reglemente och ett namnbyte för nämnden.",
  9: "Kommunens nyhetssammanfattning uppger att fullmäktige inte hade någon invändning mot det reviderade reglementet.",
  10: "Kommunens nyhetssammanfattning uppger att motionen om att slopa bygglovsavgifter avslogs.",
  11: "Kommunens nyhetssammanfattning uppger att motionen om en välkomstskylt avslogs.",
  12: "Kommunens nyhetssammanfattning uppger att motionen om resepolicyn ansågs besvarad.",
  14: "Kommunens nyhetssammanfattning nämner att en interpellation lämnades in.",
  15: "Kommunens nyhetssammanfattning nämner att en motion lämnades in.",
};

export default function DebateMap() {
  const issues = meeting.items.filter((item) => item.number >= 6 && item.number <= 15);
  const [selectedNumber, setSelectedNumber] = useState(6);
  const selected = issues.find((item) => item.number === selectedNumber) || issues[0];
  const documents = useMemo(() => catalog.documents.filter((document) => selected.documentIds.includes(document.id)), [selected]);

  return (
    <div className="debate-map">
      <section className="panel debate-hero">
        <div><p className="eyebrow">DEBATTKARTAN · KF 8 SEPTEMBER 2026</p><h2>Följ sändningen ärende för ärende</h2><p>Dagordningen, kommunens efterhandssammanfattning och originalhandlingarna ligger i samma vy. Inga talare, tidsstämplar eller beslut fylls i utan verifierbar källa.</p></div>
        <PlayCircle size={50} aria-hidden="true" />
      </section>

      <section className="debate-status-grid">
        <article className="panel"><PlayCircle size={23}/><p className="eyebrow">SÄNDNING</p><strong>Annonserad av kommunen</strong><span>En unik arkivlänk för just detta möte är ännu inte verifierad.</span><a className="out" href={webcastNotice} target="_blank" rel="noreferrer">Se kommunens sändningsnotis <ExternalLink size={14}/></a></article>
        <article className="panel"><Newspaper size={23}/><p className="eyebrow">EFTER MÖTET</p><strong>Kommunal sammanfattning finns</strong><span>Publicerad 10 september. Den är inte ett justerat protokoll.</span><a className="out" href={municipalSummary} target="_blank" rel="noreferrer">Läs kommunens sammanfattning <ExternalLink size={14}/></a></article>
        <article className="panel warning"><ShieldAlert size={23}/><p className="eyebrow">VERIFIERING</p><strong>Protokoll inväntas</strong><span>Beslut, paragraf och votering fastställs först mot justerat protokoll.</span><a className="out" href="/beslutskontroll">Öppna beslutskontrollen <ArrowRight size={14}/></a></article>
      </section>

      <div className="debate-workspace">
        <aside className="panel debate-track" aria-label="Mötets sakfrågor">
          <div className="sectionhead"><h2>Ärendespår</h2><span>{issues.length} punkter</span></div>
          {issues.map((item) => <button type="button" key={item.id} className={selected.number === item.number ? "active" : ""} onClick={() => setSelectedNumber(item.number)}><span className="debate-number">{String(item.number).padStart(2, "0")}</span><span className="debate-node"/><span><strong>{friendly[item.number] || item.title}</strong><small>{summaries[item.number] ? "Kommunens sammanfattning finns" : "Endast dagordning och handlingar"}</small></span></button>)}
        </aside>

        <section className="panel debate-focus" aria-live="polite">
          <div className="debate-focus-meta"><span>Punkt {selected.number}</span><span>{selected.topic}</span><span>{selected.location}</span></div>
          <h2>{friendly[selected.number] || selected.title}</h2><p className="debate-original-title">{selected.title}</p>
          <div className="debate-timestamp"><Clock3 size={19}/><div><strong>Tidsstämpel ej verifierad</strong><p>Videons start- och sluttid för ärendet publiceras först när rätt inspelning har identifierats och granskats.</p></div></div>
          <div className="debate-summary"><p className="eyebrow">KOMMUNENS NYHETSSAMMANFATTNING</p><p>{summaries[selected.number] || "Den separata kommunala sammanfattningen ger ingen tydlig ärendespecifik uppgift för denna punkt. Läs handlingarna och invänta justerat protokoll."}</p><p className="note">Detta återger en kommunal nyhetstext, inte ett protokollsverifierat beslut.</p></div>
          <div className="meeting-actions"><a className="primary" href={`/arenden/${selected.id}`}>Öppna hela ärendet <ArrowRight size={16}/></a><a className="out" href={municipalSummary} target="_blank" rel="noreferrer">Kontrollera sammanfattningen <ExternalLink size={14}/></a></div>
          <div className="debate-documents"><div className="sectionhead"><h3>Handlingar före mötet</h3><span>{documents.length}</span></div>{documents.slice(0, 5).map((document) => <a key={document.id} href={`/dokument/${document.id}`}><FileText size={17}/><span><strong>{document.title}</strong><small>{document.pageCount} sidor · läs eller ladda ner original</small></span><ArrowRight size={14}/></a>)}{!documents.length && <p className="small">Inga offentliga bilagor finns i den aktuella importen för punkten.</p>}{documents.length > 5 && <a className="debate-all-docs" href={`/arenden/${selected.id}`}>Visa alla {documents.length} handlingar <ArrowRight size={14}/></a>}</div>
        </section>

        <aside className="panel debate-video-card">
          <div className="video-placeholder"><PlayCircle size={45}/><strong>Inspelning söks</strong><span>Ingen specifik videolänk eller tidskod är verifierad.</span></div>
          <a className="primary" href={webcastArchive} target="_blank" rel="noreferrer">Kommunens videoarkiv <ExternalLink size={15}/></a>
          <p className="small">När kommunen publicerar en verifierbar inspelning kan varje punkt få klickbar starttid. Talare namnges bara när identiteten går att styrka.</p>
        </aside>
      </div>
    </div>
  );
}
