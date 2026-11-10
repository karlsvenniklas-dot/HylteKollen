import archive from '@/data/historical-protocol-archive-index.json';
import reviewed from '@/data/latest-protocol-highlights.json';
import catalog from '@/data/public-catalog.json';
import updates from '@/data/protocol-review-updates.json';
import { formatSwedishDate } from '@/lib/date-format';

export default function LatestSources() {
  const recent = [...archive.records].sort((a,b)=>b.meetingDate.localeCompare(a.meetingDate)||a.id.localeCompare(b.id)).slice(0,6);
  return <section className="stack" aria-label="Senaste protokoll och granskade beslut">
    <div className="panel"><p className="eyebrow">NY KÄLLGRANSKNING · {updates.reviewedAt}</p><h2>Beslut och förslag från oktober</h2><p>{updates.method}</p>{updates.records.map(row=>{const source=archive.records.find(doc=>doc.id===row.documentId);const current=source?.sha256===row.sourceSha256;return <article key={row.id}><p className="eyebrow">{!current?'Ogranskad efter källändring':row.status==='proposal'?'Förslag – inte slutligt KF-beslut':'Beslut i angivet organ'}</p><h3>{row.label}</h3><p>{current?row.summary:'Underlaget matchar inte den granskade källversionen. Läs originalet; den tidigare sammanfattningen visas inte som aktuell.'}</p><a href={`/dokument/${row.documentId}#sida-${row.pages[0]}`}>{source?.body} · {source?.meetingDate} · §{row.paragraph} · PDF-sida {row.pages.join(', ')}</a><p className="small">Diarienummer: {row.docket} · granskad {updates.reviewedAt}</p></article>})}</div>
    <div className="panel"><p className="eyebrow">SENASTE PROTOKOLL · ALLA ORGAN</p><h2>Det senaste i kommunarkivet</h2><p>Arkivimport: {formatSwedishDate(archive.checkedAt)}. {archive.summary.verifiedProtocols} sökbara protokoll från {archive.summary.bodiesWithVerifiedProtocols} organ. Ett verifierat dokument betyder inte att alla beslut har sammanfattats.</p><div className="doclist">{recent.map(row=><a className="docrow" key={row.id} href={'/dokument/'+row.id}><div><strong>{row.body}</strong><p>{row.meetingDate} · {row.pageCount} sidor · identitetskontrollerat protokoll</p></div></a>)}</div><a href="/historik">Alla protokoll och täckning per organ →</a></div>
    <div className="panel"><p className="eyebrow">GRANSKAD LÄSHJÄLP · {reviewed.meetingDate}</p><h2>{reviewed.title}</h2><p>AI-bearbetat urval, granskat {reviewed.checkedAt}. Originalprotokollet är auktoritativt; beslut gäller det angivna organet.</p>{reviewed.highlights.map(row=><article key={row.id}><h3>{row.label}</h3><p>{row.summary}</p><a href={`/dokument/${reviewed.documentId}#sida-${row.page}`}>{reviewed.body} · §{row.paragraph} · sida {row.page}</a></article>)}</div>
    <p className="small">Senaste fullständiga MeetingPlus-import: {formatSwedishDate(catalog.checkedAt)}. Kalenderkontroll: {formatSwedishDate(catalog.upcomingCheckedAt)}. Schemalagd bevakning är separat från en lyckad import.</p>
  </section>;
}
