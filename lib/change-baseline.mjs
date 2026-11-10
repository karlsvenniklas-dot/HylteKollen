export const baselineKey = 'hyltekollen-source-baseline-v1';
export function snapshot(records, motions, savedAt, decisionReviews) {
  return {version:1, savedAt, documents:Object.fromEntries(records.map(r=>[r.id,r.sha256])), reviews:motions.map(m=>m.id), ...(decisionReviews?{decisionReviews}:{})};
}
export function parseBaseline(raw) {
  if (!raw) return null;
  const b=JSON.parse(raw);
  if(b.version!==1 || typeof b.savedAt!=='string' || !Number.isFinite(Date.parse(b.savedAt)) || !b.documents || typeof b.documents!=='object' || Array.isArray(b.documents) || !Object.values(b.documents).every(v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v)) || !Array.isArray(b.reviews) || !b.reviews.every(v=>typeof v==='string')) throw new Error('Invalid baseline');
  if(b.decisionReviews!==undefined&&(!b.decisionReviews||typeof b.decisionReviews!=='object'||Array.isArray(b.decisionReviews)||!Object.values(b.decisionReviews).every(v=>typeof v==='string')))throw new Error('Invalid review baseline');
  return b;
}
export function compareBaseline(records, motions, baseline) {
  if(!baseline) return {added:[], changed:[], reviews:[]};
  return {
    added:records.filter(r=>!Object.hasOwn(baseline.documents,r.id)),
    changed:records.filter(r=>Object.hasOwn(baseline.documents,r.id)&&baseline.documents[r.id]!==r.sha256),
    reviews:motions.filter(m=>!baseline.reviews.includes(m.id))
  };
}
