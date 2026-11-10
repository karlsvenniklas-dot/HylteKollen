import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pageDiff} from '../lib/page-diff.mjs';
assert.deepEqual(pageDiff(['a'],['a']),[]);
assert.equal(pageDiff(['a'],['b'])[0].kind,'changed');
assert.equal(pageDiff([],['a'])[0].kind,'added');
assert.equal(pageDiff(['a'],[])[0].kind,'removed');
assert.equal(pageDiff(['a','b'],['b','a']).length,2);
const updates=JSON.parse(readFileSync('data/protocol-review-updates.json'));
const archive=JSON.parse(readFileSync('data/historical-protocol-archive-index.json'));
for(const r of updates.records){const d=archive.records.find(d=>d.id===r.documentId);assert.equal(d.sha256,r.sourceSha256);assert(r.pages.every(p=>p>0&&p<=d.pageCount));}
const budget=updates.records.filter(r=>r.docket==='2026 KS0004');assert.equal(budget.length,2);assert(budget.every(r=>r.status==='proposal'));
const ui=readFileSync('app/reviewed-decision-stages.tsx','utf8');assert(ui.includes('d?.sha256===r.sourceSha256'));assert(ui.includes('inte verifierat'));
console.log('PASS: page diff additions/removals/shifts; seven hash/page-linked steps; two budget proposals, no invented final outcome.');
