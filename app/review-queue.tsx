"use client";

import { FormEvent, useState } from "react";
import catalog from "@/data/public-catalog.json";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, ExternalLink, FileSearch, LockKeyhole, Send, ShieldCheck } from "lucide-react";

const categories = [
  "Kontrollera ett beslut",
  "Kontrollera en siffra eller kostnad",
  "Dokument eller bilaga saknas",
  "Följ upp ett äldre uppdrag",
  "Möjlig rättelse i Hyltekollen",
];

export default function ReviewQueue() {
  const items = catalog.meetings.flatMap((meeting) => meeting.items);
  const [itemId, setItemId] = useState(items.find((item) => item.number === 6)?.id || items[0].id);
  const [category, setCategory] = useState(categories[0]);
  const [sourceUrl, setSourceUrl] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("");
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setStatus(""); setNeedsSignIn(false);
    const message = [`Typ: ${category}`, sourceUrl.trim() ? `Källa: ${sourceUrl.trim()}` : "Källa: inte angiven", `Motivering: ${reason.trim()}`].join("\n");
    try {
      const response = await fetch("/api/corrections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId, message }) });
      const result = await response.json() as { error?: string };
      if (response.status === 401) { setNeedsSignIn(true); setStatus("Logga in med ChatGPT för att skicka tipset."); return; }
      if (!response.ok) { setStatus(result.error || "Tipset kunde inte sparas. Försök igen."); return; }
      setStatus("Tipset är sparat i granskningskön. Inget har publicerats eller ändrats automatiskt.");
      setReason(""); setSourceUrl("");
    } catch { setStatus("Tipset kunde inte sparas. Din text finns kvar — försök igen."); }
    finally { setBusy(false); }
  }

  return <div className="review-queue">
    <section className="panel review-head"><div><p className="eyebrow">ÖPPEN GRANSKNINGSKÖ</p><h2>Tipsa om något som bör kontrolleras</h2><p>Koppla tipset till ett importerat Hylte-ärende och berätta vad som behöver granskas. Tipset går till en privat kö och syns inte på webbplatsen.</p></div><FileSearch size={38}/></section>
    <div className="review-layout">
      <form className="panel review-form" onSubmit={submit}>
        <label htmlFor="review-item">Ärende</label>
        <Select value={itemId} onValueChange={setItemId}><SelectTrigger id="review-item" aria-label="Välj ärende"><SelectValue/></SelectTrigger><SelectContent>{items.map((item) => <SelectItem value={item.id} key={item.id}>Punkt {item.number}: {item.title}</SelectItem>)}</SelectContent></Select>
        <label htmlFor="review-category">Vad vill du att vi kontrollerar?</label>
        <Select value={category} onValueChange={setCategory}><SelectTrigger id="review-category" aria-label="Välj typ av granskning"><SelectValue/></SelectTrigger><SelectContent>{categories.map((value) => <SelectItem value={value} key={value}>{value}</SelectItem>)}</SelectContent></Select>
        <label htmlFor="review-source">Källänk <span>valfritt</span></label>
        <input id="review-source" type="url" inputMode="url" placeholder="https://www.hylte.se/…" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} maxLength={600}/>
        <label htmlFor="review-reason">Varför bör detta granskas?</label>
        <textarea id="review-reason" required minLength={10} maxLength={1200} rows={7} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Beskriv den konkreta uppgiften, vad som verkar oklart och var den förekommer."/>
        <button className="primary" disabled={busy || reason.trim().length < 10}>{busy ? "Sparar…" : <><Send size={16}/> Lägg i granskningskön</>}</button>
        <p className="review-result" role="status">{status}</p>
        {needsSignIn && <a className="out" href="/signin-with-chatgpt?return_to=%2Fgranskningsko">Logga in och återvänd <ExternalLink size={14}/></a>}
      </form>
      <aside className="review-policy">
        <section className="panel"><ShieldCheck size={25}/><h3>Så behandlas tipset</h3><ol><li>Tipset sparas privat.</li><li>Källan och påståendet kontrolleras.</li><li>Eventuell rättelse får källhänvisning och historik.</li></ol></section>
        <section className="panel"><LockKeyhole size={25}/><h3>Detta händer inte automatiskt</h3><ul><li>Tipset publiceras inte.</li><li>Ett beslut ändras inte.</li><li>Ingen politiker eller tredje part kontaktas.</li><li>Inget nyhetsbrev skickas.</li></ul></section>
        <section className="notice"><CheckCircle2 size={18}/><div><strong>Bra tips är konkreta</strong><br/>Ange gärna dokument, sida, diarienummer, datum och exakt formulering.</div></section>
      </aside>
    </div>
  </div>;
}
