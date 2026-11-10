"use client";

import catalog from "@/data/public-catalog.json";
import followups from "@/data/followups.json";
import { Activity, ArrowRight, FileText, Gauge, History, MapPin } from "lucide-react";

const items = catalog.meetings.flatMap((meeting) => meeting.items);

function activity(item: (typeof items)[number]) {
  const documents = catalog.documents.filter((document) => item.documentIds.includes(document.id));
  const protocols = documents.filter((document) => /^§\d+/.test(document.title)).length;
  const formalInitiative = /motion|interpellation/i.test(item.title);
  const returning = /återremiss|svar på/i.test(item.title) || protocols >= 4;
  const local = item.location !== "Hela kommunen";
  const score = Math.min(100, documents.length * 3 + protocols * 4 + (formalInitiative ? 10 : 0) + (returning ? 10 : 0) + (local ? 8 : 0));
  const signals = [
    protocols >= 4 ? `${protocols} tidigare beslutsdokument` : null,
    formalInitiative ? "Formellt politiskt initiativ" : null,
    returning ? "Frågan har återkommit" : null,
    local ? `Berör ${item.location}` : null,
  ].filter(Boolean) as string[];
  return { item, documents, score, signals };
}

const ranked = items
  .filter((item) => item.topic !== "Mötesformalia")
  .map(activity)
  .sort((a, b) => b.score - a.score || b.documents.length - a.documents.length)
  .slice(0, 7);

function level(score: number) {
  if (score >= 70) return "Mycket hög dokumentaktivitet";
  if (score >= 45) return "Hög dokumentaktivitet";
  if (score >= 25) return "Förhöjd dokumentaktivitet";
  return "Nytt eller begränsat underlag";
}

export default function HyltePulse() {
  const activeFollowups = followups.records.filter((record) => record.status === "follow_up").length;
  return (
    <div className="stack gap24">
      <section className="panel pulse-hero">
        <div>
          <p className="eyebrow">HYLTEPULSEN · KÄLLBASERAD AKTIVITET</p>
          <h2>Vilka frågor rör på sig?</h2>
          <p>Hyltepulsen sorterar det aktuella kommununderlaget efter mängden handlingar, tidigare behandlingar och formella initiativ. Den mäter inte opinion eller vem som har rätt.</p>
        </div>
        <Activity size={38} aria-hidden="true" />
      </section>

      <section className="grid3 analysis-kpis" aria-label="Aktuellt underlag">
        <article className="panel"><Gauge size={23}/><strong>{ranked.length}</strong><span>sakfrågor med högst aktivitet just nu</span></article>
        <article className="panel"><FileText size={23}/><strong>{catalog.documents.length}</strong><span>importerade Hylte-handlingar i beräkningen</span></article>
        <article className="panel"><History size={23}/><strong>{activeFollowups}</strong><span>beslut som fortfarande följs upp</span></article>
      </section>

      <section className="panel">
        <div className="sectionhead"><h2>Aktivast i det importerade underlaget</h2><span>{catalog.meetings[0]?.title} · {catalog.meetings[0]?.date}</span></div>
        <div className="pulse-list">
          {ranked.map(({ item, documents, score, signals }, index) => (
            <article key={item.id} className="pulse-row">
              <div className="pulse-rank">{index + 1}</div>
              <div className="pulse-main">
                <div className="smallmeta">{item.topic} · {item.location}</div>
                <h3>{item.title}</h3>
                <div className="pulse-signals">
                  {signals.length ? signals.map((signal) => <span key={signal}>{signal}</span>) : <span>Begränsat källunderlag</span>}
                </div>
                <a className="out" href={`/arenden/${item.id}`}>Öppna ärendet och källorna <ArrowRight size={14}/></a>
              </div>
              <div className="pulse-meter" aria-label={`${score} av 100 aktivitetspoäng`}>
                <strong>{score}</strong><span>/100</span>
                <div><i style={{ width: `${score}%` }}/></div>
                <small>{level(score)}</small>
                <em>{documents.length} handlingar</em>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="columns">
        <article className="panel prose">
          <div className="sectionhead"><h2>Så räknas pulsen</h2><Gauge size={22}/></div>
          <p>Poängen byggs av antal publicerade handlingar, beslutsutdrag från tidigare behandlingar, om frågan är en motion eller interpellation, om den återkommer och om den har en särskild geografisk koppling.</p>
          <p className="small">Poängen är ett sorteringsverktyg för källmaterialet — inte en bedömning av politisk betydelse, konflikt eller invånarnas åsikter.</p>
        </article>
        <aside className="panel pulse-place">
          <MapPin size={23}/><p className="eyebrow">LOKAL PULS</p><h3>Se vad som berör din ort</h3><p>Ortsvyn samlar källträffar och ärenden för bland annat Kinnared, Torup, Unnaryd och Rydöbruk.</p><a className="out" href="/orter">Öppna orterna <ArrowRight size={14}/></a>
        </aside>
      </section>
    </div>
  );
}
