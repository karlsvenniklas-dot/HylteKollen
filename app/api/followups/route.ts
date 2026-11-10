import seed from '@/data/followups.json';
import {database} from '@/lib/catalog';
export async function GET(req:Request){
 const headers={'Cache-Control':'no-store',...(new URL(req.url).searchParams.has('download')?{'Content-Disposition':'attachment; filename="hylte-uppfoljning.json"'}:{})};
 try{
  const db=database();const statements:D1PreparedStatement[]=[];
  for(const r of seed.records){
   const payload=JSON.stringify(r);
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload)))).map(b=>b.toString(16).padStart(2,'0')).join('');
   statements.push(db.prepare('INSERT INTO tracked_assignments(id,docket,title,status,evidence_as_of,source_hash,payload) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET docket=excluded.docket,title=excluded.title,status=excluded.status,evidence_as_of=excluded.evidence_as_of,source_hash=excluded.source_hash,payload=excluded.payload WHERE source_hash<>excluded.source_hash').bind(r.id,r.docket,r.title,r.status,r.evidenceAsOf,hash,payload));
   statements.push(db.prepare('INSERT OR IGNORE INTO source_versions(id,source_id,hash,observed_at,content) VALUES(?,?,?,?,?)').bind(r.id+':'+hash,r.id,hash,seed.checkedAt,payload));
  }
  for(const [id,s] of Object.entries(seed.sources))statements.push(db.prepare('INSERT OR IGNORE INTO source_versions(id,source_id,hash,observed_at,content) VALUES(?,?,?,?,?)').bind('followup-source:'+id+':'+s.sha256,'followup-source:'+id,s.sha256,seed.checkedAt,JSON.stringify(s)));
  await db.batch(statements);
  return Response.json({...seed,storageError:false},{headers});
 }catch(e){console.error('Followup import unavailable',e);return Response.json({...seed,storageError:true},{headers})}
}
