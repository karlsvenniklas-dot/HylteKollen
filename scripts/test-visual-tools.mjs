import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {paragraphDiff} from '../lib/page-diff.mjs';
import {coverageCell} from '../lib/coverage-cells.mjs';
const read=name=>JSON.parse(readFileSync('data/'+name+'.json','utf8'));
const archive=read('historical-protocol-archive-index'),catalog=read('catalog'),geo=read('reviewed-geography'),money=read('money-procurement');
const diff=paragraphDiff('Alpha\n\nOld\n\nOmega','Alpha\n\nNew\n\nOmega');
assert.deepEqual(diff.blocks.map(b=>b.kind),['unchanged','removed','added','unchanged']);
assert.deepEqual(diff.blocks.filter(b=>b.kind!=='added').map(b=>b.text),['Alpha','Old','Omega']);
assert.deepEqual(diff.blocks.filter(b=>b.kind!=='removed').map(b=>b.text),['Alpha','New','Omega']);
assert.equal(paragraphDiff('','New').blocks[0].kind,'added');
assert.equal(paragraphDiff('Old','').blocks[0].kind,'removed');
assert.equal(paragraphDiff(Array(252).fill('a').join('\n\n'),'b').limited,true);
assert.deepEqual(paragraphDiff('<script>x</script>','<b>x</b>').blocks.map(b=>b.text),['<script>x</script>','<b>x</b>']);
const all=[...catalog.documents,...read('municipal-protocol-archive').records];
for(const r of geo.records){const d=all.find(d=>d.id===r.documentId);assert(d);assert.equal(d.sha256,r.sourceSha256);assert(r.pages.every(p=>p>0&&p<=d.pages.length));assert(r.pages.some(p=>d.pages[p-1].replace(/\s+/g,' ').includes(r.evidence)));}
for(const t of money.moneyTracks)for(const e of t.entries){const d=all.find(d=>d.id===e.source.documentId);assert.equal(d?.sha256,e.source.sha256);assert(e.source.page<=d.pages.length);}
let verified=0,issues=0;for(const b of archive.coverage)for(const year of ['2021','2022','2023','2024','2025','2026'])for(let m=1;m<=12;m++){const c=coverageCell(archive,b.bodyCode,year+'-'+String(m).padStart(2,'0'));verified+=c.records.length;issues+=c.issues.length;}
assert.equal(verified,archive.records.length);assert.equal(issues,archive.issues.length);
assert.equal(coverageCell(archive,'kf','2099-01').records.length,0);
assert(!readFileSync('app/case-chain.tsx','utf8').includes('Nästa kontrollpunkt är ett justerat protokoll'));
console.log(`PASS: exact paragraph diff/reconstruction/limits; ${geo.records.length} geographic evidence quotes and hashes; all money hashes; ${verified} protocols and ${issues} uncertain files in coverage cells.`);
