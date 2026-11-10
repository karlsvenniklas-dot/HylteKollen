"use client";

import { useMemo, useState } from "react";
import bank from "@/data/question-bank.json";
import { ArrowRight, CheckCircle2, Clipboard, FileQuestion, FileText, HelpCircle, ShieldAlert } from "lucide-react";

type Filter = "all" | "open";
const labels: Record<string, { text: string; detail: string }> = {
  answered: { text: "Svar finns i underlaget", detail: "Källan ger ett direkt svar, men uppgiften kan fortfarande vara ett förslag." },
  partial: { text: "Delvis besvarad", detail: "Relevant underlag finns, men en del av frågan saknar verifierat svar." },
  protocol: { text: "Kräver justerat protokoll", detail: "Frågan får inget slutligt svar förrän paragraf och sida kan kontrolleras." },
};

export default function QuestionBank() {
  const [selectedId, setSelectedId] = useState(bank.records[0].id);
  const [filter, setFilter] = useState<Filter>("all");
  const [copied, setCopied] = useState(false);
  const selected = bank.records.find((record) => record.id === selectedId) || bank.records[0];
  const questions = useMemo(() => selected.questions.filter((question) => filter === "all" || question.status !== "answered"), [selected, filter]);
  const total = bank.records.reduce((sum, record) => sum + record.questions.length, 0);
  const open = bank.records.reduce((sum, record) => sum + record.questions.filter((question) => question.status !== "answered").length, 0);

  async function copyQuestions() {
    const text = `${selected.title}\n\n${questions.map((question, index) => `${index + 1}. ${question.question}`).join("\n")}`;
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); }
  }

  return <div className="question-bank">
    <section className="panel question-head">
      <div><p className="eyebrow">FRÅGEBANKEN · NEUTRALA KONTROLLFRÅGOR</p><h2>Vad behöver klarläggas?</h2><p>Frågorna kommer ur luckor, villkor och källskillnader i kommunens handlingar. De tar inte ställning för eller emot förslaget.</p></div>
      <div className="question-counts"><strong>{total}</strong><span>frågor i fem ärenden</span><strong>{open}</strong><span>delvis öppna eller protokollberoende</span></div>
    </section>

    <div className="question-workspace">
      <aside className="panel question-issues">
        <div className="sectionhead"><h2>Välj ärende</h2><span>{bank.records.length}</span></div>
        {bank.records.map((record) => <button type="button" key={record.id} className={record.id === selected.id ? "active" : ""} onClick={() => setSelectedId(record.id)}><FileQuestion size={18}/><span><strong>{record.title}</strong><small>{record.topic} · {record.questions.length} frågor</small></span><ArrowRight size={15}/></button>)}
      </aside>

      <section className="question-main">
        <div className="panel question-toolbar">
          <div><p className="eyebrow">{selected.topic}</p><h2>{selected.title}</h2></div>
          <div className="question-controls"><div><button type="button" className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Alla</button><button type="button" className={filter === "open" ? "active" : ""} onClick={() => setFilter("open")}>Behöver mer svar</button></div><button type="button" className="copy-questions" onClick={copyQuestions}><Clipboard size={15}/>{copied ? "Kopierat" : "Kopiera frågor"}</button></div>
        </div>

        <div className="question-list">
          {questions.map((question, index) => <article className={`panel question-card ${question.status}`} key={question.id}>
            <div className="question-number">{index + 1}</div>
            <div className="question-body"><div className="question-status">{question.status === "answered" ? <CheckCircle2 size={15}/> : question.status === "protocol" ? <ShieldAlert size={15}/> : <HelpCircle size={15}/>}<span>{labels[question.status].text}</span></div><h3>{question.question}</h3><p>{question.why}</p><div className="question-finding"><strong>Nuvarande källäge</strong><span>{question.finding}</span></div><div className="question-actions">{question.documentId ? <a className="out" href={`/dokument/${question.documentId}`}>Öppna belägget <FileText size={14}/></a> : <a className="out" href="/beslutskontroll">Följ protokollstatus <ArrowRight size={14}/></a>}<a className="out" href={`/arenden/${selected.itemId}`}>Hela ärendet <ArrowRight size={14}/></a></div></div>
          </article>)}
        </div>
      </section>
    </div>

    <section className="panel question-legend"><div><CheckCircle2 size={18}/><span><strong>Svar finns:</strong> en källa ger ett direkt, avgränsat svar.</span></div><div><HelpCircle size={18}/><span><strong>Delvis:</strong> underlaget räcker inte till hela frågan.</span></div><div><ShieldAlert size={18}/><span><strong>Protokoll:</strong> slutlig beslutstext inväntas.</span></div></section>
  </div>;
}
