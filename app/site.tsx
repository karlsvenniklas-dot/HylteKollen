"use client";
import Podcast from './podcast';
import './usability.css';
import {useUrlSelection} from '@/lib/url-selection';
import ShareSelection from './share-selection';
import VersionTextDiff from './version-text-diff';
import ReviewedDecisionStages from './reviewed-decision-stages';
import DecisionJourney from './decision-journey';
import MoneyJourney from './money-journey';
import { useEffect, useState, useRef, FormEvent } from "react";
import {
  Search,
  ArrowUpRight,
  CalendarDays,
  FileText,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Clock,
  Download,
  BookOpen,
  Check,
  ChevronRight,
  Mail,
  History,
  Info,
  Link2,
  AlertCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import FollowUp from "@/app/follow-up";
import DecisionCheck from "@/app/decision-check";
import MeetingBrief from "@/app/meeting-brief";
import ChangeWatch from "@/app/change-watch";
import DecisionRadar from "@/app/decision-radar";
import LocalImpact from "@/app/local-impact";
import AskHyltekollen from "@/app/ask-hyltekollen";
import CaseChain from "@/app/case-chain";
import InitiativeStatistics from "@/app/initiative-statistics";
import AdvancedStatistics from "@/app/advanced-statistics";
import PoliticianStatistics from "@/app/politician-statistics";
import HyltePulse from "@/app/hylte-pulse";
import CoalitionMap from "@/app/coalition-map";
import ContractWatch from "@/app/contract-watch";
import MeetingCompanion from "@/app/meeting-companion";
import ContinuityWatch from "@/app/continuity-watch";
import ReviewQueue from "@/app/review-queue";
import DebateMap from "@/app/debate-map";
import MotionJourneys from "@/app/motion-journeys";
import QuestionBank from "@/app/question-bank";
import ProtocolInterpreter from "@/app/protocol-interpreter";
import DecisionDiff from "@/app/decision-diff";
import SourcePack from "@/app/source-pack";
import ArchiveCoverage from "@/app/archive-coverage";
import DataWorkbench from "@/app/data-workbench";
import CaseComparison from "@/app/case-comparison";
import WeeklyBrief from "@/app/weekly-brief";
import HistoryEngine from "@/app/history-engine";
import LatestSources from "@/app/latest-sources";
import SourceReader from "@/app/source-reader";
import DataQualityCenter from "@/app/data-quality-center";
import PersonalWatchlist from "@/app/personal-watchlist";
import VideoArchive from "@/app/video-archive";
import AccountabilityLedger from "@/app/accountability-ledger";
import MoneyProcurement from "@/app/money-procurement";
import PartyTimeline from "@/app/party-timeline";
import ProposalLedger from "@/app/proposal-ledger";
import ProtocolInsights from "@/app/protocol-insights";
import { findProtocolDocument, searchProtocolArchive } from "@/lib/protocol-search-client";
import initial from "@/data/public-catalog.json";
import protocolArchive from "@/data/historical-protocol-archive-index.json";
import type { Catalog, Item, Document as Doc } from "@/lib/types";
import { formatSwedishDate } from "@/lib/date-format";
const locations = [
  "Hela kommunen",
  "Hyltebruk",
  "Torup",
  "Kinnared",
  "Landeryd",
  "Unnaryd",
  "Rydöbruk",
  "Långaryd",
  "Femsjö",
];
const navGroups = [
  { label: "Översikt", items: [["Senaste", "/", "senaste"], ["Radar", "/radar", "radar"], ["Puls", "/hyltepulsen", "hyltepulsen"], ["Mina bevakningar", "/bevakningar", "bevakningar"]] },
  { label: "Möten", items: [["Podd", "/podd", "podd"], ["Möten", "/moten", "moten"], ["Mötesläge", "/moteskompisen", "moteskompisen"], ["Debatt", "/debattkartan", "debattkartan"], ["Mötesbrief", "/motesbrief", "motesbrief"], ["Veckobrief", "/veckobrief", "veckobrief"]] },
  { label: "Ärenden", items: [["Ärenden", "/arenden", "arenden"], ["Ärendekedjor", "/arendekedjor", "arendekedjor"], ["Motioner", "/motioner", "motioner"], ["Uppföljning", "/uppfoljning", "uppfoljning"], ["Avtal", "/avtalsvakten", "avtalsvakten"], ["Ekonomi", "/ekonomi", "ekonomi"], ["Orter", "/orter", "orter"]] },
  { label: "Granska", items: [["Ändringar", "/andringar", "andringar"], ["Beslutskontroll", "/beslutskontroll", "beslutskontroll"], ["Beslutsdiff", "/beslutsdiff", "beslutsdiff"], ["Kontrollfrågor", "/fragor", "fragor"], ["Källpaket", "/kallpaket", "kallpaket"], ["Källglapp", "/kallglapp", "kallglapp"], ["Tipsa", "/granskningsko", "granskningsko"]] },
  { label: "Data & statistik", items: [["Statistik", "/statistik", "statistik"], ["Protokollarkiv", "/historik", "historik"], ["Protokollutforskaren", "/protokollanalys", "protokollanalys"], ["Analys", "/analys", "analys"], ["Jämför ärenden", "/jamfor", "jamfor"], ["Politiker", "/politiker", "politiker"], ["Samarbeten", "/koalitionskartan", "koalitionskartan"], ["Data & täckning", "/data", "data"], ["Ordlista", "/protokolltolken", "protokolltolken"]] },
];
const pretty = (d: string) =>
  formatSwedishDate(d, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
function Badge({ children = "UNDERLAG" }: { children?: React.ReactNode }) {
  return <span className="badge">{children}</span>;
}
function Out({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a className="out" href={href} target="_blank" rel="noreferrer">
      {children}
      <ArrowUpRight size={15} />
    </a>
  );
}
function Blank({ title, text }: { title: string; text: string }) {
  return (
    <div className="blank">
      <BookOpen size={26} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
function titleFor(i: Item) {
  return (
    (
      {
        6: "Rydö skola: lokalerna efter återremissen",
        7: "Arbetsformer för kommunens råd",
        8: "Regler för hemsjukvård och hjälpmedel",
        9: "Regler för Patientnämnden Halland",
        10: "Motion om bygglovsavgifter",
        11: "Motion om en välkomstskylt",
        12: "Motion om kommunens resepolicy",
        13: "Interpellation om aktivitetskravet",
        14: "Inkomna interpellationer",
        15: "Motion om laddning för tung trafik",
      } as Record<number, string>
    )[i.number] || i.title
  );
}
function ItemRow({ item, compact = false }: { item: Item; compact?: boolean }) {
  return (
    <a
      className={"itemrow " + (compact ? "compact" : "")}
      href={"/arenden/" + item.id}
    >
      <span className="itemnumber">{String(item.number).padStart(2, "0")}</span>
      <div>
        <div className="smallmeta">
          {item.topic} <span>·</span> {item.location}
        </div>
        <h3>{titleFor(item)}</h3>
        <p>
          {item.documentIds.length} {item.documentIds.length === 1 ? "handling" : "handlingar"} <span>·</span> Kommunfullmäktige
          8 september
        </p>
      </div>
      <ChevronRight size={20} />
    </a>
  );
}
function Documents({ docs }: { docs: Doc[] }) {
  return (
    <div className="doclist">
      {docs.length ? (
        docs.map((d) => (
          <a className="docrow" href={"/dokument/" + d.id} key={d.id}>
            <FileText size={20} />
            <div>
              <strong>{d.title}</strong>
              <p>
                PDF ·{" "}
                {d.fetchStatus === "ok"
                  ? d.pageCount + " sidor · Text importerad"
                  : d.fetchStatus === "ocr_required"
                    ? "Kräver texttolkning"
                    : "Textimport misslyckades – originalet är länkat"}
              </p>
            </div>
            <ChevronRight size={17} />
          </a>
        ))
      ) : (
        <Blank
          title="Inga offentliga bilagor i importen"
          text="Det betyder inte att ärendet saknar underlag. Kontrollera mötets originalsida."
        />
      )}
    </div>
  );
}
function Correction({ itemId }: { itemId: string }) {
  const [message, setMessage] = useState(""),
    [result, setResult] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult("");
    try {
      const r = await fetch("/api/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, message }),
      });
      const d: any = await r.json();
      setResult(
        r.ok
          ? "Ditt rättelseförslag är sparat för granskning. Den publicerade uppgiften är inte ändrad."
          : d.error,
      );
      if (r.ok) setMessage("");
    } catch {
      setResult("Kunde inte spara. Försök igen.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog>
      <DialogTrigger className="textbutton">Föreslå en rättelse</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hjälp oss rätta en uppgift</DialogTitle>
          <DialogDescription>
            Beskriv vad som behöver ändras och ange gärna en källa. En granskad
            rättelse sparas med historik.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <label htmlFor="correction">Rättelse och källa</label>
          <textarea
            id="correction"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            minLength={10}
            maxLength={2000}
            rows={6}
          />
          <p aria-live="polite">{result}</p>
          <button className="primary" disabled={busy}>
            {busy ? "Sparar…" : "Spara rättelseförslag"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export default function Hyltekollen({
  view,
  id,
}: {
  view: string;
  id?: string;
}) {
  const navigationRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      const nav = navigationRef.current;
      if (nav && event.target instanceof Node && !nav.contains(event.target)) {
        nav.querySelectorAll<HTMLDetailsElement>('details[open]').forEach(menu => { menu.open = false; });
      }
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  const [q,setQ]=useUrlSelection('q','');
  const [area,setArea]=useUrlSelection('omrade','Alla orter');
  const [topic,setTopic]=useUrlSelection('rubrikamne','Alla ämnen');
  const [data, setData] = useState<Catalog>(initial as unknown as Catalog),
    [result, setResult] = useState<any[] | null>(null),
    [searchBusy, setSearchBusy] = useState(false),
    [error, setError] = useState(""),
    [doc, setDoc] = useState<Doc | null>(null),
    [searchTotal, setSearchTotal] = useState(0);
  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((d) => setData(d as Catalog))
      .catch(() =>
        setError(
          "Senaste datakontrollen kunde inte läsas. Den sparade importen visas.",
        ),
      );
  }, [view, id]);
  useEffect(() => {
    if (view === "dokument" && id) {
      setDoc(null);
      fetch("/api/document/" + id)
        .then((r) => {
          if (!r.ok) throw Error();
          return r.json();
        })
        .then(async (d) => {
          if (!d.pages?.length) {
            const archiveRecord = await findProtocolDocument(id);
            if (archiveRecord) d = archiveRecord;
          }
          setDoc(d as Doc);
        })
        .catch(async () => {
          try {
            const archiveRecord = await findProtocolDocument(id);
            if (!archiveRecord) throw Error();
            setDoc(archiveRecord as Doc);
          } catch {
            setError("Handlingen kunde inte hämtas.");
          }
        });
    }
  }, [view, id]);
  useEffect(() => {
    if (q.trim().length < 2) {
      setResult(null);
      return;
    }
    const ctrl = new AbortController();
    setSearchBusy(true);
    const timer = setTimeout(() => {
      Promise.all([
        fetch("/api/search?q=" + encodeURIComponent(q), { signal: ctrl.signal }).then((r) => r.json()),
        searchProtocolArchive(q),
      ])
        .then(([d, archive]: any[]) => {
          if (ctrl.signal.aborted) return;
          const current = d.results || [];
          const seenDocuments = new Set(current.map((row: any) => row.url?.match(/^\/dokument\/([^/#]+)/)?.[1]).filter(Boolean));
          const historical = (archive.results || []).filter((row: any) => {
            const documentId = row.url?.match(/^\/dokument\/([^/#]+)/)?.[1];
            if (!documentId || seenDocuments.has(documentId)) return !documentId;
            seenDocuments.add(documentId);
            return true;
          });
          const merged = [...current, ...historical].slice(0, 100);
          setResult(merged);
          setSearchTotal((d.total || 0) + (archive.total || 0));
          setSearchBusy(false);
        })
        .catch((e) => {
          if (e.name !== "AbortError") {
            setError("Sökningen kunde inte genomföras. Försök igen.");
            setSearchBusy(false);
          }
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q]);
  useEffect(() => {
    const ctx = (document as any).modelContext;
    if (!ctx?.registerTool) return;
    const lifecycle = new AbortController();
    Promise.resolve(
      ctx.registerTool(
        {
          name: "search_hyltekollen",
          description:
            "Search imported municipal meeting documents; update the same search shown on screen.",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", minLength: 2, maxLength: 150 },
            },
            required: ["query"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          async execute(input: any) {
            if (
              typeof input?.query !== "string" ||
              input.query.length < 2 ||
              input.query.length > 150
            )
              throw Error("Query must contain 2–150 characters.");
            const r = await fetch(
              "/api/search?q=" + encodeURIComponent(input.query),
            );
            if (!r.ok) throw Error("Search unavailable");
            const d: any = await r.json();
            setQ(input.query);
            setResult(d.results);
            setSearchTotal(d.total || 0);
            return d;
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => {});
    return () => lifecycle.abort();
  }, []);
  const meeting = data.meetings[0],
    items = data.meetings.flatMap((m) => m.items),
    verifiedDecisions = meeting.verifiedDecisions ?? [],
    item = items.find((i) => i.id === id),
    rydo = items.find((i) => i.number === 6)!,
    source = data.documents.find(
      (d) =>
        d.itemId === rydo.id && d.title.startsWith("Tjänsteskrivelse - Efter"),
    );
  const filtered = items.filter(
    (i) =>
      (area === "Alla orter" || i.location === area) &&
      (topic === "Alla ämnen" || i.topic === topic),
  );
  const sourceLink = source ? source.url + "#page=2" : meeting.url;
  const title =
    (
      {
        arendekedjor: "Ärendekedjor.",
        radar: "Beslutsradar.",
        hyltepulsen: "Hyltepulsen.",
        koalitionskartan: "Koalitionskartan.",
        minort: "Orter.",
        fraga: "Fråga Hyltekollen.",
        granskningsko: "Öppen granskningskö.",
        attfolja: "Beslut att följa upp.",
        kalender: "Inför nästa möte.",
        andringar: "Vad ändrades?",
        motesbrief: "Inför nästa möte.",
        beslutskontroll: "Beslutskontroll.",
        uppfoljning: "Beslut att följa upp.",
        kallglapp: "Frågan som försvann.",
        avtalsvakten: "Avtalsvakten.",
        senaste: "Det händer i Hylte.",
        moten: id ? "Kommunfullmäktige" : "Möten & handlingar",
        moteskompisen: "Möteskompisen.",
        debattkartan: "Debattkartan.",
        motioner: "Motionsresan.",
        fragor: "Frågebanken.",
        protokolltolken: "Protokolltolken.",
        beslutsdiff: "Beslutsdiffen.",
        kallpaket: "Källpaketet.",
        veckobrief: "Veckobriefen.",
        podd: "Hylte-podden.",
        jamfor: "Jämför ärenden.",
        bevakningar: "Mina bevakningar.",
        arenden: id
          ? item
            ? titleFor(item)
            : "Ärendet hittades inte"
          : "Följ frågorna.",
        ekonomi: "Vad händer med pengarna?",
        statistik: "Beslutsstatistik.",
        historik: "Protokollarkivet.",
        protokollanalys: "Protokollutforskaren.",
        analys: "Avancerad analys.",
        politiker: "Politikerstatistik.",
        "min-ort": "Orter.",
        orter: "Orter.",
        data: "Du ska kunna kontrollera oss.",
        dokument: doc?.title || "Originalhandlingen",
        nyhetsbrev: "Mötet i din inkorg.",
      } as Record<string, string>
    )[view] || "Sidan hittades inte";
  const sub = (
    {
      arendekedjor:
        "Följ samma fråga genom nämnd, arbetsutskott, styrelse och fullmäktige.",
      radar: "Nya signaler, kommande möten och saker som behöver kontrolleras.",
      hyltepulsen:
        "Aktiviteten i Hyltes politiska frågor, beräknad från publicerade kommunhandlingar.",
      koalitionskartan:
        "Dokumenterade gemensamma yrkanden och skiljelinjer i Hylte kommuns protokoll.",
      minort: "Beslut, dokument och källträffar för din del av kommunen.",
      fraga:
        "Sök i importerade kommunhandlingar och läs källorna bakom svaret.",
      granskningsko:
        "Tipsa om en uppgift som behöver källkontrolleras. Inget publiceras automatiskt.",
      attfolja:
        "Beslutade uppdrag, ansvar och vad som återstår att verifiera. Bara Hylte kommun.",
      kalender:
        "Källor, frågor och vad som behöver finnas på plats före mötet.",
      andringar:
        "Nya dokumentversioner och protokolljämförelse med källan först.",
      motesbrief:
        "Källor, frågor och vad som behöver finnas på plats före mötet.",
      beslutskontroll: "Status för protokoll, beredning och slutliga beslut.",
      uppfoljning:
        "Beslutade uppdrag, ansvar och vad som återstår att verifiera. Bara Hylte kommun.",
      kallglapp:
        "Dokumentkedjor som fortsätter — och exakta diarienummer som ännu saknar en ny träff i importen.",
      avtalsvakten:
        "Villkor, kostnader, ansvar och deadlines i Hylte kommuns publicerade avtalsförslag.",
      senaste: "Möten, handlingar och beslut. Med källan ett klick bort.",
      moten: "Från dagordning till justerat protokoll.",
      moteskompisen:
        "Dagordning, ärenden och originalhandlingar samlade i ett fokuserat mötesläge.",
      debattkartan:
        "Sändning, dagordning och källor kopplade till samma möte — utan gissade tidsstämplar.",
      motioner:
        "Följ en motion från inlämning till beredning och protokollsverifierat utfall.",
      fragor:
        "Neutrala kontrollfrågor med synligt källäge för varje ärende.",
      protokolltolken:
        "Kommunens beslutsspråk förklarat med verkliga, källänkade Hylte-exempel.",
      beslutsdiff:
        "Jämför ursprungsförslag, beredning och redovisat utfall punkt för punkt.",
      kallpaket:
        "Skriv ut eller dela ett källspårbart granskningsunderlag för ett valt ärende.",
      veckobrief:
        "Daterat källäge, uppföljning och kommande möten i ett delbart underlag.",
      podd: "Veckans svenska ljudöversikt – med beslut och förslag åtskilda.",
      jamfor:
        "Jämför källtäckning och granskningsläge utan poäng, rankning eller politiska värderingar.",
      bevakningar:
        "Följ orter, ämnen och diarienummer lokalt på den här enheten — utan automatiska utskick.",
      arenden: id
        ? "Underlag, dokument och nästa steg i samma ärende."
        : "Sök i dagordningen och öppna handlingarna bakom varje fråga.",
      ekonomi: "Belopp från underlagen, med källor och tydlig beslutsstatus.",
      statistik: "Initiativ, utfall och omröstningar — bara när de går att belägga i protokoll.",
      historik: "Verifierade och sökbara protokoll från kommunens 15 publicerade organ.",
      protokollanalys: "Sök paragrafer, följ exakta diarienummer och hitta orter och belopp i verifierade protokoll.",
      analys: "Förlopp, uppföljning och täckning i Hylte kommuns importerade underlag.",
      politiker: "Närvaro och initiativ från importerade Hylte-protokoll, med källa per uppgift.",
      "min-ort": "Beslut, dokument och källträffar för din del av kommunen.",
      orter: "Beslut, dokument och källträffar för din del av kommunen.",
      data: "Källor, täckning och vad som fortfarande saknas.",
      dokument:
        "Importerad dokumenttext. Original-PDF:en är den auktoritativa källan.",
      nyhetsbrev: "Ett källänkat utkast som granskas före publicering.",
    } as Record<string, string>
  )[view];
  const docset = item ? data.documents.filter((d) => d.itemId === item.id) : [];
  const known = [
    "arendekedjor",
    "radar",
    "hyltepulsen",
    "koalitionskartan",
    "minort",
    "min-ort",
    "fraga",
    "granskningsko",
    "attfolja",
    "kalender",
    "andringar",
    "motesbrief",
    "beslutskontroll",
    "uppfoljning",
    "kallglapp",
    "avtalsvakten",
    "senaste",
    "moten",
    "moteskompisen",
    "debattkartan",
    "motioner",
    "fragor",
    "protokolltolken",
    "beslutsdiff",
    "kallpaket",
    "veckobrief",
    "podd",
    "jamfor",
    "bevakningar",
    "arenden",
    "ekonomi",
    "statistik",
    "historik",
    "protokollanalys",
    "analys",
    "politiker",
    "orter",
    "data",
    "dokument",
    "nyhetsbrev",
  ].includes(view);
  function filterBar() {
    return (
      <div className="filters">
        <Select value={area} onValueChange={setArea}>
          <SelectTrigger aria-label="Filtrera efter ort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["Alla orter", ...locations].map((x) => (
              <SelectItem value={x} key={x}>
                {x}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger aria-label="Filtrera efter ämne">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[
              "Alla ämnen",
              ...Array.from(new Set(items.map((i) => i.topic))),
            ].map((x) => (
              <SelectItem key={x} value={x}>
                {x}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>{filtered.length} dagordningspunkter</span>
        {(area !== "Alla orter" || topic !== "Alla ämnen") && (
          <button
            className="textbutton"
            onClick={() => {
              setArea("Alla orter");
              setTopic("Alla ämnen");
            }}
          >
            Rensa filter
          </button>
        )}
      </div>
    );
  }
  function money() {
    return (
      <section className="panel money">
        <div className="sectionhead">
          <p className="eyebrow">RYDÖ SKOLA · FÖRESLAGEN EKONOMI</p>
          <Badge>FÖRSLAG</Badge>
        </div>
        <h2>Drift och renovering av lokalerna</h2>
        <div className="moneytop">
          <strong>
            220 000 <span>kr / år</span>
          </strong>
          <p>Föreslaget årligt föreningsbidrag för drift och underhåll.</p>
        </div>
        <div className="moneybars">
          {[
            [2027, 520],
            [2028, 320],
            [2029, 320],
            [2030, 220],
          ].map(([year, value]) => (
            <div key={year}>
              <span>
                {year}
                {year === 2030 ? " →" : ""}
              </span>
              <div className="bartrack">
                <div style={{ width: (value / 520) * 100 + "%" }} />
              </div>
              <strong>{value} tkr</strong>
            </div>
          ))}
        </div>
        <div className="moneyfacts">
          <div>
            <strong>1,16 mkr</strong>
            <span>planerat bidrag 2027–2029</span>
          </div>
          <div>
            <strong>ca 300 tkr</strong>
            <span>initiala kommunala åtaganden 2026</span>
          </div>
          <div>
            <strong>220 tkr/år</strong>
            <span>från 2030 enligt underlaget</span>
          </div>
        </div>
        <p className="small">
          Beloppen är ett förslag i underlaget. Finansiering anges vara
          befintlig hyreskostnad; omfördelning till kultur- och folkhälsonämnden
          behövs från 2027.
        </p>
        <Out href={sourceLink}>Tjänsteskrivelse 15 juli 2026 · sida 2</Out>
        <a className="out" href="/beslutskontroll">
          Se beslutsstatus och justerat KS-protokoll <ArrowRight size={15} />
        </a>
        <p className="note">
          Justerat KF-protokoll 2026-09-08 §92, PDF s. 8: fullmäktige ansåg
          minoritetsåterremissen besvarad och gav kommunstyrelsen i uppdrag att
          verkställa avtalsåtagandena och omfördela medel. Genomförandet är inte
          verifierat.
        </p>
      </section>
    );
  }
  return (
    <>
      <a className="skip-content" href="#huvudinnehall">Hoppa till innehållet</a>
      <header className="masthead">
        <a href="/" className="brand" aria-label="Hyltekollen startsida">
          hylte<span>kollen</span>
          <i />
        </a>
        <span>Kommunpolitiken, utan protokollspråk.</span>
        <a href="/data">
          Om våra källor <ArrowUpRight size={16} />
        </a>
      </header>
      <nav ref={navigationRef} aria-label="Huvudmeny" onKeyDown={event => {
        if (event.key !== 'Escape') return;
        const open = navigationRef.current?.querySelector<HTMLDetailsElement>('details[open]');
        if (open) { open.open = false; open.querySelector('summary')?.focus(); event.preventDefault(); }
      }} onClick={event => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const summary = target.closest('summary');
        const selected = summary?.parentElement;
        if (summary || target.closest('a')) navigationRef.current?.querySelectorAll<HTMLDetailsElement>('details[open]').forEach(menu => {
          if (menu !== selected) menu.open = false;
        });
      }}>
        {navGroups.map((group) => <details name="hyltekollen-main-menu" className="nav-menu" key={group.label}><summary className={group.items.some(([, , key]) => view === key) ? "active" : ""}>{group.label}</summary><div>{group.items.map(([label, url, key]) => <a className={view === key ? "active" : ""} aria-current={view === key ? "page" : undefined} key={label} href={url}>{label}</a>)}</div></details>)}
        <a className={view === "fraga" ? "active nav-search" : "nav-search"} href="/fraga"><Search size={16}/> Fråga</a>
        <a className="navright" href="/nyhetsbrev">
          <Mail size={16} />
          Nyhetsbrev
        </a>
      </nav>
      <main id="huvudinnehall" tabIndex={-1}>
        {id && (
          <a
            className="back"
            href={
              view === "dokument"
                ? "/arenden/" + (doc?.itemId || rydo.id)
                : "/" + view
            }
          >
            ← Till{" "}
            {view === "dokument"
              ? "ärendet"
              : view === "moten"
                ? "möten"
                : view === "uppfoljning"
                  ? "uppföljningen"
                  : "ärenden"}
          </a>
        )}
        <div className="pagehead">
          <div>
            <p className="eyebrow">HYLTE KOMMUN · OBEROENDE KÄLLREGISTER</p>
            <h1 className={id ? "detailtitle" : ""}>{title}</h1>
            <p>{sub}</p>
          </div>
          {!id && (
            <label className="search">
              <Search size={19} />
              <input
                aria-label="Sök i Hyltekollen"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Sök till exempel Rydö skola…"
                maxLength={150}
              />
              {q && (
                <button onClick={() => setQ("")} aria-label="Rensa sökning">
                  ×
                </button>
              )}
            </label>
          )}
        </div>
        {(error || data.storageError) && (
          <div role="status" className="notice">
            {error ||
              "Databasen är tillfälligt otillgänglig. Den sparade källimporten visas; rättelser kan inte sparas just nu."}
          </div>
        )}
        {q.trim().length >= 2 ? (
          <section className="panel">
            <div className="sectionhead">
              <h2>Sökresultat</h2>
              <ShareSelection/>
              <span aria-live="polite">
                {searchBusy ? "Söker…" : searchTotal + " träffar"}
              </span>
            </div>
            <p className="small">
              Fulltextsökning i importerade handlingar och identitetskontrollerade protokoll från Hylte kommuns arkiv. Semantisk sökning är inte aktiverad.
            </p>
            {result?.length
              ? result.map((r, index) => (
                  <a className="searchresult" href={r.url} key={index}>
                    <span className="smallmeta">
                      {r.type}
                      {r.page ? " · Sida " + r.page : ""}
                    </span>
                    <h3>{r.title}</h3>
                    <p>{r.text}</p>
                    <span className="out">
                      Öppna källa <ArrowRight size={15} />
                    </span>
                  </a>
                ))
              : !searchBusy && (
                  <Blank
                    title="Inga träffar i de sökbara källorna"
                    text="Prova ett kortare sökord eller ett diarienummer. Protokoll som kräver manuell identitetskontroll ingår ännu inte i fulltextsökningen."
                  />
                )}
          </section>
        ) : (
          <>
            {view === "arendekedjor" && <><DecisionJourney/><ReviewedDecisionStages/><CaseChain /></>}
            {view === "radar" && <DecisionRadar />}
            {view === "hyltepulsen" && <HyltePulse />}
            {view === "koalitionskartan" && <CoalitionMap />}
            {view === "minort" && <LocalImpact initialPlace={id} />}
            {view === "min-ort" && <LocalImpact initialPlace={id} />}
            {view === "fraga" && <AskHyltekollen />}
            {view === "granskningsko" && <ReviewQueue />}
            {view === "attfolja" && <FollowUp id={id} />}
            {view === "kalender" && <MeetingBrief />}
            {view === "andringar" && <><VersionTextDiff/><ChangeWatch /></>}
            {view === "motesbrief" && <MeetingBrief />}
            {view === "beslutskontroll" && <DecisionCheck />}
            {view === "moteskompisen" && <MeetingCompanion />}
            {view === "debattkartan" && <><DebateMap /><VideoArchive /></>}
            {view === "motioner" && <MotionJourneys />}
            {view === "fragor" && <QuestionBank />}
            {view === "protokolltolken" && <ProtocolInterpreter />}
            {view === "beslutsdiff" && <DecisionDiff />}
            {view === "kallpaket" && <SourcePack />}
            {view === "veckobrief" && <WeeklyBrief />}
            {view === "podd" && <Podcast />}
            {view === "senaste" && <section className="panel"><p className="eyebrow">LYSSNA · VECKA 45</p><h2>Gigantisk datahall och Natoplaner i Hylte</h2><p>AI-genererad svensk ljudöversikt · Protokollkollen 3 november 2026 · cirka 25 minuter.</p><a className="out" href="/podd">Lyssna på Hylte-podden →</a></section>}
            {view === "jamfor" && <CaseComparison />}
            {view === "bevakningar" && <PersonalWatchlist />}
            {view === "kallglapp" && <ContinuityWatch />}
            {view === "statistik" && <><PartyTimeline /><InitiativeStatistics /><ProposalLedger /></>}
            {view === "historik" && <HistoryEngine />}
            {view === "protokollanalys" && <ProtocolInsights />}
            {view === "analys" && <AdvancedStatistics />}
            {view === "politiker" && <PoliticianStatistics id={id} />}
            {view === "uppfoljning" && <><FollowUp id={id} />{!id && <AccountabilityLedger />}</>}
            {view === "avtalsvakten" && <ContractWatch />}
            {view === "senaste" && (
              <>
                <LatestSources />
                <div className="columns">
                  <section>
                    <div className="sectionhead">
                      <p className="eyebrow">FÖRDJUPNING · SEPTEMBERMÖTET</p>
                      <a href="/motesbrief">
                        Inför nästa möte <ArrowRight size={15} />
                      </a>
                    </div>
                    <article className="lead">
                      <div className="meta">
                        <span>8 SEPTEMBER 2026</span>
                        <Badge>
                          {meeting.protocolPublished
                            ? "PROTOKOLL ATT GRANSKA"
                            : "PROTOKOLL INVÄNTAS"}
                        </Badge>
                      </div>
                      <h2>Vad händer med Rydö skola?</h2>
                      <p>
                        Fastigheten återkommer på dagordningen efter återremiss.
                        Läs handlingarna och följ frågan från tidigare
                        behandling till nästa steg.
                      </p>
                      <a className="primary" href={"/arenden/" + rydo.id}>
                        Följ ärendet <ArrowRight size={18} />
                      </a>
                      <div className="leadfoot">
                        <span>
                          <CalendarDays size={16} /> Kommunfullmäktige
                        </span>
                        <a href={"/moten/" + meeting.id}>
                          <FileText size={16} />
                          {items.length} dagordningspunkter{" "}
                          <ArrowRight size={14} />
                        </a>
                      </div>
                    </article>
                  </section>
                  <aside className="panel sourcepanel">
                    <p className="eyebrow">SÅ LÅNGT VET VI</p>
                    <ShieldCheck size={30} />
                    <h2>
                      Källan först.
                      <br />
                      Slutsatsen sedan.
                    </h2>
                    <p>
                      {meeting.protocolPublished
                        ? `Justerat protokoll finns i kommunens arkiv. ${verifiedDecisions.length} beslut har verifierats mot paragraf och PDF-sida; övriga mötespunkter är inte granskade.`
                        : "Handlingar finns för mötet. Inget protokoll är publicerat i den kontrollerade källan."}
                    </p>
                    <a href="/data">
                      Så verifierar vi uppgifter <ArrowUpRight size={16} />
                    </a>
                    <div className="checked">
                      <Clock size={14} /> Källkontroll {pretty(data.checkedAt)}
                    </div>
                  </aside>
                </div>
                <div className="statsstrip">
                  <div>
                    <strong>01</strong>
                    <span>importerat möte</span>
                  </div>
                  <div>
                    <strong>{items.length}</strong>
                    <span>dagordningspunkter</span>
                  </div>
                  <div>
                    <strong>{data.documents.length}</strong>
                    <span>länkade handlingar</span>
                  </div>
                  <div>
                    <strong>{verifiedDecisions.length}</strong>
                    <span>verifierade beslut från testmötet</span>
                  </div>
                  <a href="/data">
                    Se arkivets täckning <ArrowUpRight size={16} />
                  </a>
                </div>
                <div className="columns lower">
                  <section>
                    <div className="sectionhead">
                      <h2>Ur dagordningen</h2>
                      <a href="/arenden">
                        Visa alla <ArrowRight size={15} />
                      </a>
                    </div>
                    <div className="itemlist">
                      {items
                        .filter((i) => [10, 7, 15].includes(i.number))
                        .map((i) => (
                          <ItemRow item={i} key={i.id} />
                        ))}
                    </div>
                    <div className="sectionhead spaced">
                      <h2>Vad händer med pengarna?</h2>
                      <a href="/ekonomi">
                        Till ekonomin <ArrowRight size={15} />
                      </a>
                    </div>
                    {money()}
                  </section>
                  <aside className="stack">
                    <section className="panel">
                      <p className="eyebrow">KOMMANDE MÖTEN</p>
                      {data.upcoming.slice(0, 3).map((m) => (
                        <a
                          className="meetingmini"
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                          key={m.url}
                        >
                          <div className="datebox">
                            <strong>{m.date.slice(8)}</strong>
                            <span>
                              {formatSwedishDate(m.date, {
                                month: "short",
                              })}
                            </span>
                          </div>
                          <div>
                            <h3>{m.title}</h3>
                            <span>Öppna MeetingPlus ↗</span>
                          </div>
                        </a>
                      ))}
                      <Out href="https://meetings.hylte.se/">
                        Kommunens möteskalender
                      </Out>
                    </section>
                    <section className="panel placepanel">
                      <MapPin size={24} />
                      <h2>Vad berör Kinnared?</h2>
                      <p>
                        Utforska de ärenden som har en dokumenterad koppling
                        till orten.
                      </p>
                      <a href="/orter/Kinnared">
                        Till Kinnared <ArrowRight size={16} />
                      </a>
                    </section>
                    <section className="panel">
                      <History size={24} />
                      <h2>Vad hände sedan?</h2>
                      <p>
                        11 beslutade uppdrag följs från vårens redovisning och
                        den nyare redovisningen den 15 september. Se ansvarig
                        nämnd, senare behandling och vilka slutredovisningar
                        som behöver kontrolleras.
                      </p>
                      <a href="/uppfoljning">
                        Se uppföljningen <ArrowRight size={16} />
                      </a>
                    </section>
                  </aside>
                </div>
              </>
            )}
            {view === "moten" && !id && (
              <>
                <div className="notice">
                  <Info size={18} /> Den detaljerade mötesvyn omfattar ett
                  testmöte. Det separata protokollarkivet innehåller sökbara
                  protokoll från samtliga 15 bevakade kommunala organ.
                </div>
                <div className="meetingcard panel">
                  <div className="datebox large">
                    <strong>08</strong>
                    <span>SEP 2026</span>
                  </div>
                  <div>
                    <Badge>
                      {meeting.protocolPublished
                        ? "PROTOKOLL ATT GRANSKA"
                        : "UNDERLAG · PROTOKOLL INVÄNTAS"}
                    </Badge>
                    <h2>
                      <a href={"/moten/" + meeting.id}>Kommunfullmäktige</a>
                    </h2>
                    <p>
                      Forum · 18:30–21:00 · {items.length} dagordningspunkter ·{" "}
                      {data.documents.length} handlingar
                    </p>
                  </div>
                  <a className="primary" href={"/moten/" + meeting.id}>
                    Öppna mötet <ArrowRight size={16} />
                  </a>
                </div>
                <div className="sectionhead spaced">
                  <h2>Kommande möten i källan</h2>
                </div>
                <div className="grid3">
                  {data.upcoming.map((m) => (
                    <div className="panel" key={m.url}>
                      <p className="eyebrow">{pretty(m.date)}</p>
                      <h3>{m.title}</h3>
                      <Out href={m.url}>Öppna i MeetingPlus</Out>
                    </div>
                  ))}
                </div>
              </>
            )}
            {view === "moten" &&
              id &&
              (id === meeting.id ? (
                <>
                  <div className="meetingdetails">
                    <span>
                      <CalendarDays size={18} />
                      {pretty(meeting.date)}
                    </span>
                    <span>
                      <Clock size={18} />
                      {meeting.time}
                    </span>
                    <span>
                      <MapPin size={18} />
                      {meeting.venue}
                    </span>
                    <Out href={meeting.url}>Originalmöte</Out>
                  </div>
                  <div className="notice">
                    <Info size={18} />
                    {meeting.protocolPublished
                      ? `${verifiedDecisions.length} utvalda beslut är verifierade mot justerat protokoll, paragraf och PDF-sida. Övriga mötespunkter är inte granskade.`
                      : "Mötet har passerat, men det kontrollerade underlaget saknar publicerat protokoll. Ingen debatt har transkriberats. Därför visas inga preliminära mötesresultat."}
                  </div>
                  <Tabs defaultValue="agenda">
                    <TabsList>
                      <TabsTrigger value="agenda">
                        Dagordning ({items.length})
                      </TabsTrigger>
                      <TabsTrigger value="documents">
                        Handlingar ({data.documents.length})
                      </TabsTrigger>
                      <TabsTrigger value="video">Debatt & video</TabsTrigger>
                    </TabsList>
                    <TabsContent value="agenda">
                      <div className="itemlist">
                        {items.map((i) => (
                          <ItemRow key={i.id} item={i} />
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="documents">
                      <Documents docs={data.documents} />
                    </TabsContent>
                    <TabsContent value="video">
                      <div className="panel">
                        <Blank
                          title="Debatten är inte transkriberad"
                          text="Videon har ännu inte kopplats till dagordningen. Inga talare, yrkanden eller tidsstämplar har registrerats."
                        />
                        <Out href="https://www.youtube.com/@hyltekommun">
                          Hylte kommuns YouTube-kanal
                        </Out>
                      </div>
                    </TabsContent>
                  </Tabs>
                </>
              ) : (
                <Blank
                  title="Mötet finns inte i importen"
                  text="Öppna Möten för att se de källor som är inlästa."
                />
              ))}
            {view === "arenden" && !id && (
              <>
                {filterBar()}
                <div className="itemlist">
                  {filtered.length ? (
                    filtered.map((i) => <ItemRow item={i} key={i.id} />)
                  ) : (
                    <Blank
                      title="Inga ärenden matchar filtret"
                      text="Rensa filtret eller välj en annan ort."
                    />
                  )}
                </div>
              </>
            )}
            {view === "arenden" &&
              id &&
              (item ? (
                <>
                  <div className="meetingdetails">
                    <Badge>UNDERLAG · EJ VERIFIERAT BESLUT</Badge>
                    <span>Punkt {item.number}</span>
                    <span>
                      <MapPin size={16} />
                      {item.location}
                    </span>
                    <span className="smallmeta">ID: {item.id}</span>
                  </div>
                  <div className="columns">
                    <section>
                      <div className="panel">
                        <p className="eyebrow">FRÅGAN I KORTHET</p>
                        <h2>
                          {item.number === 6
                            ? "Gymnastiksalen och de kvarvarande lokalerna"
                            : titleFor(item)}
                        </h2>
                        <p>
                          {item.number === 6
                            ? "Underlaget gäller avtal med Rydöbruks IF om gymnastiksalen och angränsande utrymmen. Förslaget är att återremissen ska anses besvarad och avtal kunna ingås."
                            : "Punkten finns på dagordningen för kommunfullmäktige den 8 september 2026. Innehållet i bilagorna är sökbart, men någon sammanfattning av sakfrågan eller verifiering av beslut har ännu inte gjorts."}
                        </p>
                        {item.number === 6 && (
                          <>
                            <div className="label">
                              AI-sammanfattning av underlag
                            </div>
                            <h3>Varför är detta viktigt?</h3>
                            <p>
                              Ärendet rör föreningslokalernas fortsatta
                              användning och kommunens ekonomiska åtaganden.
                            </p>
                            <Out href={source?.url || meeting.url}>
                              Tjänsteskrivelse · sidorna 1–2
                            </Out>
                          </>
                        )}
                        <details>
                          <summary>Originalrubrik i dagordningen</summary>
                          <p>{item.title}</p>
                        </details>
                      </div>
                      <div className="sectionhead spaced">
                        <h2>Handlingar bakom frågan</h2>
                        <span>{docset.length} dokument</span>
                      </div>
                      <Documents docs={docset} />
                    </section>
                    <aside className="stack">
                      <section className="panel">
                        <p className="eyebrow">ÄRENDETS TIDSLINJE</p>
                        {item.number === 6 ? (
                          <>
                            <ol className="timeline">
                              {[
                                ["17 okt 2023", "Skola och förskola avvecklas"],
                                [
                                  "3 juni 2025",
                                  "Beslut om rivning och dialog om lokaler",
                                ],
                                [
                                  "2 juni 2026",
                                  "Återremiss för ytterligare beredning",
                                ],
                                [
                                  "18 juni 2026",
                                  "Remissvar från kultur- och folkhälsonämnden",
                                ],
                                [
                                  "8 sep 2026",
                                  "Ärendet finns åter på fullmäktiges dagordning",
                                ],
                              ].map(([date, text]) => (
                                <li key={date}>
                                  <time>{date}</time>
                                  <p>{text}</p>
                                </li>
                              ))}
                            </ol>
                            <p className="small">
                              Historiken återges i tjänsteskrivelsen.
                              Originalprotokollen för äldre steg är ännu inte
                              separat verifierade här.
                            </p>
                            <Out href={source?.url || meeting.url}>
                              Historikkälla · sidorna 1–2
                            </Out>
                          </>
                        ) : (
                          <ol className="timeline">
                            <li>
                              <time>8 september 2026</time>
                              <p>Dagordningspunkt i kommunfullmäktige</p>
                            </li>
                            <li>
                              <time>Nästa kontroll</time>
                              <p>Verifiera mot justerat protokoll</p>
                            </li>
                          </ol>
                        )}
                      </section>
                      <section className="panel">
                        <p className="eyebrow">NÄSTA STEG</p>
                        <h3>Protokollet behöver kontrolleras</h3>
                        <p>
                          Beslut, yrkanden, röster och ansvar kan inte
                          fastställas utifrån dagordningen ensam.
                        </p>
                        <Out href={meeting.url}>Kontrollera originalmötet</Out>
                      </section>
                      <section className="panel">
                        <h3>Något som inte stämmer?</h3>
                        <p>
                          Hjälp till med en källa. Rättelser ska lämna spår.
                        </p>
                        <Correction itemId={item.id} />
                      </section>
                    </aside>
                  </div>
                </>
              ) : (
                <Blank
                  title="Ärendet saknas"
                  text="Det finns ingen importerad post med detta ID."
                />
              ))}
            {view === "ekonomi" && (
              <><div className="columns">
                <section>{money()}</section>
                <aside className="panel">
                  <p className="eyebrow">LÄS SIFFRORNA RÄTT</p>
                  <h2>En kalkyl är inget utfall.</h2>
                  <p>
                    Här visas ekonomin i ett enskilt förslag. Beslutad budget,
                    genomförande och faktiska kostnader är ännu inte
                    verifierade.
                  </p>
                  <p>
                    Beloppen är i kronor eller tusen kronor (tkr). Ingen kostnad
                    per invånare visas utan ett daterat befolkningsunderlag.
                  </p>
                  <a href={"/arenden/" + rydo.id}>
                    Öppna hela ärendet <ArrowRight size={16} />
                  </a>
                </aside>
              </div><MoneyJourney/><ReviewedDecisionStages budget/><MoneyProcurement /></>
            )}
            {view === "orter" && <LocalImpact initialPlace={id} />}
            {view === "data" && (
              <>
                <DataQualityCenter />
                <HistoryEngine />
                <ArchiveCoverage />
                <DataWorkbench />
                <div className="columns">
                  <section className="stack">
                    <div className="panel">
                      <p className="eyebrow">VÅRA PRIMÄRKÄLLOR</p>
                      <div className="sourceitem">
                        <div className="sourceicon">
                          <FileText />
                        </div>
                        <div>
                          <h3>MeetingPlus</h3>
                          <p>Dagordning, bilagor och publiceringsstatus.</p>
                          <Out href={meeting.url}>
                            Kommunfullmäktige 8 september 2026
                          </Out>
                        </div>
                      </div>
                      <div className="sourceitem">
                        <div className="sourceicon">
                          <Link2 />
                        </div>
                        <div>
                          <h3>Hylte kommun</h3>
                          <p>Ingång till nämnder, möten och äldre protokoll.</p>
                          <Out href="https://www.hylte.se/kommun-och-politik/moten-och-protokoll">
                            Möten och protokoll
                          </Out>
                        </div>
                      </div>
                      <div className="sourceitem">
                        <div className="sourceicon">
                          <BookOpen />
                        </div>
                        <div>
                          <h3>Kommunens YouTube-kanal</h3>
                          <p>
                            Källa identifierad. Videoanalys är inte ansluten.
                          </p>
                          <Out href="https://www.youtube.com/@hyltekommun">
                            Öppna kanalen
                          </Out>
                        </div>
                      </div>
                    </div>
                    <div className="panel">
                      <h2>Vad ingår i den här versionen?</h2>
                      <div className="coverage">
                        {[
                          [
                            "Möten",
                            "1 testmöte, kommunfullmäktige 8 september 2026",
                          ],
                          [
                            "Dagordning",
                            items.length + " av 18 punkter registrerade",
                          ],
                          [
                            "Handlingar",
                            data.documents.length +
                              " länkar, " +
                              data.documents.filter(
                                (d) => d.fetchStatus === "ok",
                              ).length +
                              " med importerad text",
                          ],
                          [
                            "Beslut",
                            `${verifiedDecisions.length} beslut från testmötet verifierade mot justerat protokoll, paragraf och PDF-sida. Övriga mötespunkter är inte granskade. Uppföljningen omfattar även äldre uppdrag.`,
                          ],
                          [
                            "Sökning",
                            "Rubriker och PDF-text. Ingen semantisk sökning.",
                          ],
                          [
                            "Video",
                            "Ingen transkribering eller talaridentifiering ännu",
                          ],
                          [
                            "Automatisk uppdatering",
                            `Senaste lyckade MeetingPlus-import: ${pretty(data.checkedAt)}. Möteskalendern kontrollerades senast ${pretty(data.upcomingCheckedAt)}. Senaste lyckade kommunarkivimport: ${pretty(protocolArchive.checkedAt)} (${protocolArchive.summary.verifiedProtocols} verifierade protokoll från ${protocolArchive.summary.bodiesWithVerifiedProtocols} organ; ${protocolArchive.summary.manualReviewFiles} filer väntar på manuell granskning). Schemalagd bevakning redovisas separat; en genomförd körning innebär inte att nya handlingar finns.`,
                          ],
                          [
                            "Övriga källor",
                            "Endast Hylte kommuns frågor. Fristående beslut från andra kommuner är undantagna.",
                          ],
                        ].map(([k, v]) => (
                          <div key={k}>
                            <strong>{k}</strong>
                            <span>{v}</span>
                          </div>
                        ))}
                      </div>
                      <a className="primary" href="/api/catalog?download=1">
                        <Download size={17} />
                        Hämta källregister som JSON
                      </a>
                    </div>
                    <div className="panel">
                      <h2>Källversioner & rättelser</h2>
                      <p>
                        Dokumentens SHA-256-avtryck och hämtningstid sparas. En
                        ändrad källa ger en ny version, inte ett nytt verifierat
                        beslut.
                      </p>
                      <p>
                        {data.versions?.length || 0} sparade källversioner i
                        databasen.
                      </p>
                      {data.corrections?.length ? (
                        data.corrections.map((c) => (
                          <div className="docrow" key={c.id}>
                            <div>
                              <strong>Rättad {pretty(c.created_at)}</strong>
                              <p>{c.reason}</p>
                              <p>Tidigare: {c.previous}</p>
                              <p>Ändrat till: {c.replacement}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p>Inga granskade rättelser har publicerats.</p>
                      )}
                    </div>
                  </section>
                  <aside className="stack">
                    <section className="panel">
                      <ShieldCheck size={28} />
                      <h2>
                        Tydlig status.
                        <br />
                        Hela vägen.
                      </h2>
                      <div className="statuslegend">
                        <Badge>FÖRSLAG</Badge>
                        <p>Innehåll ur handlingar inför mötet.</p>
                        <Badge>PRELIMINÄRT</Badge>
                        <p>
                          Uppgifter från genomfört möte som ännu saknar
                          protokollverifiering. Visas bara om en möteskälla har
                          analyserats.
                        </p>
                        <Badge>VERIFIERAT BESLUT</Badge>
                        <p>
                          Kontrollerat mot justerat protokoll, med dokument och
                          sida.
                        </p>
                      </div>
                      <p>
                        Importerade handlingar kan visas som{" "}
                        <strong>underlag</strong> även när mötet passerat. Det
                        är ingen uppgift om mötets utfall.
                      </p>
                    </section>
                    <section className="panel">
                      <h3>Oberoende från kommunen</h3>
                      <p>
                        Hyltekollen är inte en officiell tjänst från Hylte
                        kommun. AI-sammanfattningar och beräkningar märks
                        separat. Källan kan alltid öppnas.
                      </p>
                      <p>
                        Inga partier eller politiker jämförs, rankas eller
                        betygsätts. Uppgifter presenteras som fristående
                        källbelagda poster.
                      </p>
                    </section>
                  </aside>
                </div>
              </>
            )}
            {view === "dokument" && doc && (
              <div>
                <SourceReader document={doc} />
                <aside className="panel docdetails">
                  <p className="eyebrow">KÄLLKORT</p>
                  <h3>{doc.title}</h3>
                  <dl>
                    <dt>Hämtad</dt>
                    <dd>{pretty(doc.checkedAt)}</dd>
                    <dt>Möte</dt>
                    <dd>{doc.meetingDate ? `${doc.body || "Kommunfullmäktige"} ${doc.meetingDate}` : "Kommunfullmäktige 8 september 2026"}</dd>
                    <dt>Källtyp</dt>
                    <dd>{doc.kind === "historical_protocol" ? "Justerat protokoll i Hylte kommuns protokollarkiv" : "Offentligt dokument i MeetingPlus"}</dd>
                    <dt>SHA-256</dt>
                    <dd className="hash">
                      {doc.sha256 || "Saknas – hämtningen misslyckades"}
                    </dd>
                  </dl>
                  <Out href={doc.url}>Originaldokument</Out>
                  <a className="out" href={"/api/original/" + doc.id}>
                    <Download size={16} />
                    Ladda ner original-PDF
                  </a>
                  {doc.itemId && <a className="out" href={"/arenden/" + doc.itemId}>
                    Till ärendet <ArrowRight size={16} />
                  </a>}
                </aside>
              </div>
            )}
            {view === "nyhetsbrev" && (
              <div className="columns">
                <section className="panel newsletter">
                  <Badge>UTKAST · EJ PUBLICERAT</Badge>
                  <h2>
                    Kommunfullmäktige
                    <br />8 september 2026
                  </h2>
                  <p>
                    Dagordningen och handlingarna är inlästa. Ett nyhetsbrev
                    efter mötet kan färdigställas när protokollet har granskats.
                  </p>
                  <h3>I handlingarna</h3>
                  <ul>
                    {items
                      .filter((i) => [6, 7, 10, 15].includes(i.number))
                      .map((i) => (
                        <li key={i.id}>
                          <a href={"/arenden/" + i.id}>
                            {titleFor(i)} <ArrowUpRight size={14} />
                          </a>
                        </li>
                      ))}
                  </ul>
                  <h3>Vad vet vi om besluten?</h3>
                  <p>
                    Inga beslut från mötet är verifierade i Hyltekollen.
                    Förslagen i handlingarna ska inte återges som mötets utfall.
                  </p>
                  <h3>Det följer vi härnäst</h3>
                  <p>
                    Justerat protokoll, beslutens exakta lydelse och
                    dokumenterade uppdrag för nästa steg.
                  </p>
                  <Out href={meeting.url}>
                    Originalkälla: mötet i MeetingPlus
                  </Out>
                  <button
                    className="primary"
                    onClick={() => {
                      const body =
                        "HYLTEKOLLEN – UTKAST, EJ PUBLICERAT\nKommunfullmäktige 8 september 2026\n\n" +
                        items
                          .filter((i) => [6, 7, 10, 15].includes(i.number))
                          .map((i) => titleFor(i))
                          .join("\n") +
                        "\n\nInga beslut verifierade. Protokollgranskning krävs.\nKälla: " +
                        meeting.url;
                      const url = URL.createObjectURL(
                        new Blob([body], { type: "text/plain;charset=utf-8" }),
                      );
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "hyltekollen-nyhetsbrev-utkast.txt";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download size={17} />
                    Hämta utkast
                  </button>
                </section>
                <aside className="panel">
                  <Mail size={28} />
                  <h2>
                    Först granskning.
                    <br />
                    Sedan utskick.
                  </h2>
                  <p>
                    Prenumeration och e-postutskick är inte anslutna i första
                    versionen. Ingen e-postadress samlas in.
                  </p>
                  <p>
                    Utkastet bygger på dagordningen och behöver kompletteras och
                    verifieras före publicering.
                  </p>
                </aside>
              </div>
            )}
            {!known && (
              <Blank
                title="Sidan finns inte"
                text="Använd menyn för att öppna möten, ärenden eller källregistret."
              />
            )}
          </>
        )}
        <footer>
          <div>
            <a href="/" className="brand">
              hylte<span>kollen</span>
              <i />
            </a>
            <p>Kommunpolitiken, utan protokollspråk.</p>
          </div>
          <div>
            <p>Oberoende källregister · Källor och metod öppet redovisade</p>
            <a href="/data">Källor & metod</a>
            <span> · </span>
            <a href="/nyhetsbrev">Nyhetsbrevsutkast</a>
            <p className="small">Senast importerad: {pretty(data.checkedAt)}</p>
          </div>
        </footer>
      </main>
    </>
  );
}
