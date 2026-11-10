import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const archive=read('data/historical-protocol-archive-index.json');
const corpus=read('public/data/protocol-search-corpus.json');
const highlights=read('data/latest-protocol-highlights.json');
assert.equal(new Set(archive.records.map(r=>r.id)).size,archive.records.length);
for(const r of archive.records){
 const doc=read(`public/data/protocols/${r.id}.json`);
 assert.equal(doc.sha256,r.sha256);
 assert.equal(doc.pages.length,r.pageCount);
 assert(corpus.records.some(c=>c.id===r.id&&c.sha256===r.sha256));
}
const doc=read(`public/data/protocols/${highlights.documentId}.json`);
assert.equal(doc.sha256,highlights.sourceSha256);
for(const h of highlights.highlights)assert(doc.pages[h.page-1].includes('§'+h.paragraph));
assert.equal(read('data/followups.json').records.find(r=>r.id==='hylte-tra').status,'closed');
console.log(JSON.stringify({passed:true,documentReaders:archive.records.length,sourceHighlights:highlights.highlights.length}));
