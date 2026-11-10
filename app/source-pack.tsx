"use client";
import { formatSwedishDate } from "@/lib/date-format";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clipboard, Download, FileCheck2, FileText, GitBranch, HelpCircle, Printer, ShieldAlert } from "lucide-react";
import catalogData from "@/data/public-catalog.json";
import questionData from "@/data/question-bank.json";
import journeyData from "@/data/motion-journeys.json";
import type { Catalog } from "@/lib/types";

const catalog = catalogData as unknown as Catalog;
const meeting = catalog.meetings[0];
const availableItems = meeting.items.filter((item) => item.documentIds.length > 0);

const prettyDate = (value: string) => formatSwedishDate(value, { day: "numeric", month: "long", year: "numeric" });
const statusLabel: Record<string, string> = {
  answered: "Svar finns i underlaget",
  partial: "Delvis besvarad",
  protocol: "Kräver justerat protokoll",
};

export default function SourcePack() {
  const [selectedId, setSelectedId] = useState(availableItems.find((item) => item.number === 6)?.id || availableItems[0].id);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("arende");
    if (requested && availableItems.some((item) => item.id === requested)) setSelectedId(requested);
  }, []);

  const item = availableItems.find((candidate) => candidate.id === selectedId) || availableItems[0];
  const documents = useMemo(() => item.documentIds.map((id) => catalog.documents.find((doc) => doc.id === id)).filter((doc): doc is NonNullable<typeof doc> => Boolean(doc)), [item]);
  const questions = questionData.records.find((record) => record.itemId === item.id);
  const journey = journeyData.records.find((record) => record.itemId === item.id);

  function choose(nextId: string) {
    setSelectedId(nextId);
    window.history.replaceState(null, "", `/kallpaket?arende=${nextId}`);
  }

  async function copyLink() {
    const url = `${window.location.origin}/kallpaket?arende=${item.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return <div className="source-pack">
    <section className="panel pack-intro">
      <div><p className="eyebrow">KÄLLPAKETET · DELBART GRANSKNINGSUNDERLAG</p><h2>Ett ärende. Alla belägg.</h2><p>Samla ärendefakta, kontrollfrågor, motionskedja och originalhandlingar i ett utskriftsvänligt paket. Inga nya slutsatser skapas här.</p></div>
      <FileCheck2 size={46}/>
    </section>

    <section className="panel pack-toolbar" aria-label="Välj och exportera källpaket">
      <label><span>Välj ärende</span><select value={item.id} onChange={(event) => choose(event.target.value)}>{availableItems.map((candidate) => <option value={candidate.id} key={candidate.id}>Punkt {candidate.number} · {candidate.title}</option>)}</select></label>
      <div><button type="button" onClick={() => window.print()}><Printer size={16}/> Skriv ut / spara PDF</button><button type="button" onClick={copyLink}><Clipboard size={16}/> {copied ? "Länk kopierad" : "Kopiera länk"}</button></div>
    </section>

    <article className="pack-sheet">
      <header className="pack-cover">
        <div><p className="eyebrow">KÄLLPAKET · KF {prettyDate(meeting.date)}</p><span className="pack-number">Punkt {item.number}</span><h2>{item.title}</h2><p>{item.topic} · {item.location}</p></div>
        <div className={meeting.protocolPublished ? "pack-state verified" : "pack-state pending"}><ShieldAlert size={20}/><strong>{meeting.protocolPublished ? "Protokoll publicerat" : "Justerat KF-protokoll inväntas"}</strong><span>{meeting.protocolPublished ? "Kontrollera paragraf och sida före beslutspåstående." : "Underlag och beredning får inte beskrivas som slutligt beslut."}</span></div>
      </header>

      <section className="pack-facts">
        <div><strong>{documents.length}</strong><span>handlingar</span></div>
        <div><strong>{questions?.questions.length || 0}</strong><span>kontrollfrågor</span></div>
        <div><strong>{journey?.stages.length || 0}</strong><span>dokumenterade steg</span></div>
        <div><strong>{prettyDate(meeting.checkedAt)}</strong><span>senast kontrollerat</span></div>
      </section>

      <section className="pack-section">
        <div className="sectionhead"><h2>Källäge</h2><span>MeetingPlus-hash {meeting.sourceHash.slice(0, 12)}…</span></div>
        <p>Detta paket bygger på Hyltekollens versionerade import av Hylte kommuns publicerade handlingar. Dokumentens identiteter och SHA-256-hashar visas nedan. Original-PDF:erna är auktoritativa.</p>
      </section>

      <section className="pack-section">
        <div className="sectionhead"><h2>Kontrollfrågor</h2><span>{questions ? `${questions.questions.length} granskade frågor` : "Ingen särskild frågebank"}</span></div>
        {questions ? <div className="pack-questions">{questions.questions.map((question, index) => <article key={question.id}>
          <b>{index + 1}</b><div><span className={`pack-question-state ${question.status}`}>{question.status === "answered" ? <CheckCircle2 size={14}/> : question.status === "partial" ? <HelpCircle size={14}/> : <ShieldAlert size={14}/>} {statusLabel[question.status]}</span><h3>{question.question}</h3><p>{question.finding}</p>{question.documentId ? <a href={`/dokument/${question.documentId}`}>Läs belägget <FileText size={14}/></a> : <a href="/beslutskontroll">Följ protokollstatus <ShieldAlert size={14}/></a>}</div>
        </article>)}</div> : <p className="pack-empty">Ärendet har dokument, men saknar ännu en separat redaktionellt granskad frågebank.</p>}
      </section>

      <section className="pack-section">
        <div className="sectionhead"><h2>Motionskedja</h2><span>{journey ? journey.docket : "Inte registrerad som motionskedja"}</span></div>
        {journey ? <div className="pack-journey"><p><GitBranch size={16}/><strong>{journey.shortTitle}</strong> · {journey.authors} ({journey.party})</p>{journey.stages.map((stage) => <article key={`${stage.date}-${stage.label}`}><time>{prettyDate(stage.date)}</time><div><strong>{stage.label}</strong><p>{stage.body}</p>{stage.documentId && <a href={`/dokument/${stage.documentId}`}>Öppna källan</a>}</div></article>)}</div> : <p className="pack-empty">Ingen separat motionskedja är kopplad till ärendet. Dokumentregistret nedan visar hela det importerade underlaget.</p>}
      </section>

      <section className="pack-section">
        <div className="sectionhead"><h2>Dokumentregister</h2><span>{documents.length} stabila dokument-ID:n</span></div>
        <div className="pack-documents">{documents.map((doc, index) => <article key={doc.id}>
          <span className="pack-doc-number">{index + 1}</span><div><h3>{doc.title}</h3><p>{doc.pageCount} {doc.pageCount === 1 ? "sida" : "sidor"} · Hämtstatus: {doc.fetchStatus}</p><code>SHA-256 {doc.sha256 || "saknas"}</code></div><div className="pack-doc-actions"><a href={`/dokument/${doc.id}`}><FileText size={14}/> Läs</a><a href={`/api/original/${doc.id}`}><Download size={14}/> Ladda ner</a></div>
        </article>)}</div>
      </section>

      <footer className="pack-note"><ShieldAlert size={18}/><p><strong>Metodnot.</strong> Källpaketet sammanställer befintliga granskade uppgifter. Det skapar inga nya beslut, verifierar inget utfall och skickas inte automatiskt till någon.</p></footer>
    </article>
  </div>;
}
