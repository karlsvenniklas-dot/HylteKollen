import fs from 'node:fs';
import assert from 'node:assert/strict';
const read = path => JSON.parse(fs.readFileSync(new URL('../'+path, import.meta.url)));
const reviewed = read('data/protocol-review-updates.json');
const archive = read('data/municipal-protocol-archive.json');
const ids = new Set();
for (const row of reviewed.records) {
  assert(!ids.has(row.id)); ids.add(row.id);
  const source = archive.records.find(doc => doc.id === row.documentId);
  assert(source && source.status === 'published_verified');
  assert.equal(source.sha256, row.sourceSha256);
  assert(Object.values(source.identityChecks).every(Boolean));
  assert(['proposal','decision'].includes(row.status));
  assert(row.pages.every(page => page > 0 && page <= source.pageCount));
  const text = row.pages.map(page => source.pages[page-1]).join('\n');
  assert(text.includes('§'+row.paragraph));
  assert(text.replace(/\s/g,'').includes(row.docket.replace(/\s/g,'')));
  if (row.status === 'proposal') assert(/förslag|föreslår/i.test(text));
}
const followups = read('data/followups.json');
assert.equal(followups.records.find(row=>row.id==='hylte-tra').status,'closed');
console.log(`PASS: ${ids.size} reviewed summaries with current hashes, exact dockets and pages; tree strategy remains closed`);
