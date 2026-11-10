import { formatSwedishDate } from "@/lib/date-format";
import archive from "@/data/historical-protocol-archive-index.json";
import history from "@/data/history-coverage.json";
import ProtocolReviewRegister from './protocol-review-register';
import CoverageMap from './coverage-map';
import { ArrowRight, CalendarRange, CheckCircle2, Database, FileWarning } from "lucide-react";

export default function HistoryEngine() {
  const latest = archive.records.slice(0, 30);
  return <section className="history-engine" id="historikmotor">
    <CoverageMap />
    <ProtocolReviewRegister />
    <div className="panel quality-hero"><div><p className="eyebrow">HYLTE KOMMUN · 15 ORGAN · 2021–2026</p><h2>Protokollen från kommunens arkiv</h2><p>Kommunens protokollarkiv innehåller handlingar från fullmäktige, styrelse, nämnder, utskott och råd. Ett dokument blir sökbart först när PDF, organ, mötesdatum och justeringsmarkör har kontrollerats.</p><a className="out" href="/protokollanalys">Sök paragrafer och diariekedjor <ArrowRight size={14}/></a></div><CalendarRange size={38}/></div>
    <div className="quality-kpis"><article className="panel"><strong>{archive.summary.listedFiles.toLocaleString("sv-SE")}</strong><span>protokollfiler listade i arkivet</span></article><article className="panel"><strong>{archive.summary.verifiedProtocols.toLocaleString("sv-SE")}</strong><span>identitetskontrollerade och sökbara</span></article><article className="panel"><strong>{archive.summary.searchablePages.toLocaleString("sv-SE")}</strong><span>sökbara PDF-sidor</span></article><article className="panel"><strong>{archive.summary.bodiesWithVerifiedProtocols}/15</strong><span>organ med verifierade protokoll</span></article></div>
    <div className="columns"><section className="panel"><div className="sectionhead"><h2>Täckning per organ</h2><Database size={22}/></div><div className="body-coverage">{archive.coverage.map((row) => <article key={row.bodyCode}><span><strong>{row.body}</strong><small>{row.listedFiles} protokollfiler i kommunarkivet</small></span><b>{row.verifiedProtocols} sökbara</b><small>{row.manualReviewFiles ? `${row.manualReviewFiles} kräver manuell kontroll` : "Inga manuella kontrollposter i senaste körningen"}</small></article>)}</div><p className="fineprint">Separat mötesindex: {history.summary.listedMeetings} KF-möten har observerats på MeetingPlus för åren {history.years.map((year) => year.year).join("–")}. Möteslistan och kommunens PDF-arkiv är två skilda källor.</p></section>
      <aside className="panel"><p className="eyebrow">SENASTE VERIFIERADE PROTOKOLL</p><div className="history-protocols">{latest.map((protocol) => <div key={protocol.id}><CheckCircle2 size={20}/><span><h3>{protocol.body} · {protocol.meetingDate}</h3><p>{protocol.pageCount} sidor · SHA-256 sparad</p><a className="out" href={`/dokument/${protocol.id}`}>Sökbar text <ArrowRight size={14}/></a><a className="out" href={protocol.url} target="_blank" rel="noreferrer">Original-PDF <ArrowRight size={14}/></a></span></div>)}</div><div className="notice"><FileWarning size={18}/><span>{archive.summary.manualReviewFiles} listade filer kräver manuell kontroll. Hämtningsfel eller en fil som inte passerar identitetskontrollen tar inte bort tidigare versioner och betyder inte att handlingen saknas.</span></div></aside></div>
    <p className="protocol-methodline"><strong>Senaste arkivimport:</strong> {formatSwedishDate(archive.checkedAt, { dateStyle: "long", timeStyle: "short" })} · <strong>Metod:</strong> {archive.method}</p>
  </section>;
}
