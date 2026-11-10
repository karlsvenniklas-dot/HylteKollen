"use client";
import { formatSwedishDate } from "@/lib/date-format";

import { useEffect, useMemo, useState } from "react";
import catalogData from "@/data/public-catalog.json";
import networkData from "@/data/document-network.json";
import followupData from "@/data/followups.json";
import journeyData from "@/data/motion-journeys.json";
import questionData from "@/data/question-bank.json";
import politicianData from "@/data/politician-observations.json";
import type { Catalog } from "@/lib/types";
import { ArrowRight, Database, Download, FileText, GitBranch, Hash, Search, Users } from "lucide-react";

const catalog = catalogData as unknown as Catalog;
const meeting = catalog.meetings[0];

export default function DataWorkbench() {
  const items = meeting.items.filter((item) => item.documentIds.length > 0);
  const [selectedId, setSelectedId] = useState(items[0].id);
  const [docketQuery, setDocketQuery] = useState("");
  const [selectedDocketId, setSelectedDocketId] = useState(networkData.dockets[0]?.id || "");
  const item = items.find((candidate) => candidate.id === selectedId) || items[0];
  const documents = item.documentIds.map((id) => catalog.documents.find((doc) => doc.id === id)).filter((doc): doc is NonNullable<typeof doc> => Boolean(doc));
  const docIds = new Set(documents.map((doc) => doc.id));
  const followups = followupData.records.filter((record) => record.relatedItem === item.id);
  const journey = journeyData.records.find((record) => record.itemId === item.id);
  const questions = questionData.records.find((record) => record.itemId === item.id);
  const people = politicianData.politicians.filter((person) => [...person.attendance, ...person.initiatives].some((row) => docIds.has(row.documentId)));

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("diarium");
    if (!requested) return;
    const normalized = requested.trim().toLocaleLowerCase("sv-SE");
    const match = networkData.dockets.find((row) => row.id.toLocaleLowerCase("sv-SE") === normalized || row.label.toLocaleLowerCase("sv-SE") === normalized);
    if (match) setSelectedDocketId(match.id);
  }, []);

  const dockets = useMemo(() => networkData.dockets.filter((row) => {
    if (!docketQuery.trim()) return true;
    const itemTitles = row.itemLinks.map((link) => meeting.items.find((candidate) => candidate.id === link.itemId)?.title || "");
    const documentTitles = row.documentMentions.map((link) => catalog.documents.find((candidate) => candidate.id === link.documentId)?.title || "");
    return [row.label, ...itemTitles, ...documentTitles].join(" ").toLocaleLowerCase("sv-SE").includes(docketQuery.trim().toLocaleLowerCase("sv-SE"));
  }), [docketQuery]);
  const selectedDocket = networkData.dockets.find((row) => row.id === selectedDocketId) || dockets[0] || networkData.dockets[0];

  function chooseDocket(id: string, label: string) {
    setSelectedDocketId(id);
    window.history.replaceState(null, "", `/data?diarium=${encodeURIComponent(label)}#dokumentnat`);
  }

  return <section className="data-workbench" id="dokumentnat">
    <div className="panel workbench-head"><div><p className="eyebrow">DOKUMENTNÄTET · RELATIONER UTAN GISSNINGAR</p><h2>Från möte till källa</h2><p>Välj ett ärende och följ de exakta ID-kopplingarna till dokument, uppföljning, motionskedja, kontrollfrågor och observerade personer.</p></div><GitBranch size={38}/></div>
    <div className="panel workbench-select"><label><span>Välj ärende</span><select value={item.id} onChange={(event) => setSelectedId(event.target.value)}>{items.map((candidate) => <option value={candidate.id} key={candidate.id}>Punkt {candidate.number} · {candidate.title}</option>)}</select></label></div>
    <div className="document-network" aria-label="Dokumentrelationer">
      <div className="network-node meeting-node"><span>Möte</span><strong>{meeting.title}</strong><small>{formatSwedishDate(meeting.date)}</small></div>
      <ArrowRight className="network-arrow" size={22}/>
      <a className="network-node issue-node" href={`/arenden/${item.id}`}><span>Ärende {item.number}</span><strong>{item.title}</strong><small>{item.topic} · {item.location}</small></a>
      <ArrowRight className="network-arrow" size={22}/>
      <div className="network-branches">
        <article><FileText size={18}/><strong>{documents.length} handlingar</strong><div>{documents.slice(0, 8).map((doc) => <a href={`/dokument/${doc.id}`} key={doc.id}>{doc.title}<ArrowRight size={12}/></a>)}{documents.length > 8 && <a href={`/arenden/${item.id}`}>+ {documents.length - 8} fler handlingar</a>}</div></article>
        <article><Hash size={18}/><strong>Kopplade register</strong><div>{followups.map((record) => <a href={`/uppfoljning/${record.id}`} key={record.id}>{record.docket} · uppföljning</a>)}{journey && <a href={`/motioner?motion=${journey.id}`}>{journey.docket} · motionskedja</a>}{questions && <a href="/fragor">{questions.questions.length} kontrollfrågor</a>}{!followups.length && !journey && !questions && <span>Inga ytterligare granskade registerkopplingar</span>}</div></article>
        <article><Users size={18}/><strong>Observerade personer</strong><div>{people.slice(0, 10).map((person) => <a href={`/politiker/${person.id}`} key={person.id}>{person.name}</a>)}{people.length > 10 && <span>+ {people.length - 10} fler i protokollens tjänstgöringslistor</span>}{!people.length && <span>Ingen personkoppling i de importerade observationerna</span>}</div></article>
      </div>
    </div>

    <div className="workbench-grid">
      <section className="panel docket-nav"><div className="sectionhead"><div><p className="eyebrow">DIARIENUMMERNAVIGATOR</p><h2>Exakta ärendeidentiteter</h2></div><Hash size={24}/></div><label><Search size={16}/><input value={docketQuery} onChange={(event) => setDocketQuery(event.target.value)} placeholder="Sök exempelvis 2023 KS0190"/></label><div className="docket-results">{dockets.map((row) => <button type="button" className={row.id === selectedDocket?.id ? "selected" : ""} onClick={() => chooseDocket(row.id, row.label)} key={row.id}><strong>{row.label}</strong><span>{row.documentMentions.length} exakta dokumentträffar</span><ArrowRight size={14}/></button>)}{!dockets.length && <p>Ingen exakt träff i det granskade registret.</p>}</div>{selectedDocket && <article className="docket-detail"><p className="eyebrow">VALT DIARIENUMMER</p><h3>{selectedDocket.label}</h3>{selectedDocket.documentMentions.length > 0 ? <div>{selectedDocket.documentMentions.map((mention) => { const doc = catalog.documents.find((candidate) => candidate.id === mention.documentId); return doc ? <a href={`/dokument/${doc.id}#sida-${mention.pages[0]}`} key={mention.documentId}><strong>{doc.title}</strong><span>Diarienumret förekommer på {mention.pages.length === 1 ? `sida ${mention.pages[0]}` : `sidorna ${mention.pages.join(", ")}`}</span></a> : null; })}</div> : <p>Finns i ett granskat register men saknar exakt träff i den nu importerade PDF-korpusen.</p>}<div className="docket-related">{selectedDocket.itemLinks.map((link) => { const linkedItem = meeting.items.find((candidate) => candidate.id === link.itemId); return linkedItem ? <a href={`/arenden/${linkedItem.id}`} key={link.itemId}>Ärende {linkedItem.number}: {linkedItem.title}</a> : null; })}{selectedDocket.motionLinks.map((link) => <a href={`/motioner?motion=${link.motionId}`} key={link.motionId}>Öppna motionskedjan</a>)}{selectedDocket.followupLinks.map((link) => <a href={`/uppfoljning/${link.followupId}`} key={link.followupId}>Öppna uppföljningen</a>)}</div></article>}<p>Exakta PDF-träffar och redaktionellt granskade registerkopplingar visas separat. Liknande rubriker slås aldrig ihop automatiskt.</p></section>
      <aside className="panel export-panel"><Database size={25}/><p className="eyebrow">ÖPPNA DATA</p><h2>Hämta källregistren</h2><p>CSV-filerna innehåller stabila ID:n, källdatum och länkar. JSON bevarar de fullständiga posterna.</p>{[["Dokument", "documents"], ["Uppföljningar", "followups"], ["Politikerobservationer", "politicians"], ["Granskade motioner", "motions"]].map(([label, kind]) => <div className="export-row" key={kind}><strong>{label}</strong><a href={`/api/export/${kind}?format=csv`}><Download size={14}/> CSV</a><a href={`/api/export/${kind}?format=json`}><Download size={14}/> JSON</a></div>)}</aside>
    </div>
  </section>;
}
