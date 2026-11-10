"use client";

import { useMemo, useState } from "react";
import glossary from "@/data/protocol-glossary.json";
import { ArrowRight, BookOpen, Check, FileText, Search, ShieldAlert, X } from "lucide-react";

const categoryLabel: Record<string, string> = { process: "Ärendets väg", meeting: "Under mötet", decision: "Beslutsspråk", source: "Källstatus" };

export default function ProtocolInterpreter() {
  const [selectedId, setSelectedId] = useState(glossary.terms[0].id);
  const [query, setQuery] = useState("");
  const visible = useMemo(() => glossary.terms.filter((entry) => `${entry.term} ${entry.short} ${entry.means}`.toLowerCase().includes(query.trim().toLowerCase())), [query]);
  const selected = glossary.terms.find((entry) => entry.id === selectedId) || visible[0] || glossary.terms[0];

  return <div className="protocol-interpreter">
    <section className="panel interpreter-head">
      <div><p className="eyebrow">PROTOKOLLTOLKEN · VANLIG SVENSKA</p><h2>Förstå beslutsspråket</h2><p>Klicka på ett begrepp för att se vad det betyder, vad det inte betyder och hur det används i en verklig Hylte-handling.</p></div><BookOpen size={45}/>
    </section>

    <div className="interpreter-workspace">
      <aside className="panel interpreter-index">
        <label><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sök begrepp…" aria-label="Sök i protokolltolken"/>{query && <button type="button" onClick={() => setQuery("")} aria-label="Rensa sökning"><X size={15}/></button>}</label>
        <div className="interpreter-term-list">
          {visible.map((entry) => <button type="button" key={entry.id} className={entry.id === selected.id ? "active" : ""} onClick={() => setSelectedId(entry.id)}><span>{entry.term}</span><small>{categoryLabel[entry.category]}</small><ArrowRight size={14}/></button>)}
          {!visible.length && <p className="small">Inget begrepp matchar sökningen.</p>}
        </div>
      </aside>

      <section className="panel interpreter-focus" aria-live="polite">
        <div className="interpreter-title"><div><p className="eyebrow">{categoryLabel[selected.category]}</p><h2>{selected.term}</h2><p>{selected.short}</p></div><span>{selected.term.slice(0, 1)}</span></div>
        <div className="meaning-grid">
          <article className="means"><Check size={21}/><div><strong>Det betyder</strong><p>{selected.means}</p></div></article>
          <article className="not-means"><X size={21}/><div><strong>Det betyder inte</strong><p>{selected.notMeans}</p></div></article>
        </div>
        <div className="hylte-example"><p className="eyebrow">EXEMPEL FRÅN HYLTE</p><blockquote>{selected.example}</blockquote><a className="out" href={`/dokument/${selected.documentId}`}>{selected.sourceLabel} <FileText size={14}/></a></div>
        <div className="interpreter-rule"><ShieldAlert size={20}/><p><strong>Hyltekollens regel:</strong> begreppet tolkas alltid tillsammans med vilket organ som fattade beslutet, den exakta beslutstexten och protokollets status.</p></div>
      </section>
    </div>

    <section className="panel process-language"><div><span>Motion eller ärende</span><ArrowRight size={16}/><span>Beredning</span><ArrowRight size={16}/><span>Yrkanden</span><ArrowRight size={16}/><span>Beslut</span><ArrowRight size={16}/><span>Justerat protokoll</span></div><p>Samma ord kan finnas i flera instanser. Ett beslut i en nämnd kan vara ett förslag till kommunfullmäktige.</p></section>
  </div>;
}
