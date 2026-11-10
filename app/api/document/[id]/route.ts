import {catalog} from '@/lib/catalog';
import historicalProtocols from '@/data/historical-protocols.json';
import archiveIndex from '@/data/historical-protocol-archive-index.json';
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const d=catalog.documents.find(d=>d.id===id)||historicalProtocols.records.find(d=>d.id===id);if(d)return Response.json(d);const archive=archiveIndex.records.find((row)=>row.id===id);return archive?Response.json({...archive,pages:[]}):Response.json({error:'Handlingen finns inte.'},{status:404})}
