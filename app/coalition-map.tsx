"use client";

import { ArrowRight, FileCheck2, GitCompareArrows, Info, Network, Users } from "lucide-react";

type Position = { label: string; parties: string[]; people: string };
type Event = { date: string; body: string; title: string; result: string; source: string; positions: Position[] };

const colors: Record<string, string> = { S: "#d94a52", C: "#4d9a55", M: "#4b78b6", SD: "#b78a08", KV: "#6e5f9f" };

const events: Event[] = [
  {
    date: "28 april 2026", body: "Kommunstyrelsens arbetsutskott", title: "Rydö skola: ändrat grundförslag",
    result: "Arbetsutskottet beslutade enligt det gemensamt stödda, ändrade förslaget.", source: "8f87f06cc163b12dcab1afb3",
    positions: [{ label: "Bifall till samma ändrade förslag", parties: ["S", "SD", "KV"], people: "Ronny Löfquist, Stina Isaksson och Tommy Edenholm" }],
  },
  {
    date: "12 maj 2026", body: "Kommunstyrelsen", title: "Rydö skola: villkor om fler föreningar",
    result: "Grundförslaget bifölls. Tilläggsyrkandet avslogs efter omröstning.", source: "df7087178c3b276169587303",
    positions: [
      { label: "Bifall till arbetsutskottets grundförslag", parties: ["S", "KV"], people: "Ronny Löfquist och Tommy Edenholm" },
      { label: "Bifall till tillägg om tillgång för fler", parties: ["C", "SD"], people: "Håkan Bengtsson och Stina Isaksson" },
    ],
  },
  {
    date: "2 juni 2026", body: "Kommunfullmäktige", title: "Rydö skola: avgöra eller återremittera",
    result: "20 röstade för avgörande och 17 för återremiss. Ärendet återremitterades genom minoritetsåterremiss.", source: "886542ee665e2bfe8118b6dd",
    positions: [
      { label: "Bifall till kommunstyrelsens förslag", parties: ["S", "KV"], people: "Ronny Löfquist, Hanna Kjellin och Tommy Edenholm" },
      { label: "Bifall till återremissyrkandet", parties: ["C", "M", "SD"], people: "Håkan Bengtsson, Bo-Gunnar Åkesson och Mats Gustafsson" },
    ],
  },
];

const pairCounts = new Map<string, number>();
for (const event of events) for (const position of event.positions) {
  for (let left = 0; left < position.parties.length; left++) for (let right = left + 1; right < position.parties.length; right++) {
    const key = [position.parties[left], position.parties[right]].sort().join("+");
    pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
  }
}
const pairs = [...pairCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

function Party({ name }: { name: string }) {
  return <span className="party-node" style={{ borderColor: colors[name], color: colors[name] }}>{name}</span>;
}

export default function CoalitionMap() {
  return (
    <div className="stack gap24">
      <section className="panel coalition-hero">
        <div><p className="eyebrow">KOALITIONSKARTAN · DOKUMENTERADE POSITIONER</p><h2>När partiföreträdare står på samma sida</h2><p>Kartan visar gemensamma, uttryckliga yrkanden i justerade Hylte-protokoll. Den visar inte permanenta block och tillskriver aldrig ett helt parti en ståndpunkt utan stöd i källan.</p></div>
        <Network size={38} aria-hidden="true"/>
      </section>

      <section className="columns coalition-summary">
        <article className="panel">
          <div className="sectionhead"><h2>Återkommande kopplingar i urvalet</h2><GitCompareArrows size={22}/></div>
          <div className="pair-list">
            {pairs.map(([key, count]) => { const [a,b] = key.split("+"); return <div key={key}><div className="pair-nodes"><Party name={a}/><i/><Party name={b}/></div><strong>{count} {count === 1 ? "dokumenterat tillfälle" : "dokumenterade tillfällen"}</strong></div>; })}
          </div>
          <p className="small">Urvalet gäller tre behandlingar av samma ärende. Det ska inte användas som en generell rangordning av partisamarbeten.</p>
        </article>
        <aside className="panel coalition-scope"><Users size={24}/><p className="eyebrow">UNDERLAGETS OMFATTNING</p><strong>{events.length}</strong><span>protokollförda behandlingar</span><strong>{new Set(events.flatMap((event) => event.positions.flatMap((position) => position.parties))).size}</strong><span>partibeteckningar i uttryckliga yrkanden</span></aside>
      </section>

      <section className="panel">
        <div className="sectionhead"><h2>Ärendet över tid</h2><span>Rydö skola · 2026</span></div>
        <div className="coalition-timeline">
          {events.map((event) => (
            <article key={event.date} className="coalition-event">
              <div className="coalition-date"><time>{event.date}</time><span>{event.body}</span></div>
              <div className="coalition-card">
                <h3>{event.title}</h3>
                {event.positions.map((position) => <div className="position" key={position.label}><div className="position-parties">{position.parties.map((party) => <Party key={party} name={party}/>)}</div><div><strong>{position.label}</strong><p>{position.people}</p></div></div>)}
                <p className="coalition-result"><FileCheck2 size={17}/>{event.result}</p>
                <a className="out" href={`/dokument/${event.source}`}>Läs det justerade protokollet <ArrowRight size={14}/></a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="notice"><Info size={18}/><div><strong>Så ska kartan läsas</strong><br/>”På samma sida” betyder här att namngivna företrädare uttryckligen har stött samma yrkande. Frånvaro från en position betyder inte att ett parti var emot.</div></section>
    </div>
  );
}
