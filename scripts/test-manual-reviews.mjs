import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p));
const reviews=read('data/protocol-manual-reviews.json');
const archive=read('data/municipal-protocol-archive.json');
assert.equal(reviews.records.length,35);
assert.equal(new Set(reviews.records.map(r=>r.sourceFileId)).size,35);
assert.equal(reviews.records.filter(r=>r.status==='identity_verified').length,31);
for(const r of reviews.records){
 const full=read('public/data/protocol-reviews/'+r.id+'.json');
 assert.equal(full.sha256,r.sha256);assert(full.pages.length===r.pageCount);
 assert(r.identityEvidence.page===1);assert(r.history.length>=2);
 if(r.status==='identity_verified'){
   const verified=archive.records.find(doc=>doc.id===r.verifiedDocumentId);
   assert(verified);assert.equal(verified.sha256,r.sha256);
   assert(verified.manualIdentityReview);assert(Object.values(verified.identityChecks).every(Boolean));
 }else{
   assert(r.observedMeetingDate!==r.meetingDate);
   assert(!archive.records.some(doc=>doc.sourceFileId===r.sourceFileId));
 }
 if(r.ocrApplied)assert(r.textStatus.includes('ej korrekturläst'));
}
const route=fs.readFileSync('app/api/original/[id]/route.ts','utf8');
assert(route.includes("searchParams.get('inline')"));assert(route.includes("crypto.subtle.digest('SHA-256'"));assert(route.includes('status:409'));
console.log('PASS: 35 reviewed source identities; 31 verified; four date conflicts excluded; OCR caveat and PDF hash guard');
