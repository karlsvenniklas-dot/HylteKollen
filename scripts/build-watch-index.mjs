import fs from 'node:fs';
const source=JSON.parse(fs.readFileSync('public/data/protocol-insights.json','utf8'));
const documents={};
for(const p of source.paragraphs){(documents[p.documentId]??=[]).push({paragraph:p.paragraph,page:p.page,topic:p.topic,places:[...new Set([...p.titlePlaces,...p.textPlaces])],docket:p.docket||'',hash:p.sourceSha256});}
fs.writeFileSync('public/data/change-watch-index.json',JSON.stringify({schemaVersion:1,topics:[...new Set(source.paragraphs.map(p=>p.topic))].sort(),places:[...new Set(source.paragraphs.flatMap(p=>[...p.titlePlaces,...p.textPlaces]))].sort(),documents}));
console.log('Watch index:',Object.keys(documents).length,'documents');
