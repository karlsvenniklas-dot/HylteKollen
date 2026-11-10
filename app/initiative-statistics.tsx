"use client";
import initial from "@/data/public-catalog.json";
import IssueVotes from "@/app/issue-votes";
import { BarChart3, CheckCircle2, FileText, Info, Scale, Vote } from "lucide-react";

const politicalItems = initial.meetings.flatMap((meeting) => meeting.items).filter((item) => /motion|interpellation/i.test(item.title));
const motions = politicalItems.filter((item) => /motion/i.test(item.title));
const interpellations = politicalItems.filter((item) => /interpellation/i.test(item.title));

export default function InitiativeStatistics() {
  return <div className="stack gap24">
    <IssueVotes />
    <section className="panel stat-hero">
      <div><p className="eyebrow">BESLUTSSTATISTIK · KÄLLSTYRD</p><h2>Vilka initiativ får stöd?</h2><p>Här räknas formella motioner, yrkanden och omröstningar — inte politiska åsikter eller debattinlägg. Ett parti får statistik först när avsändare och utfall framgår av en primärkälla.</p></div>
      <BarChart3 size={34}/>
    </section>
    <section className="statsstrip" aria-label="Tillgängligt underlag">
      <div><strong>{motions.length}</strong><span>motionsärenden i pilotmötet</span></div>
      <div><strong>{interpellations.length}</strong><span>interpellationsärenden i pilotmötet</span></div>
      <div><strong>{initial.documents.length}</strong><span>importerade Hylte-handlingar</span></div>
    </section>
    <section className="grid3 stat-cards">
      <article className="panel"><CheckCircle2 size={23}/><p className="eyebrow">BIFALL OCH GENOMFÖRANDE</p><h3>Två olika steg</h3><p>Ett antaget förslag är inte bevis för genomförande. Urvalet räcker inte till en topplista eller jämförelse av partiernas framgång.</p></article>
      <article className="panel"><Scale size={23}/><p className="eyebrow">VERIFIERADE UTFALL</p><h3>Se förslagsboken</h3><p>Granskade utfall visas med exakt motion, beslut, datum, paragraf och sida nedan. Besvarad motion hålls skild från bifall och avslag.</p></article>
      <article className="panel"><Vote size={23}/><p className="eyebrow">OMRÖSTNINGAR</p><h3>Underlag byggs upp</h3><p>Partier jämförs aldrig utifrån antaganden. Individuell votering krävs för röststatistik.</p></article>
    </section>
    <section className="panel prose">
      <div className="sectionhead"><h2>Så kommer statistiken räknas</h2><FileText size={22}/></div>
      <div className="methodrow"><Info size={23}/><div><h3>1. Identifiera initiativet</h3><p>Motion, yrkande eller ändringsyrkande kopplas till den avsändare som står i handlingen eller protokollet.</p></div></div>
      <div className="methodrow"><CheckCircle2 size={23}/><div><h3>2. Kontrollera utfallet</h3><p>Godkänt, avslag, återremiss och bordläggning hämtas från justerat protokoll — inte från ett förslag före mötet.</p></div></div>
      <div className="methodrow"><BarChart3 size={23}/><div><h3>3. Visa hela beräkningen</h3><p>Varje siffra får en lista med beslut, paragraf, datum och länk till originalhandling. ”Mest” och ”minst” visas först när jämförbart underlag finns.</p></div></div>
    </section>
  </div>;
}
