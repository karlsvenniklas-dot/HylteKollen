import original from '@/data/proposal-ledger.json';
import additions from '@/data/reviewed-motion-additions.json';
const legacyOutcomes:Record<string,string>={'motion-2026-ks0076':'Avslaget','motion-2024-ks0207':'Avslaget','motion-2025-ks0190':'Besvarat'};
export const motions=[
 ...original.motions.map(m=>({...m,outcome:legacyOutcomes[m.id]||'Ej klassificerat',reviewedAt:null as string|null,attribution:'Förslagsställare enligt det granskade källregistret'})),
 ...additions.motions.map(m=>({...m,reviewedAt:m.review.date,attribution:'Förslagsställare och partibeteckning enligt KF-protokollets ärendebeskrivning; inte separat signaturgranskning'}))
];
if(new Set(motions.map(m=>m.id)).size!==motions.length)throw new Error('Duplicate motion ID');
export const motionCoverage=`${motions.length} granskade motioner i ett ofullständigt urval. Inte underlag för ranking eller jämförelse av partiers framgång. Besvarat är inte bifall. Genomförande är inte verifierat.`;
export const motionReviewDate=additions.reviewedAt;
export const motionExportRows=()=>motions.map(m=>({motion_id:m.id,title:m.title,docket:m.source.diaryNumber,actors:m.actors.map(a=>`${a.name} (${a.party})`).join(' | '),actor_attribution:m.attribution,outcome:m.outcome,implementation_status:'unknown',decision_date:m.finalDecision?.date||null,decision_text:m.finalDecision?.text||null,document_id:m.finalDecision?.documentId||m.source.documentId,paragraph:m.finalDecision?.paragraph||m.source.paragraph,page:m.finalDecision?.page||m.source.page,source_sha256:m.finalDecision?.sha256||null,reviewed_at:m.reviewedAt,reader_path:`/dokument/${m.finalDecision?.documentId||m.source.documentId}#sida-${m.finalDecision?.page||m.source.page}`}));
