"use client";
import SinceLastVisit from "@/app/since-last-visit";
import { formatSwedishDate } from "@/lib/date-format";
import {useEffect,useState} from 'react';
import initial from '@/data/public-catalog.json';
import type {Catalog} from '@/lib/types';
import {FileDiff,ArrowUpRight,Clock3,FileSearch,Info} from 'lucide-react';
export default function ChangeWatch(){
 const [data,setData]=useState<Catalog>(initial as unknown as Catalog);
 useEffect(()=>{fetch('/api/catalog').then(r=>{if(!r.ok)throw new Error('catalog');return r.json()}).then((d:any)=>setData(d as Catalog)).catch(()=>{})},[]);
 const m=data.meetings[0]; const changes=data.changes||[];
 return <><SinceLastVisit/><div className="notice"><FileDiff size={18}/><div><strong>Vad ändrades?</strong><br/>Vakten jämför dokumentens SHA-256-avtryck. En ny version skapar en granskningspost; den skriver aldrig själv en tolkning av vad ändringen betyder.</div></div>{changes.length?<div className="changelist">{changes.map(c=><article className="panel" key={c.id}><p className="eyebrow">NY DOKUMENTVERSION · GRANSKNING KRÄVS</p><h2>{c.title}</h2><p>{c.note}</p><p className="small">Upptäckt {formatSwedishDate(c.observedAt)} · tidigare och nytt SHA-256 finns i källregistret.</p><a className="out" href={'/dokument/'+c.documentId}>Öppna nuvarande dokument <ArrowUpRight size={15}/></a></article>)}</div>:<section className="panel emptychange"><FileDiff size={28}/><h2>Inga dokumentändringar upptäckta</h2><p>Det betyder att ingen ny dokumentversion har upptäckts inom den aktuella importen. Det är inte ett påstående om att kommunen inte har fattat eller ändrat några beslut.</p></section>}<section className="panel protocolchange"><Clock3 size={25}/><div><p className="eyebrow">PROTOKOLLJÄMFÖRELSE</p><h2>{m.protocolUrl?'Protokoll finns för granskningsmatchning':'Väntar på justerat protokoll'}</h2><p>{m.protocolUrl?`${m.protocolCandidates?.length||0} rubrikträffar är i granskningskön. En redaktör behöver bekräfta beslutstext och sida innan ”förslag” kan jämföras med ”beslut”.`:'När ett justerat protokoll publiceras skapas kandidatmatchningar mellan dagordning och protokoll. Därefter kan sidan visa den ordagranna skillnaden med båda källorna.'}</p><a href="/beslutskontroll">Öppna beslutskontrollen →</a></div></section><section className="notice"><Info size={18}/>En ändring i ett dokument kan vara rättad formatering, en bilaga eller en materiell ändring. Hyltekollen visar alltid originalkällan innan en sammanfattning publiceras.</section></>;
}
