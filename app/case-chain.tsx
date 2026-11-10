"use client";
import { formatSwedishDate } from "@/lib/date-format";
import initial from "@/data/public-catalog.json";
import {
  ArrowUpRight,
  GitBranch,
  Clock3,
  CheckCircle2,
  FileText,
} from "lucide-react";
type Step = {
  date: string;
  body: string;
  title: string;
  doc: string;
  page: number;
  kind: "decision" | "preparation" | "pending";
  text: string;
  vote?: string;
};
const steps: Step[] = [
  {
    date: "2025-06-03",
    body: "Kommunfullmäktige · §53",
    title: "Rivning och uppdrag om dialog",
    doc: "f6436f4f8b09fdd67febf044",
    page: 3,
    kind: "decision",
    text: "Fullmäktige beslutade om rivning av skolbyggnaden med en kostnad på högst 1 000 000 kr och gav kultur- och folkhälsonämnden uppdraget att föra dialog med Rydöbruks IF om kvarvarande lokaler.",
  },
  {
    date: "2025-09-18",
    body: "Kultur- och folkhälsonämnden · §76",
    title: "Avtalsförslag lämnas vidare",
    doc: "1b1f7846a2b18fbb2f04804b",
    page: 1,
    kind: "decision",
    text: "Nämnden överlämnade avtalsförslag till kommunstyrelsen för vidare hantering. Underlaget angav då 220 tkr i årlig driftskostnad och investeringsstöd under de tre första åren.",
  },
  {
    date: "2025-10-07",
    body: "Kommunstyrelsen · §159",
    title: "Juridiska förutsättningar ska utredas",
    doc: "af789de0e79c34eeb5be1be1",
    page: 3,
    kind: "decision",
    text: "Kommunstyrelsen gav kommunledningsförvaltningen i uppdrag att utreda juridiska förutsättningar för överlåtelse och undersöka tillgänglighet för fler föreningar.",
  },
  {
    date: "2026-04-28",
    body: "Kommunstyrelsens arbetsutskott · §86",
    title: "Förslag skickas vidare",
    doc: "8f87f06cc163b12dcab1afb3",
    page: 2,
    kind: "preparation",
    text: "Arbetsutskottet föreslog att fullmäktige skulle delegera avtalstecknande och ge kommunstyrelsen uppdrag att verkställa åtaganden. Detta var ett förslag, inte ett fullmäktigebeslut.",
  },
  {
    date: "2026-06-02",
    body: "Kommunfullmäktige · §72",
    title: "Ärendet återremitteras",
    doc: "886542ee665e2bfe8118b6dd",
    page: 3,
    kind: "decision",
    text: "Fullmäktige återremitterade ärendet genom minoritetsåterremiss för att undersöka hur lokalen kan tillgängliggöras för fler föreningar.",
    vote: "20 JA · 17 NEJ om återremiss",
  },
  {
    date: "2026-06-18",
    body: "Kultur- och folkhälsonämnden · §62",
    title: "Remissvar till kommunstyrelsen",
    doc: "b4eae5bd60ba4cd28ffeb827",
    page: 2,
    kind: "decision",
    text: "Nämnden såg inte behov av att komplettera överenskommelsen med krav på tillgänglighet för fler föreningar.",
    vote: "Reservation dokumenterad på sida 3",
  },
  {
    date: "2026-08-18",
    body: "Kommunstyrelsens arbetsutskott · §128",
    title: "Beredningen fortsätter",
    doc: "72546d942b6a897ce9b3b76d",
    page: 5,
    kind: "preparation",
    text: "Arbetsutskottet beslutade att avgöra ärendet och lämnade ett förslag till kommunstyrelsen och fullmäktige.",
    vote: "3 JA · 2 NEJ om att avgöra ärendet",
  },
  {
    date: "2026-08-25",
    body: "Kommunstyrelsen · §137",
    title: "Kommunstyrelsens förslag till fullmäktige",
    doc: "95a81ab2d5597e3452f83aaf",
    page: 2,
    kind: "preparation",
    text: "Kommunstyrelsen föreslog att återremissen skulle anses besvarad, avtal delegeras och åtaganden verkställas. Det är ett kommunstyrelseförslag till fullmäktige.",
    vote: "6 JA · 5 NEJ om att avgöra ärendet; reservationer dokumenterade",
  },
  {
    date: "2026-09-08",
    body: "Kommunfullmäktige · §92",
    title: "Beslut och fortsatt genomförandeuppdrag",
    doc: "kf-protokoll-2026-09-08",
    page: 8,
    kind: "decision",
    text: "Det justerade protokollet visar att fullmäktige ansåg återremissen besvarad, delegerade avtalssignering till kommunstyrelsens ordförande och gav kommunstyrelsen i uppdrag att verkställa kommunens avtalsåtaganden och omfördela medel. Beslutet är verifierat; utförandet av åtagandena har inte verifierats.",
  },
];
const cls = (kind: Step["kind"]) =>
  kind === "decision"
    ? "chain-dot decision"
    : kind === "preparation"
      ? "chain-dot prep"
      : "chain-dot pending";
export default function CaseChain() {
  function doc(step: Step) {
    const d = initial.documents.find((d) => d.id === step.doc);
    return step.doc ? (
      <a className="out" href={"/dokument/" + step.doc + "#sida-" + step.page}>
        Läs i Hyltekollen: {d?.title || "Justerat KF-protokoll 2026-09-08"} · sida {step.page}
        <ArrowUpRight size={15} />
      </a>
    ) : null;
  }
  return (
    <>
      <div className="chainhero panel">
        <GitBranch size={36} />
        <div>
          <p className="eyebrow">FÖRSTA KOMPLETTA ÄRENDEKEDJAN</p>
          <h2>Rydö skola: från tidigare beslut till fortsatt genomförande</h2>
          <p>
            Här följs samma fråga genom Hylte kommuns organ. Varje steg anger om
            det är ett verifierat beslut, beredning eller ett ännu obekräftat
            slutsteg.
          </p>
        </div>
      </div>
      <div className="chainlegend">
        <span>
          <i className="chain-dot decision" />
          Verifierat beslut i justerat protokoll
        </span>
        <span>
          <i className="chain-dot prep" />
          Beredning eller förslag
        </span>
        <span>
          <i className="chain-dot pending" />
          Väntar på källa
        </span>
      </div>
      <section className="chain">
        {steps.map((s, i) => (
          <article className="chainstep" key={s.date + s.body}>
            <div className="chainrail">
              <i className={cls(s.kind)} />
              {i < steps.length - 1 && <b />}
            </div>
            <div className="panel">
              <div className="sectionhead">
                <p className="eyebrow">
                  {formatSwedishDate(s.date, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <span className={"chainstatus " + s.kind}>
                  {s.kind === "decision"
                    ? "VERIFIERAT ORGANBESLUT"
                    : s.kind === "preparation"
                      ? "BEREDNING"
                      : "PROTOKOLL INVÄNTAS"}
                </span>
              </div>
              <p className="smallmeta">{s.body}</p>
              <h2>{s.title}</h2>
              <p>{s.text}</p>
              {s.vote && <p className="chainvote">{s.vote}</p>}
              {doc(s)}
            </div>
          </article>
        ))}
      </section>
      <section className="notice">
        <Clock3 size={18} />
        Fullmäktiges beslut den 8 september 2026 är verifierat mot §92,
        PDF-sida 8. Nästa kontrollpunkt är senare verkställighetsunderlag,
        undertecknade avtal och ekonomisk återredovisning. Saknad redovisning
        här är inte bevis för att uppdraget är ogjort.
      </section>
      <a className="out" href="/arenden/kf-2026-09-08-6">
        <FileText size={15} />
        Öppna handlingarna bakom ärendet
      </a>
    </>
  );
}
