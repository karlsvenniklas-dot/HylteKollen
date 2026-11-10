export const watchKey='hyltekollen-change-watch-v1';
export const emptyWatch={topic:'',place:'',docket:''};
export const normalizeDocket=s=>String(s||'').toUpperCase().replace(/\s+/g,'');
export function readWatch(raw){
 if(!raw)return {...emptyWatch};
 const w=JSON.parse(raw);
 if(!w||!['topic','place','docket'].every(k=>typeof w[k]==='string'&&w[k].length<=150))throw new Error('Invalid watch');
 return {topic:w.topic,place:w.place,docket:w.docket};
}
export const activeWatch=w=>Boolean(w.topic||w.place||w.docket.trim());
export function matchingParagraphs(row,watch,index,paragraph){
 if(!index)return [];
 return (index.documents[row.id]||[]).filter(p=>p.hash===row.sha256&&(!paragraph||String(p.paragraph)===String(paragraph))&&(!watch.topic||p.topic===watch.topic)&&(!watch.place||p.places.includes(watch.place))&&(!watch.docket.trim()||normalizeDocket(p.docket)===normalizeDocket(watch.docket)));
}
export function filterChanges(diff,watch,index){
 if(!activeWatch(watch))return diff;
 return {added:diff.added.filter(r=>matchingParagraphs(r,watch,index).length),changed:diff.changed.filter(r=>matchingParagraphs(r,watch,index).length),reviews:diff.reviews.filter(m=>matchingParagraphs({id:m.finalDecision.documentId,sha256:m.finalDecision.sha256},watch,index,m.finalDecision.paragraph).length)};
}
