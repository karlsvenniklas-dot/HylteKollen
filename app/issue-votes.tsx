"use client";
import { useState } from "react";
import ledger from "@/data/proposal-ledger.json";

export default function IssueVotes() {
  const votes = ledger.votes.filter(v => v.individualVotes?.length);
  const [selected, setSelected] = useState(votes[0]?.id || "");
  const [party, setParty] = useState("");
  const vote = votes.find(v => v.id === selected);
  const ballots = vote?.individualVotes || [];
  const parties = [...new Set(ballots.map(v => v.party).filter(Boolean))].sort();
  const labels = { yes: "JA", no: "NEJ", abstain: "Avstår" };
  return <section className="panel" id="sakfragor"><p className="eyebrow">VEM TYCKER VAD? · DOKUMENTERADE RÖSTER</p><h2>Se hur ledamöterna röstade i en sakfråga</h2>
    <p>Här visas protokollförda röster, inte en tolkning av partiernas allmänna åsikter. JA och NEJ måste läsas mot den exakta voteringsfrågan.</p>
    <div className="timeline-filters"><label>Välj omröstning<select value={selected} onChange={e => {setSelected(e.target.value); setParty("");}}>{votes.map(v => <option key={v.id} value={v.id}>{v.source.date} · {v.source.diaryNumber} · §{v.source.paragraph}</option>)}</select></label><label>Partibeteckning i protokollet<select value={party} onChange={e => setParty(e.target.value)}><option value="">Alla i källan</option>{parties.map(p => <option key={p} value={p!}>{p}</option>)}<option value="unknown">Partibeteckning saknas</option></select></label></div>
    {vote ? <><h3>{ledger.motions.find(m => m.source.diaryNumber === vote.source.diaryNumber)?.title || vote.source.diaryNumber}</h3><p><strong>Voteringsfråga:</strong> {vote.question}</p><p className="notice">Endast {votes.length} omröstning har individröster i detta register. En persons partibeteckning fylls inte i från andra källor. Gruppsummeringarna nedan är beräknade från de synliga protokollraderna, inte en gemensam partiståndpunkt.</p>
    <div className="grid3">{[...parties, null].filter(p => !party || (p || "unknown") === party).map(p => {const rows = ballots.filter(b => b.party === p); return <article className="panel" key={p || "unknown"}><h3>{p || "Partibeteckning saknas"}</h3><p>{Object.entries(labels).map(([key, label]) => `${label}: ${rows.filter(b => b.choice === key).length}`).join(" · ")}</p><ul>{rows.map(b => <li key={b.name}>{b.name}: <strong>{labels[b.choice as keyof typeof labels]}</strong></li>)}</ul></article>;})}</div>
    <a className="out" href={`/dokument/${vote.source.documentId}#sida-${vote.individualPageRange?.[0] || vote.source.page}`}>Justerat {vote.source.body}-protokoll {vote.source.date}, §{vote.source.paragraph}, PDF sidorna {vote.individualPageRange?.join("–") || vote.source.page}</a></> : <p>Inga granskade individröster finns i registret.</p>}
  </section>;
}
