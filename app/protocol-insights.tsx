"use client";

import { useEffect, useMemo, useState } from "react";
import {useUrlSelection} from '@/lib/url-selection';
import ShareSelection from './share-selection';
import { ArrowRight, Coins, FileSearch, GitBranch, MapPin, Scale, Search } from "lucide-react";

type Paragraph = any;
const FORMALIA = /^(Val av justerare|Godkännande av ärendelista|Meddelanden?|Information från revisorerna|Inkomna (motioner|interpellationer)|Avsägelser|Fyllnadsval|Övriga ärenden)/i;

export default function ProtocolInsights() {
  const [insights, setInsights] = useState<any>(null);
  const [query, setQuery] = useUrlSelection('sok',"");
  const [body, setBody] = useUrlSelection('organ',"Alla organ");
  const [topic, setTopic] = useUrlSelection('amne',"Alla ämnen");
  const [mode, setMode] = useUrlSelection('vy',"paragraphs",['paragraphs','chains','signals']);
  useEffect(() => { fetch("/data/protocol-insights.json").then((response) => { if (!response.ok) throw new Error(); return response.json(); }).then(setInsights).catch(() => setInsights({ error: true })); }, []);
  const rows = useMemo(() => {
    if (!insights || insights.error) return [];
    const needle = query.trim().toLocaleLowerCase("sv-SE");
    return insights.paragraphs.filter((row) =>
      (body === "Alla organ" || row.body === body) &&
      (topic === "Alla ämnen" || row.topic === topic) &&
      (!needle || `${row.title} ${row.docket || ""} ${row.body} ${row.meetingDate} ${row.amounts.join(" ")} ${row.titlePlaces.join(" ")}`.toLocaleLowerCase("sv-SE").includes(needle))
    );
  }, [query, body, topic, insights]);
  if (!insights) return <section className="panel"><h2>Öppnar protokollanalysen …</h2></section>;
  if (insights.error) return <section className="panel"><h2>Protokollanalysen kunde inte hämtas</h2><p>Prova igen om en stund. Källregistret finns kvar på sidan Data & täckning.</p></section>;
  const bodies = ["Alla organ", ...insights.bodies.map((row) => row.name)];
  const topics = ["Alla ämnen", ...insights.topics.map((row) => row.name)];
  const substantiveChains = insights.docketChains.filter((chain) => chain.events.some((event) => !FORMALIA.test(event.title)));
  const amountRows = insights.paragraphs.filter((row) => row.amounts.length).slice().sort((a, b) => b.meetingDate.localeCompare(a.meetingDate));
  const placeRows = insights.paragraphs.filter((row) => row.titlePlaces.length).slice().sort((a, b) => b.meetingDate.localeCompare(a.meetingDate));

  return <section className="protocol-insights">
    <ShareSelection/>
    <div className="panel protocol-insights-hero"><div><p className="eyebrow">PROTOKOLLUTFORSKAREN · VERIFIERADE KÄLLOR</p><h2>{insights.summary.pages.toLocaleString("sv-SE")} sökbara sidor i {insights.summary.protocols.toLocaleString("sv-SE")} protokoll</h2><p>Utforska paragrafer, exakta diarienummerkedjor, belopp och orter i Hylte kommuns protokollarkiv. Varje träff öppnar rätt protokollssida. Rubrikklassning och textträffar är analysstöd — originalprotokollet är källan.</p></div><FileSearch size={42}/></div>
    <div className="quality-kpis"><article className="panel"><strong>{insights.summary.paragraphs}</strong><span>identifierade paragrafer</span></article><article className="panel"><strong>{insights.summary.paragraphsWithDecisionText}</strong><span>med ett läsbart beslutsavsnitt</span></article><article className="panel"><strong>{insights.summary.exactDocketChains}</strong><span>exakta diarienummerkedjor</span></article><article className="panel"><strong>{insights.summary.paragraphsWithAmounts}</strong><span>paragrafer med beloppsträff</span></article></div>
    <div className="protocol-mode" role="group" aria-label="Välj analysvy"><button className={mode === "paragraphs" ? "active" : ""} onClick={() => setMode("paragraphs")}><Search size={17}/> Paragrafer</button><button className={mode === "chains" ? "active" : ""} onClick={() => setMode("chains")}><GitBranch size={17}/> Diariekedjor</button><button className={mode === "signals" ? "active" : ""} onClick={() => setMode("signals")}><MapPin size={17}/> Orter och belopp</button></div>

    {mode === "paragraphs" && <>
      <div className="panel protocol-filters"><label><span>Sök rubrik, diarienummer, ort eller belopp</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Exempel: Kinnared eller 2026 KS0032"/></label><label><span>Organ</span><select value={body} onChange={(event) => setBody(event.target.value)}>{bodies.map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Rubrikämne</span><select value={topic} onChange={(event) => setTopic(event.target.value)}>{topics.map((value) => <option key={value}>{value}</option>)}</select></label></div>
      <p className="result-count">{rows.length} paragrafer matchar urvalet</p>
      <div className="protocol-paragraphs">{rows.slice(0, 100).map((row: Paragraph) => <article className="panel" key={row.id}><div className="protocol-row-meta"><span>{row.bodyCode.toUpperCase()} §{row.paragraph}</span><time>{row.meetingDate}</time><b>{row.topic}</b></div><h3>{row.title}</h3>{row.docket && <p className="docket">Dnr {row.docket}</p>}{row.decisionExcerpt && <blockquote><strong>Beslutsutdrag:</strong> {row.decisionExcerpt}{row.decisionExcerptTruncated ? "…" : ""}</blockquote>}<div className="protocol-tags">{row.amounts.map((value) => <span key={value}><Coins size={13}/>{value}</span>)}{row.titlePlaces.map((value) => <span key={value}><MapPin size={13}/>{value} i rubriken</span>)}{row.hasYrkande && <span>Yrkande finns</span>}{row.hasReservation && <span>Reservation finns</span>}{row.hasRecordedVote && <span>Omröstning finns</span>}</div><a className="out" href={row.sourceUrl}>Öppna källsidan <ArrowRight size={14}/></a></article>)}</div>
      {rows.length > 100 && <p className="notice">De första 100 träffarna visas. Avgränsa med sökning eller filter för att se resterande.</p>}
    </>}

    {mode === "chains" && <div className="protocol-chains"><div className="panel protocol-method"><Scale size={22}/><div><strong>Exakt identitet, inte titelgissning</strong><p>En kedja skapas bara när samma diarienummer står i minst två protokoll. Händelserna visar behandlingstillfällen; de säger inte automatiskt att ett uppdrag är färdigt eller att ärendet är slutligt avgjort.</p></div></div>{substantiveChains.map((chain) => <article className="panel" key={chain.docket}><header><div><p className="eyebrow">DNR {chain.docket}</p><h3>{chain.eventCount} protokollhändelser · {chain.bodyCount} organ</h3></div><span>{chain.firstObserved} → {chain.lastObserved}</span></header><ol>{chain.events.map((event) => <li key={`${event.documentId}-${event.paragraph}`}><time>{event.meetingDate}</time><span><strong>{event.body} §{event.paragraph}</strong><p>{event.title}</p><a href={event.sourceUrl}>Sida {event.page} <ArrowRight size={13}/></a></span></li>)}</ol></article>)}</div>}

    {mode === "signals" && <div className="columns"><section className="panel"><p className="eyebrow">ORT I PARAGRAFRUBRIKEN</p><h2>Direkta rubrikträffar</h2><div className="signal-list">{placeRows.map((row) => <a href={row.sourceUrl} key={row.id}><MapPin size={18}/><span><strong>{row.titlePlaces.join(", ")} · {row.body} §{row.paragraph}</strong><p>{row.title}</p><small>{row.meetingDate} · sida {row.page}</small></span><ArrowRight size={15}/></a>)}</div><p className="small">En ort i rubriken är ett starkare källspår än en vanlig textträff, men beslutets faktiska geografiska konsekvens måste fortfarande läsas i protokollet.</p></section><section className="panel"><p className="eyebrow">BELOPP I PROTOKOLLTEXT</p><h2>Ekonomiska kontrollpunkter</h2><div className="signal-list amount-signals">{amountRows.slice(0, 30).map((row) => <a href={row.sourceUrl} key={row.id}><Coins size={18}/><span><strong>{row.amounts.join(" · ")}</strong><p>{row.body} §{row.paragraph} · {row.title}</p><small>{row.meetingDate} · sida {row.page}</small></span><ArrowRight size={15}/></a>)}</div><p className="small">Beloppsträffen kan vara budget, förslag, redovisning eller beslut. Klassningen gör ingen ekonomisk slutsats utan visar var kontrollen ska börja.</p></section></div>}
    <p className="protocol-methodline"><strong>Metod:</strong> {insights.method} Analysen skapades från källversioner med bevarade SHA-256-hashar.</p>
  </section>;
}
