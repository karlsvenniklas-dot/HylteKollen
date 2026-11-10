"use client";

import { useEffect, useMemo, useState } from "react";
import catalog from "@/data/public-catalog.json";
import followups from "@/data/followups.json";
import network from "@/data/document-network.json";
import { Bell, BookmarkPlus, MapPin, Trash2 } from "lucide-react";

type WatchState = { places: string[]; topics: string[]; dockets: string[] };
const empty: WatchState = { places: [], topics: [], dockets: [] };
const storageKey = "hyltekollen:watch-state:v1";
const meeting = catalog.meetings[0];

export default function PersonalWatchlist() {
  const [watch, setWatch] = useState<WatchState>(empty);
  useEffect(() => { try { const stored = JSON.parse(localStorage.getItem(storageKey) || "null"); if (stored) setWatch({ places: stored.places || [], topics: stored.topics || [], dockets: stored.dockets || [] }); } catch {} }, []);
  function save(next: WatchState) { setWatch(next); try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {} }
  function add(kind: keyof WatchState, value: string) { if (!value || watch[kind].includes(value)) return; save({ ...watch, [kind]: [...watch[kind], value] }); }
  function remove(kind: keyof WatchState, value: string) { save({ ...watch, [kind]: watch[kind].filter((entry) => entry !== value) }); }
  const places = [...new Set(meeting.items.map((item) => item.location))].sort();
  const topics = [...new Set(meeting.items.map((item) => item.topic))].sort();
  const matches = useMemo(() => meeting.items.filter((item) => watch.places.includes(item.location) || watch.topics.includes(item.topic) || network.dockets.some((docket) => watch.dockets.includes(docket.label) && docket.itemLinks.some((link) => link.itemId === item.id))), [watch]);
  const chips = (["places", "topics", "dockets"] as const).flatMap((kind) => watch[kind].map((value) => ({ kind, value })));
  return <div className="personal-watch"><section className="panel quality-hero"><div><p className="eyebrow">MIN BEVAKNING · SPARAS PÅ DEN HÄR ENHETEN</p><h2>Följ ort, ämne eller diarienummer</h2><p>Valen sparas bara i webbläsaren. Inga automatiska mejl, nyhetsbrev eller meddelanden skickas.</p></div><Bell size={38}/></section><section className="panel watch-builder"><div><label>Ort<select defaultValue="" onChange={(event) => { add("places", event.target.value); event.target.value = ""; }}><option value="">Välj ort</option>{places.map((value) => <option key={value}>{value}</option>)}</select></label><label>Ämne<select defaultValue="" onChange={(event) => { add("topics", event.target.value); event.target.value = ""; }}><option value="">Välj ämne</option>{topics.map((value) => <option key={value}>{value}</option>)}</select></label><label>Diarienummer<select defaultValue="" onChange={(event) => { add("dockets", event.target.value); event.target.value = ""; }}><option value="">Välj diarienummer</option>{network.dockets.map((row) => <option key={row.id}>{row.label}</option>)}</select></label></div><div className="watch-chips">{chips.map(({ kind, value }) => <button type="button" key={`${kind}-${value}`} onClick={() => remove(kind, value)}>{value}<Trash2 size={13}/></button>)}{!chips.length && <span>Ingen bevakning vald ännu.</span>}</div></section><section className="panel"><div className="sectionhead"><h2>Träffar i aktuell import</h2><span>{matches.length} ärenden</span></div><div className="watch-results">{matches.map((item) => <a href={`/arenden/${item.id}`} key={item.id}><MapPin size={17}/><span><strong>Punkt {item.number}: {item.title}</strong><small>{item.location} · {item.topic}</small></span></a>)}{!matches.length && <div className="blank"><BookmarkPlus size={24}/><h3>Välj något att följa</h3><p>Träfflistan visar bara den nu importerade källmängden. Avsaknad av träff betyder inte att inget har hänt.</p></div>}</div>{watch.dockets.length > 0 && <p className="small">Uppföljningsposter med valda diarienummer: {followups.records.filter((row) => watch.dockets.includes(row.docket)).length}. Öppna <a href="/uppfoljning">Uppföljning</a> för källstatus.</p>}</section></div>;
}
