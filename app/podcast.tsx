const audioPath='/audio/hylte-2026-v45.m4a';
export default function Podcast(){return <article className="panel" aria-labelledby="podcast-title">
 <p className="eyebrow">HYLTE-PODDEN · VECKA 45 · 2026</p>
 <h2 id="podcast-title">Gigantisk datahall och Natoplaner i Hylte</h2>
 <p>Protokollkollen tisdag 3 november 2026 · Svenska · 25 minuter och 6 sekunder</p>
 <audio controls preload="none" aria-label="Lyssna på Gigantisk datahall och Natoplaner i Hylte" style={{width:'100%',margin:'16px 0'}}>
  <source src={audioPath} type="audio/mp4"/>Din webbläsare saknar stöd för ljudspelaren. Använd länken nedan.
 </audio>
 <p><a className="out" href={audioPath} download="Hylte-v45-2026.m4a">Ladda ner ljudfilen (M4A, cirka 18 MB)</a> · <a href={audioPath}>Öppna ljudfilen separat</a></p>
 <div className="notice"><p><strong>AI-genererad ljudöversikt – inte ett officiellt protokoll.</strong> Svensk ljudöversikt från NotebookLM / Gemini Notebook, enligt avsnittsunderlaget byggd på sju justerade protokoll och nyhetsbrevet. Ljudfilen och innehållsbeskrivningen har tillhandahållits för publicering. Ljudets samtliga påståenden har inte kontrollerats separat mot originalprotokollen.</p></div>
 <h3>Det här tas upp</h3>
 <p>Beslut och förslag hålls åtskilda nedan enligt den tillhandahållna innehållsbeskrivningen. Detta är en kort avsnittsöversikt, inte en transkription eller ett nytt verifierat beslutsregister.</p>
 <h3>Beslut enligt avsnittsunderlaget</h3>
 <ul>
  <li><strong>Kommunfullmäktige 20 oktober:</strong> nytt presidium 2026–2030 med Micael Arnström (S) som ordförande. Delårsrapporten godkändes.</li>
  <li><strong>Samhällsbyggnadsnämnden 21 oktober:</strong> bygglov för datacenter på Västra Åkralt i Hyltebruk.</li>
  <li><strong>Barn- och ungdomsnämnden 20 oktober:</strong> Centrumskolan går upp i Örnaskolan från den 1 januari 2027.</li>
  <li><strong>Kultur- och folkhälsonämnden 22 oktober:</strong> bidrag till föreningar som trygghetsvandrar och avslag på mobil fritidsgård.</li>
 </ul>
 <h3>Förslag – inte slutliga beslut</h3>
 <ul>
  <li><strong>Kommunstyrelsens arbetsutskott 27 oktober:</strong> förslag att fullmäktige antar Ansvar för Hyltes budget och taxorna för 2027. Detta återges som ett förslag, inte som ett slutligt fullmäktigebeslut.</li>
  <li><strong>Samhällsbyggnadsnämnden 21 oktober:</strong> förslag om ny vattentjänstplan.</li>
 </ul>
 <h3>Övrig behandling</h3>
 <p><strong>Omsorgsnämnden 21 oktober och Tillsynsnämnden 20 oktober:</strong> främst svar till revisionen.</p>
 <h3>Källor och läsanvisning</h3>
 <p>Uppgiften om sju justerade protokoll och nyhetsbrevet kommer från avsnittets tillhandahållna källbeskrivning. Exakta protokollslänkar, paragrafer och sidhänvisningar för avsnittets samtliga uppgifter är inte kopplade här. Kontrollera originalprotokollen innan du använder en uppgift som beslutsbelägg. AI-ljud kan innehålla feltolkningar.</p>
 <p><a href="https://www.hylte.se/kommun-och-politik/moten-och-protokoll">Kommunens möten och protokoll</a> · <a href="/historik">Hyltekollens protokollarkiv</a></p>
 <p className="small">Avsnittet publicerat 3 november 2026. Publiceringen uppdaterar inte arkivets importdatum. Ingen automatisk utskickning.</p>
</article>}
