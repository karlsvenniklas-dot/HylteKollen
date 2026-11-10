export function reviewSnapshot(records, archive) {
 const hashes=new Map(archive.map(d=>[d.id,d.sha256]));
 return Object.fromEntries(records.filter(r=>hashes.get(r.documentId)===r.sourceSha256).map(r=>[r.id,JSON.stringify([r.sourceSha256,r.status,r.summary,r.paragraph,r.pages])]));
}
export function reviewChanges(records, archive, saved) {
 if(!saved)return {known:false,added:[],changed:[]};
 const current=reviewSnapshot(records,archive);
 return {known:true,added:records.filter(r=>current[r.id]&&!Object.hasOwn(saved,r.id)),changed:records.filter(r=>current[r.id]&&Object.hasOwn(saved,r.id)&&current[r.id]!==saved[r.id])};
}
