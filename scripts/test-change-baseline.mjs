import assert from 'node:assert/strict';
import fs from 'node:fs';
import {snapshot,parseBaseline,compareBaseline} from '../lib/change-baseline.mjs';
const h='a'.repeat(64),h2='b'.repeat(64);
const base=snapshot([{id:'a',sha256:h},{id:'missing',sha256:h}], [{id:'old'}], '2026-10-31T12:00:00Z');
assert.deepEqual(parseBaseline(JSON.stringify(base)),base);
assert.equal(parseBaseline(null),null);
assert.throws(()=>parseBaseline('{}'));
const diff=compareBaseline([{id:'a',sha256:h2},{id:'new',sha256:h}],[{id:'old'},{id:'new-review'}],base);
assert.deepEqual(diff.added.map(x=>x.id),['new']);
assert.deepEqual(diff.changed.map(x=>x.id),['a']);
assert.deepEqual(diff.reviews.map(x=>x.id),['new-review']);
assert.deepEqual(compareBaseline([],[],base),{added:[],changed:[],reviews:[]});
assert.deepEqual(compareBaseline([{id:'a',sha256:h}],[],null),{added:[],changed:[],reviews:[]});
const additions=JSON.parse(fs.readFileSync(new URL('../data/reviewed-motion-additions.json',import.meta.url)));
for(const m of additions.motions){
 const d=JSON.parse(fs.readFileSync(new URL('../public/data/protocols/'+m.finalDecision.documentId+'.json',import.meta.url)));
 assert.equal(d.sha256,m.finalDecision.sha256);
 assert.equal(d.meetingDate,m.finalDecision.date);
 const page=d.pages[m.finalDecision.page-1];
 assert.ok(page.includes(m.source.diaryNumber));
 assert.ok(page.includes('§'+m.finalDecision.paragraph));
 assert.ok(d.pages[m.review.adjustmentPage-1].includes('Paragrafen är justerad'));
 for(const actor of m.actors)assert.ok(page.includes(actor.name+' ('+actor.party+')'));
 assert.ok(m.outcome==='Besvarat'?page.includes('är besvarad'):page.includes('ska avslås'));
}
console.log('PASS: baseline, new/changed/review separation, missing records preserved; 2 source-verified motion additions');
