"use client";

import { ArrowRight, Building2, CalendarClock, CheckCircle2, CircleAlert, FileSignature, Landmark, ShieldCheck } from "lucide-react";

const agreements = [
  {
    title: "Gåvoavtal för idrottshallen",
    kind: "Överlåtelse",
    source: "87ffe24777d9a068382f1828",
    period: "Tillträde föreslås 1 januari 2027",
    summary: "Gymnastiksal, tidigare förskola och omklädningsrum överlåts som lös egendom. Marken ingår inte.",
    duties: ["Kommunen ska utföra fem angivna åtgärder senast 1 juni 2027.", "Föreningen övertar drift, skötsel och underhåll.", "Byggnaden kan återgå om ändamål eller underhållsvillkor inte följs."],
  },
  {
    title: "Anläggningsarrende för hallens mark",
    kind: "Markavtal",
    source: "43786af46df213b1b8f8a6ae",
    period: "1 januari 2027–31 december 2051",
    summary: "Cirka 2 100 kvadratmeter mark upplåts utan arrendeavgift för idrotts- och föreningsverksamhet.",
    duties: ["Föreningen ansvarar för drift, underhåll, avgifter och försäkringar.", "Vidareupplåtelse kräver kommunens skriftliga medgivande.", "Området kan behöva justeras när ny detaljplan fått laga kraft."],
  },
  {
    title: "Arrende för övrig mark",
    kind: "Markavtal",
    source: "7f1294fcfdea73dd03ff2e4c",
    period: "Ett år i taget från 1 januari 2027",
    summary: "Cirka 13 000 kvadratmeter övrig mark och befintlig egendom upplåts utan arrendeavgift.",
    duties: ["Fotbollsplanen ska hållas öppen för allmänheten.", "Föreningen ansvarar för skötsel, kostnader och försäkringar.", "Uppsägning ska ske senast tre månader före avtalstidens utgång."],
  },
  {
    title: "Drift- och förvaltningsavtal",
    kind: "Ersättning och ansvar",
    source: "1d19e49cf87059755a31e34c",
    period: "1 januari 2027–31 december 2029, därefter möjlig årsvis förlängning",
    summary: "Föreningen får ett samlat förvaltningsansvar för byggnad, mark, bergvärme och fotbollsplan.",
    duties: ["Årlig ersättning: 220 000 kronor.", "Extra underhållsstöd: 300 000 kronor 2027 och 100 000 kronor per år 2028–2029.", "Kommunen kan begära redovisning och hålla inne kommande betalningar vid brister."],
  },
];

const milestones = [
  { date: "7 oktober 2025", label: "Juridisk utredning beställd", done: true, source: "af789de0e79c34eeb5be1be1" },
  { date: "2 juni 2026", label: "Ärendet återremitterades", done: true, source: "886542ee665e2bfe8118b6dd" },
  { date: "25 augusti 2026", label: "Kommunstyrelsens slutliga förslag", done: true, source: "95a81ab2d5597e3452f83aaf" },
  { date: "8 september 2026", label: "Fullmäktigebehandling – protokoll saknas i aktuell import", done: false, source: null },
  { date: "1 januari 2027", label: "Föreslaget tillträde och avtalsstart", done: false, source: null },
  { date: "1 juni 2027", label: "Föreslagen deadline för kommunens byggnadsåtgärder", done: false, source: "87ffe24777d9a068382f1828" },
];

export default function ContractWatch() {
  return (
    <div className="stack gap24">
      <section className="panel contract-hero">
        <div><p className="eyebrow">AVTALSVAKTEN · BESLUTET EFTER BESLUTET</p><h2>Vem ska göra vad — och när?</h2><p>Avtalsvakten plockar ut tider, pengar, villkor och ansvar ur Hylte kommuns publicerade avtalsförslag. Pilotspåret gäller fastigheten Rydö 2:61.</p></div>
        <FileSignature size={40} aria-hidden="true"/>
      </section>

      <section className="contract-status panel">
        <div className="status-icon"><CircleAlert size={25}/></div>
        <div><p className="eyebrow">NUVARANDE KÄLLSTATUS</p><h2>Avtalsförslag publicerade — slutligt fullmäktigebeslut inte verifierat</h2><p>Kommunstyrelsens förslag från 25 augusti är verifierat. Hyltekollens import saknar fortfarande ett justerat protokoll från fullmäktiges behandling den 8 september. Därför visas villkoren som förslag.</p><a className="out" href="/beslutskontroll">Öppna beslutskontrollen <ArrowRight size={14}/></a></div>
      </section>

      <section className="grid3 analysis-kpis">
        <article className="panel"><FileSignature size={23}/><strong>4</strong><span>sammanlänkade avtalsförslag</span></article>
        <article className="panel"><Landmark size={23}/><strong>220 000 kr</strong><span>föreslagen årlig ersättning</span></article>
        <article className="panel"><CalendarClock size={23}/><strong>1 juni 2027</strong><span>föreslagen åtgärdsdeadline</span></article>
      </section>

      <section className="panel">
        <div className="sectionhead"><h2>Avtalspaketet</h2><span>Hylte kommun ↔ Rydöbruks IF</span></div>
        <div className="agreement-grid">
          {agreements.map((agreement) => (
            <article className="agreement-card" key={agreement.source}>
              <div className="agreement-top"><span>{agreement.kind}</span><ShieldCheck size={19}/></div>
              <h3>{agreement.title}</h3><p>{agreement.summary}</p>
              <div className="agreement-period"><CalendarClock size={16}/>{agreement.period}</div>
              <ul>{agreement.duties.map((duty) => <li key={duty}>{duty}</li>)}</ul>
              <a className="out" href={`/dokument/${agreement.source}`}>Läs hela avtalsförslaget <ArrowRight size={14}/></a>
            </article>
          ))}
        </div>
      </section>

      <section className="columns">
        <article className="panel">
          <div className="sectionhead"><h2>Tidslinje och kontrollpunkter</h2><CalendarClock size={22}/></div>
          <div className="contract-timeline">
            {milestones.map((milestone) => <div key={milestone.date + milestone.label} className={milestone.done ? "done" : "pending"}><span>{milestone.done ? <CheckCircle2 size={17}/> : <CalendarClock size={17}/>}</span><time>{milestone.date}</time><strong>{milestone.label}</strong>{milestone.source && <a href={`/dokument/${milestone.source}`}>Källa</a>}</div>)}
          </div>
        </article>
        <aside className="panel contract-watchlist">
          <Building2 size={24}/><p className="eyebrow">DETTA SKA FÖLJAS</p><h3>Automatiska kontrollpunkter</h3>
          <ul><li>Justerat fullmäktigeprotokoll publiceras</li><li>Avtalen undertecknas</li><li>Arrendevillkoren börjar gälla</li><li>Kommunens fem byggnadsåtgärder slutrapporteras</li><li>Användningen av drift- och underhållsersättningen redovisas</li></ul>
          <p className="small">En kontrollpunkt markeras inte som genomförd förrän en publicerad Hylte-källa visar det.</p>
        </aside>
      </section>
    </div>
  );
}
