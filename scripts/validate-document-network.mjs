import fs from "node:fs";

const catalog = JSON.parse(fs.readFileSync(new URL("../data/catalog.json", import.meta.url)));
const publicCatalog = JSON.parse(fs.readFileSync(new URL("../data/public-catalog.json", import.meta.url)));
const network = JSON.parse(fs.readFileSync(new URL("../data/document-network.json", import.meta.url)));
const followups = JSON.parse(fs.readFileSync(new URL("../data/followups.json", import.meta.url)));
const motions = JSON.parse(fs.readFileSync(new URL("../data/motion-journeys.json", import.meta.url)));

const privateDocs = new Map(catalog.documents.map((row) => [row.id, row]));
const publicDocs = new Set(publicCatalog.documents.map((row) => row.id));
const items = new Set(publicCatalog.meetings.flatMap((meeting) => meeting.items.map((row) => row.id)));
const followupIds = new Set(followups.records.map((row) => row.id));
const motionIds = new Set(motions.records.map((row) => row.id));
const failures = [];

for (const docket of network.dockets) {
  for (const mention of docket.documentMentions) {
    const document = privateDocs.get(mention.documentId);
    if (!document || !publicDocs.has(mention.documentId)) failures.push(`${docket.label}: ogiltigt offentligt dokument ${mention.documentId}`);
    for (const page of mention.pages) {
      if (!Number.isInteger(page) || page < 1) failures.push(`${docket.label}: ogiltig sida ${page}`);
      const text = document?.pages?.[page - 1] || "";
      const compactText = text.toLocaleUpperCase("sv-SE").replace(/\s+/g, "");
      const compactLabel = docket.label.toLocaleUpperCase("sv-SE").replace(/\s+/g, "");
      if (!compactText.includes(compactLabel)) failures.push(`${docket.label}: saknas på ${mention.documentId} sida ${page}`);
    }
  }
  for (const link of docket.itemLinks) if (!items.has(link.itemId)) failures.push(`${docket.label}: ogiltigt ärende ${link.itemId}`);
  for (const link of docket.followupLinks) if (!followupIds.has(link.followupId)) failures.push(`${docket.label}: ogiltig uppföljning ${link.followupId}`);
  for (const link of docket.motionLinks) if (!motionIds.has(link.motionId)) failures.push(`${docket.label}: ogiltig motion ${link.motionId}`);
}

if (failures.length) {
  console.error(JSON.stringify({ valid: false, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ valid: true, dockets: network.dockets.length, documentMentions: network.dockets.reduce((sum, row) => sum + row.documentMentions.length, 0) }));
