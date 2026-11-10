import fs from "node:fs";
const read=(name)=>JSON.parse(fs.readFileSync(new URL(`../data/${name}`,import.meta.url)));
const catalog=read("catalog.json"), pub=read("public-catalog.json"), accountability=read("accountability-ledger.json"), money=read("money-procurement.json"), proposals=read("proposal-ledger.json"), videos=read("meeting-videos.json"), history=read("history-coverage.json"), historicalProtocols=read("historical-protocols.json"), archive=read("municipal-protocol-archive.json"), archiveIndex=read("historical-protocol-archive-index.json"), protocolInsights=read("protocol-insights.json");
const archiveDocs=archive.records.map((row)=>({id:row.id,sha256:row.sha256,pages:row.pages,url:row.url,pageCount:row.pageCount}));
const docs=new Map([...archiveDocs,...catalog.documents].map((row)=>[row.id,row]));
const publicIds=new Set([...pub.documents.map((row)=>row.id),...archiveDocs.map((row)=>row.id)]);
const failures=[];
function source(value,label){const doc=docs.get(value.documentId);if(!doc||!publicIds.has(value.documentId))failures.push(`${label}: dokument ${value.documentId} saknas`);if(doc&&value.sha256&&doc.sha256!==value.sha256)failures.push(`${label}: hash stämmer inte`);if(value.page&&(!doc?.pages?.[value.page-1]))failures.push(`${label}: sida ${value.page} saknas`);}
for(const track of money.moneyTracks)for(const entry of track.entries)source(entry.source,entry.id);
for(const chain of money.agreementChains){source(chain.counterparty.source,chain.id);for(const step of chain.steps)if(step.source)source(step.source,step.id);}
for(const motion of proposals.motions)source(motion.source,motion.id);
for(const vote of proposals.votes)source(vote.source,vote.id);
for(const [documentId,sha256] of Object.entries(proposals.sourceHashes)){const doc=docs.get(documentId);if(!doc||doc.sha256!==sha256)failures.push(`förslagsbok: källhash stämmer inte för ${documentId}`);}
for(const row of accountability.records)for(const event of row.history)if(event.source.documentId)source(event.source,event.id);
for(const [label,rows] of [["accountability",accountability.records.flatMap((row)=>row.history)],["videos",videos.records]]){const ids=rows.map((row)=>row.id);if(ids.length!==new Set(ids).size)failures.push(`${label}: dubbla id`);}
if(videos.records.length!==34||new Set(videos.records.map((row)=>row.meetingDate)).size!==34)failures.push("videoindex: förväntade 34 unika möten");
if(videos.records.some((row)=>row.chapters.length))failures.push("videoindex: kapitel saknar ännu verifieringsunderlag");
if(history.summary.listedMeetings!==history.years.reduce((sum,row)=>sum+row.listed,0))failures.push("historik: årsantal summerar inte");
const kfProtocols=historicalProtocols.records.filter((row)=>row.bodyCode==="kf");
if(history.summary.verifiedProtocolDocuments!==kfProtocols.length)failures.push("historik: verifierat KF-antal skiljer sig från fulltextregistret");
for(const protocol of historicalProtocols.records){
 if(!protocol.bodyCode||!protocol.bodySlug||protocol.id!==`${protocol.bodyCode}-protokoll-${protocol.meetingDate}`)failures.push(`historik: instabilt id för ${protocol.meetingDate}`);
 if(protocol.status!=="published_verified"||protocol.identityChecks.length<4)failures.push(`historik: ofullständig identitetskontroll för ${protocol.meetingDate}`);
 if(protocol.pages.length!==protocol.pageCount||!protocol.sha256)failures.push(`historik: sidantal eller hash saknas för ${protocol.meetingDate}`);
}
const protocolById=new Map([...archive.records,...historicalProtocols.records].map((row)=>[row.id,row]));
const insightIds=new Set();
for(const row of protocolInsights.paragraphs){
 const protocol=protocolById.get(row.documentId);
 if(insightIds.has(row.id))failures.push(`protokollanalys: dubbelt id ${row.id}`);else insightIds.add(row.id);
 if(!protocol)failures.push(`protokollanalys: okänt dokument ${row.documentId}`);
 if(protocol&&protocol.sha256!==row.sourceSha256)failures.push(`protokollanalys: källhash stämmer inte för ${row.id}`);
 if(protocol&&(!Number.isInteger(row.page)||row.page<1||row.page>protocol.pageCount))failures.push(`protokollanalys: ogiltig sida för ${row.id}`);
 if(row.sourceUrl!==`/dokument/${row.documentId}#sida-${row.page}`)failures.push(`protokollanalys: fel källänk för ${row.id}`);
}
if(protocolInsights.summary.paragraphs!==protocolInsights.paragraphs.length)failures.push("protokollanalys: paragrafantal stämmer inte");
if(!protocolInsights.paragraphs.some((row)=>row.documentId==="tu-protokoll-2022-06-14"&&row.paragraph===40&&row.titlePlaces.includes("Kinnared")))failures.push("protokollanalys: verifierad Kinnared-träff saknas");
const september=archive.records.find((row)=>row.id==="kf-protokoll-2026-09-08");
if(!september||september.sha256!=="5c52764e12b47f1a5665d8a4f2c43ae6bdc90a15313f0bc9ac96f20056aec7e6"||september.pageCount!==37)failures.push("arkiv: verifierat septemberprotokoll saknas eller ändrat");
if(archive.records.length!==archiveIndex.summary.verifiedProtocols||archiveIndex.records.length!==archive.records.length)failures.push("arkiv: indexantal och fulltextantal skiljer sig");
if(archive.issues.length!==archiveIndex.summary.manualReviewFiles)failures.push("arkiv: manuella granskningsärenden och problemantal skiljer sig");
for(const chain of protocolInsights.docketChains)for(const event of chain.events)if(!insightIds.has(`${event.documentId}-paragraf-${event.paragraph}`))failures.push(`protokollanalys: kedjehändelse saknas för ${chain.docket}`);
if(proposals.coverage.rankingAllowed||proposals.coverage.denominatorComplete)failures.push("förslagsbok: ranking får inte aktiveras");
if(money.procurementChains.length||money.coverage.primaryAwardSources)failures.push("upphandling: oväntad kedja utan primär tilldelningskälla");
if(failures.length){console.error(JSON.stringify({valid:false,failures},null,2));process.exit(1)}
console.log(JSON.stringify({valid:true,accountability:accountability.records.length,videos:videos.records.length,moneyTracks:money.moneyTracks.length,motions:proposals.motions.length,votes:proposals.votes.length,historyMeetings:history.summary.listedMeetings,searchableHistoricalProtocols:historicalProtocols.records.length,siteVisionProtocols:archive.records.length,manualReviewFiles:archive.issues.length,searchableHistoricalPages:historicalProtocols.records.reduce((sum,row)=>sum+row.pageCount,0),protocolParagraphs:protocolInsights.paragraphs.length,exactDocketChains:protocolInsights.docketChains.length}));
