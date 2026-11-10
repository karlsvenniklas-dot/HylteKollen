"use client";
import catalog from "@/data/public-catalog.json";
import followups from "@/data/followups.json";
import { BarChart3, CheckCircle2, Clock3, FileText, MapPin, Radar, TimerReset } from "lucide-react";

const records = followups.records;
const count = (status: string) => records.filter((record) => record.status === status).length;
const active = records.filter((record) => record.status === "follow_up");
const oldest = [...active].sort((a, b) => a.assignedOn.localeCompare(b.assignedOn))[0];
const byResponsible = Object.entries(records.flatMap((record) => record.responsible).reduce<Record<string, number>>((totals, body) => ({ ...totals, [body]: (totals[body] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);
const byLocation = Object.entries(records.reduce<Record<string, number>>((totals, record) => ({ ...totals, [record.location]: (totals[record.location] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);
const protocolDocs = catalog.documents.filter((document) => /^§\d+/.test(document.title));
const days = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86400000);
const closed = records.filter((record) => record.status === "closed")[0];

export default function AdvancedStatistics() {
  return <div className="stack gap24">
    <section className="panel stat-hero"><div><p className="eyebrow">AVANCERAD ANALYS · HYLTE KOMMUN</p><h2>Kommunens beslutsmotor</h2><p>Följ hur uppdrag rör sig från beslut till återrapportering. Alla siffror bygger på den aktuella importerade Hylte-datan och är märkta efter vad källorna faktiskt visar.</p></div><Radar size={34}/></section>
    <section className="grid3 analysis-kpis">
      <article className="panel"><Clock3 size={23}/><strong>{count("follow_up")}</strong><span>uppdrag med fortsatt uppföljning</span></article>
      <article className="panel"><FileText size={23}/><strong>{count("reported")}</strong><span>återrapporterade i källan</span></article>
      <article className="panel"><CheckCircle2 size={23}/><strong>{count("closed")}</strong><span>avslutat uppdrag i kontrollerat protokoll</span></article>
    </section>
    <section className="columns"><div className="panel"><div className="sectionhead"><h2>Uppdragens flöde</h2><TimerReset size={22}/></div><div className="flow"><div><b>{records.length}</b><span>uppdrag i registret</span></div><i/><div><b>{count("follow_up")}</b><span>fortsatt uppföljning</span></div><i/><div><b>{count("reported")}</b><span>återrapporterade</span></div><i/><div><b>{count("closed")}</b><span>avslutade</span></div></div><p className="small">”Återrapporterad” betyder att uppgiften har redovisats, inte automatiskt att resultatet är genomfört.</p></div><aside className="panel"><p className="eyebrow">ÄLDSTA AKTIVA SPÅR</p><h3>{oldest?.title}</h3><p>Uppdrag från {oldest?.assignedOn}. Senaste källstatus: {oldest?.evidenceAsOf}.</p>{oldest && <a className="out" href={'/uppfoljning/' + oldest.id}>Öppna uppdraget</a>}</aside></section>
    <section className="columns"><div className="panel"><div className="sectionhead"><h2>Ansvariga organ</h2><BarChart3 size={22}/></div><div className="analysis-bars">{byResponsible.map(([body, value])=><div key={body}><span>{body}</span><div><i style={{width: `${(value / records.length) * 100}%`}}/></div><strong>{value}</strong></div>)}</div><p className="small">Antal registrerade uppdrag per ansvarig instans; ett uppdrag kan ha flera ansvariga.</p></div><aside className="panel"><div className="sectionhead"><h2>Geografisk täckning</h2><MapPin size={22}/></div><div className="analysis-bars">{byLocation.map(([place, value])=><div key={place}><span>{place}</span><div><i style={{width: `${(value / records.length) * 100}%`}}/></div><strong>{value}</strong></div>)}</div><p className="small">Klassning enligt källregistrets angivna plats.</p></aside></section>
    <section className="grid3 analysis-kpis"><article className="panel"><FileText size={23}/><strong>{catalog.documents.length}</strong><span>importerade handlingar</span></article><article className="panel"><CheckCircle2 size={23}/><strong>{protocolDocs.length}</strong><span>protokoll och beslutsutdrag</span></article><article className="panel"><TimerReset size={23}/><strong>{closed ? days(closed.assignedOn, closed.history.at(-1)?.date || closed.evidenceAsOf) + " dagar" : "—"}</strong><span>observerad tid till avslut för ett kontrollerat uppdrag</span></article></section>
    <section className="notice"><Clock3 size={18}/><div><strong>Ingen falsk försening</strong><br/>Källorna innehåller inga verifierade slutdatum för de öppna uppdragen. Därför visas uppdragens ålder, men de märks inte som försenade.</div></section>
  </div>;
}
