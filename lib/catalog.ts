import raw from '@/data/catalog.json';
import {outsideScope} from '@/lib/scope';
const docs=raw.documents.filter(d=>!outsideScope(d));
const allowed=new Set(docs.map(d=>d.id));
const seed={...raw,documents:docs,meetings:raw.meetings.map(m=>({...m,items:m.items.map(i=>({...i,documentIds:i.documentIds.filter(id=>allowed.has(id))}))}))};
import { env } from 'cloudflare:workers';
export const catalog=seed;
export function database(){const db=(env as unknown as {DB:D1Database}).DB;if(!db)throw new Error('Database unavailable');return db;}
export async function ensureCatalog(){
 const db=database();
 if(await db.prepare('SELECT id FROM imports WHERE id=?').bind(seed.checkedAt).first())return db;
 const statements:D1PreparedStatement[]=[];
 for(const m of seed.meetings){
  statements.push(db.prepare('INSERT INTO meetings(id,title,date,source_url,source_hash,checked_at,protocol_published) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET source_hash=excluded.source_hash,checked_at=excluded.checked_at,protocol_published=excluded.protocol_published').bind(m.id,m.title,m.date,m.url,m.sourceHash,m.checkedAt,m.protocolPublished?1:0));
  statements.push(db.prepare('INSERT OR IGNORE INTO source_versions(id,source_id,hash,observed_at,content) VALUES(?,?,?,?,?)').bind(m.id+':'+m.sourceHash,m.id,m.sourceHash,m.checkedAt,JSON.stringify(m)));
  for(const i of m.items)statements.push(db.prepare('INSERT INTO agenda_items(id,meeting_id,number,title,location,status) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,location=excluded.location').bind(i.id,m.id,i.number,i.title,i.location,i.status));
 }
 for(const d of seed.documents){
  statements.push(db.prepare('INSERT INTO documents(id,item_id,title,url,hash,checked_at,fetch_status) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,hash=excluded.hash,checked_at=excluded.checked_at,fetch_status=excluded.fetch_status').bind(d.id,d.itemId,d.title,d.url,d.sha256,d.checkedAt,d.fetchStatus));
  if(d.sha256)statements.push(db.prepare('INSERT OR IGNORE INTO source_versions(id,source_id,hash,observed_at,content) VALUES(?,?,?,?,?)').bind(d.id+':'+d.sha256,d.id,d.sha256,d.checkedAt,JSON.stringify(d)));
 }
 for(let n=0;n<statements.length;n+=40)await db.batch(statements.slice(n,n+40));
 await db.prepare('INSERT OR IGNORE INTO follow_ups(id,item_id,title,status) VALUES(?,?,?,?)').bind('kf-2026-09-08-protocol','kf-2026-09-08-6','Kontrollera justerat protokoll och fastställ beslut','Inväntar protokoll').run();
 await db.prepare('INSERT OR IGNORE INTO imports(id,completed_at,item_count,document_count) VALUES(?,?,?,?)').bind(seed.checkedAt,new Date().toISOString(),seed.meetings.reduce((n,m)=>n+m.items.length,0),seed.documents.length).run();return db;
}
export function publicCatalog(){return {...seed,documents:seed.documents.map(({pages,...d})=>({...d,pageCount:pages.length}))};}
