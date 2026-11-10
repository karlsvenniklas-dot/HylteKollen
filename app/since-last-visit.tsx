"use client";
import {useEffect,useState} from 'react';
import updates from '@/data/protocol-review-updates.json';
import {reviewSnapshot,reviewChanges} from '@/lib/review-changes.mjs';
import ShareSelection from './share-selection';
import archive from '@/data/historical-protocol-archive-index.json';
import additions from '@/data/reviewed-motion-additions.json';
import {motions} from '@/lib/motion-register';
import {baselineKey,snapshot,parseBaseline,compareBaseline} from '@/lib/change-baseline.mjs';
import {watchKey,emptyWatch,readWatch,activeWatch,matchingParagraphs,filterChanges} from '@/lib/watch-filters.mjs';
const reviews=motions.filter(m=>m.reviewedAt);
export default function SinceLastVisit(){
 const [baseline,setBaseline]=useState<any>(null),[ready,setReady]=useState(false),[message,setMessage]=useState('');
 const [watch,setWatch]=useState({...emptyWatch}),[index,setIndex]=useState<any>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{
  try{setBaseline(parseBaseline(localStorage.getItem(baselineKey)))}catch{setMessage('Tidigare jämförelsepunkt kunde inte läsas. Spara en ny för att börja jämföra.')}
  try{setWatch(readWatch(localStorage.getItem(watchKey)))}catch{setMessage('Lokala filter kunde inte läsas. Inga filter används.')}
  const params=new URLSearchParams(window.location.search);
  if(params.has('amne')||params.has('ort')||params.has('diarium'))setWatch({topic:(params.get('amne')||'').slice(0,150),place:(params.get('ort')||'').slice(0,150),docket:(params.get('diarium')||'').slice(0,150)});
  setReady(true);
 },[]);
 useEffect(()=>{let current=true;setError('');fetch('/data/change-watch-index.json').then(r=>{if(!r.ok)throw Error();return r.json()}).then(x=>{if(x.schemaVersion!==1||!x.documents||!Array.isArray(x.topics)||!Array.isArray(x.places))throw Error();if(current)setIndex(x)}).catch(()=>{if(current)setError('Filterunderlaget kunde inte hämtas. Detta betyder inte att träffar saknas.');});return()=>{current=false}},[retry]);
 useEffect(()=>{if(!ready)return;const url=new URL(window.location.href);url.searchParams.set('amne',watch.topic);url.searchParams.set('ort',watch.place);url.searchParams.set('diarium',watch.docket);window.history.replaceState(window.history.state,'',url);},[ready,watch]);
 const diff=compareBaseline(archive.records,reviews,baseline);
 const reviewDiff=reviewChanges(updates.records,archive.records,baseline?.decisionReviews);
 const active=activeWatch(watch),available=!active||!!index;
 const shown=filterChanges(diff,watch,index);
 const recent=[...archive.records].filter(r=>!active||matchingParagraphs(r,watch,index).length).sort((a,b)=>b.meetingDate.localeCompare(a.meetingDate)).slice(0,6);
 const covered=index?archive.records.filter(r=>(index.documents[r.id]||[]).some((p:any)=>p.hash===r.sha256)).length:0;
 function save(){if(baseline&&!window.confirm('Ersätt jämförelsepunkten? Alla räknare återställs även utanför valda filter.'))return;try{const next=snapshot(archive.records,reviews,new Date().toISOString(),reviewSnapshot(updates.records,archive.records));localStorage.setItem(baselineKey,JSON.stringify(next));setBaseline(next);setMessage('Jämförelsepunkten för hela arkivet är sparad i den här webbläsaren. Inget har skickats.')}catch{setMessage('Kunde inte spara lokalt. Jämförelsepunkten har inte ändrats.')}}
 function saveFilters(){try{localStorage.setItem(watchKey,JSON.stringify(watch));setMessage('Filtren är sparade endast i denna webbläsare. Jämförelsepunkten är oförändrad.')}catch{setMessage('Filtren används nu men kunde inte sparas till nästa besök.')}}
 function clearFilters(){setWatch({...emptyWatch});try{localStorage.removeItem(watchKey);setMessage('Filtren är rensade. Jämförelsepunkten är oförändrad.')}catch{setMessage('Filtren är nollställda här men kunde inte tas bort från lokal lagring.')}}
 const links=(rows:any[],changed=false)=>rows.map(r=><p key={r.id}><a href={'/dokument/'+r.id}>{r.body} · {r.meetingDate}</a>{changed?' – källhashen skiljer sig. Det visar inte vad som ändrats i sak.':''}</p>);
 return <section className="panel" aria-label="Sedan din sparade jämförelse">
  <p className="eyebrow">SEDAN SIST · LOKAL JÄMFÖRELSE</p><h2>Vad är nytt för dig?</h2>
  <ShareSelection/>
  <p>Arkivunderlag kontrollerat {archive.checkedAt.slice(0,10)}. Jämför stabila dokument-ID:n och källhashar – inte mötesdatum. Saknade poster räknas aldrig som borttagna källor.</p>
  <fieldset><legend>Filtrera din förändringsvy</legend>
   <label>Ämne <select value={watch.topic} disabled={!index} onChange={e=>setWatch({...watch,topic:e.target.value})}><option value="">Alla ämnen</option>{watch.topic&&!index?.topics.includes(watch.topic)&&<option>{watch.topic}</option>}{index?.topics.map((t:string)=><option key={t}>{t}</option>)}</select></label>{' '}
   <label>Ortsträff <select value={watch.place} disabled={!index} onChange={e=>setWatch({...watch,place:e.target.value})}><option value="">Alla orter</option>{watch.place&&!index?.places.includes(watch.place)&&<option>{watch.place}</option>}{index?.places.map((p:string)=><option key={p}>{p}</option>)}</select></label>{' '}
   <label>Exakt diarienummer <input value={watch.docket} maxLength={150} placeholder="2025 KS0184" onChange={e=>setWatch({...watch,docket:e.target.value})}/></label>
   <p><button type="button" disabled={!ready} onClick={saveFilters}>Spara mina filter lokalt</button>{' '}<button type="button" disabled={!ready} onClick={clearFilters}>Rensa filter</button></p>
  </fieldset>
  {error?<p role="alert">{error} <button type="button" onClick={()=>setRetry(retry+1)}>Försök igen</button></p>:!index?<p role="status">Hämtar filterunderlag…</p>:<p className="small">Filterunderlag finns för {covered} av {archive.records.length} protokoll med aktuell källhash. Övriga protokoll saknar verifierbar filtertäckning. Ämne bygger på rubrikord; ort är en textträff, inte belägg för lokal påverkan. Valda filter måste matcha samma paragraf. Diarieträffar kan vara hänvisningar, inte nya beslut.</p>}
  {!ready?<p role="status">Läser lokal jämförelsepunkt…</p>:baseline?<>
   <p>Jämförelsepunkt: {new Date(baseline.savedAt).toLocaleString('sv-SE')}, i den här webbläsaren.</p>
   <p>Hela arkivet: {diff.added.length} nytillkomna protokoll · {diff.changed.length} ändrade källversioner · {diff.reviews.length} tillagda motionsgranskningar.</p>
   {available?<>{active&&<p role="status">Matchar dina filter: {shown.added.length} nytillkomna · {shown.changed.length} ändrade · {shown.reviews.length} motionsgranskningar. Saknade träffar utesluter inte relevanta ändringar utanför filterunderlaget.</p>}
    <h3>Nytillkomna protokoll</h3>{shown.added.length?links(shown.added):<p>Inga nytillkomna protokoll i denna vy.</p>}
    <h3>Ändrade dokument – granskning krävs</h3>{shown.changed.length?links(shown.changed,true):<p>Inga ändrade källhashar i denna vy.</p>}
    <h3>Nytillagda motionsgranskningar</h3>{shown.reviews.length?shown.reviews.map((r:any)=><p key={r.id}><a href={'/dokument/'+r.finalDecision.documentId+'#sida-'+r.finalDecision.page}>{r.title}</a> · beslut {r.finalDecision.date}, granskat {r.reviewedAt}.</p>):<p>Inga tillagda motionsgranskningar i denna vy.</p>}
   </>:<p>Den filtrerade jämförelsen visas när filterunderlaget har hämtats. Arkivets totaler ovan påverkas inte.</p>}
  </>:<><p>Ingen tidigare jämförelsepunkt finns. Här visas upp till sex senaste {active?'matchande ':''}mötesdatum, inte vad som är nytt sedan ditt förra besök.</p>{available?recent.length?links(recent):<p>Inga träffar i det tillgängliga filterunderlaget.</p>:<p>Väntar på filterunderlaget.</p>}</>}
  <button type="button" disabled={!ready} onClick={save}>Spara hela arkivets läge som jämförelsepunkt</button><p role="status">{message}</p>
  <p className="small">Sparandet återställer alla räknare, även utanför valda filter. Filter och jämförelsepunkt stannar på denna enhet/webbläsare och kan försvinna om webbplatsdata rensas. Inga utskick eller notifieringar görs. Detta är inte en fullständig kommunal förändringslogg.</p>
  <h3>Besluts- och förslagsgranskningar sedan jämförelsepunkten</h3>
  <p>Separat, ofiltrerat granskningsregister. En nytillagd granskning är inte ett nyfattat kommunalt beslut. Endast underlag med aktuell granskad källhash visas.</p>
  {!reviewDiff.known?<p>Din jämförelsepunkt saknar denna del. Nästa gång du sparar arkivets läge börjar även jämförelsen av besluts- och förslagsgranskningar. Tidigare poster räknas inte som nya.</p>:<><p>{reviewDiff.added.length} tillagda · {reviewDiff.changed.length} ändrade granskningar.</p>{[...reviewDiff.added,...reviewDiff.changed].map(r=><p key={r.id}><strong>{r.status==='proposal'?'Förslag':'Beslut i angivet organ'}:</strong> {r.label} · <a href={'/dokument/'+r.documentId+'#sida-'+r.pages[0]}>§{r.paragraph}, PDF s. {r.pages.join(', ')}</a> · granskning {updates.reviewedAt}.</p>)}</>}
  <h3>Senast tillagda historiska motionsgranskningar</h3><p>Denna historik filtreras inte. Granskade {additions.reviewedAt}; besluten fattades 3 mars 2026. De är inte nya kommunala beslut.</p>
  {reviews.map(m=><p key={m.id}><a href={'/dokument/'+m.finalDecision.documentId+'#sida-'+m.finalDecision.page}>{m.title} · §{m.finalDecision.paragraph}, sida {m.finalDecision.page}</a> – {m.outcome}</p>)}
  <a href="/statistik#partitidslinje">Visa motionerna i tidslinjen →</a><h3>Behöver klarläggas</h3>{additions.reviewQueue.map(r=><p key={r.id}>{r.diaryNumber}: {r.reason} <a href={'/dokument/'+r.documentId+'#sida-'+r.pages[0]}>§{r.paragraph}, sidor {r.pages.join('–')}</a></p>)}
 </section>;
}
