import {motionExportRows,motionCoverage,motionReviewDate} from "@/lib/motion-register";
import catalog from "@/data/public-catalog.json";
import followups from "@/data/followups.json";
import politicians from "@/data/politician-observations.json";

const allowed = ["documents", "followups", "politicians", "motions"] as const;
type Kind = typeof allowed[number];
const safeCell = (value: unknown) => {
  const normalized = String(value ?? "").replace(/\r?\n/g, " ");
  return /^[\s]*[=+\-@\t\r]/.test(normalized) ? `'${normalized}` : normalized;
};
const esc = (value: unknown) => `"${safeCell(value).replaceAll('"', '""')}"`;
const csv = (rows: Record<string, unknown>[]) => {
  const keys = Object.keys(rows[0] || {});
  return [keys.map(esc).join(","), ...rows.map((row) => keys.map((key) => esc(row[key])).join(","))].join("\r\n");
};

function rows(kind: Kind) {
  if(kind==="motions") return motionExportRows();
  if (kind === "documents") return catalog.documents.map((doc) => { const meeting = catalog.meetings.find((row) => row.id === doc.meetingId); const item = meeting?.items.find((row) => row.id === doc.itemId); return { document_id: doc.id, meeting_id: doc.meetingId, meeting_date: meeting?.date, meeting_title: meeting?.title, agenda_item_id: doc.itemId, agenda_number: item?.number, agenda_title: item?.title, topic: item?.topic, location: item?.location, document_title: doc.title, source_url: doc.url, reader_path: `/dokument/${doc.id}`, download_path: `/api/original/${doc.id}`, checked_at: doc.checkedAt, sha256: doc.sha256, fetch_status: doc.fetchStatus, page_count: doc.pageCount }; });
  if (kind === "followups") return followups.records.map((record) => ({ followup_id: record.id, title: record.title, docket: record.docket, assigned_on: record.assignedOn, responsible_bodies: record.responsible.join(" | "), location: record.location, status: record.status, task: record.task, latest: record.latest, evidence_as_of: record.evidenceAsOf, report_page: record.reportPage, related_item_id: record.relatedItem, due_date: record.dueDate, detail_path: `/uppfoljning/${record.id}` }));
  return politicians.politicians.flatMap((person) => [...person.attendance.map((row) => ({ person_id: person.id, name: person.name, parties: person.parties.join(" | "), observation_type: "served_attendance", body: row.body, date: row.date, title: "", document_id: row.documentId, page: "", source_url: row.documentUrl })), ...person.initiatives.map((row) => ({ person_id: person.id, name: person.name, parties: person.parties.join(" | "), observation_type: row.kind, body: "", date: "", title: row.title, document_id: row.documentId, page: row.page, source_url: row.documentUrl }))]);
}

export async function GET(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!allowed.includes(kind as Kind)) return Response.json({ error: "Exporten finns inte." }, { status: 404 });
  const data = rows(kind as Kind);
  const format = new URL(req.url).searchParams.get("format") === "json" ? "json" : "csv";
  const checkedAt = kind==="motions"?motionReviewDate:catalog.checkedAt;
  const stamp = checkedAt.slice(0,10);
  if (format === "json") return Response.json({ schemaVersion: 1, checkedAt, scope: "Hylte kommun", kind, recordCount: data.length, coverageWarning: kind==="motions"?motionCoverage:kind === "politicians" ? "Observerade källposter, inte närvaroprocent eller en komplett mandatperiod." : undefined, records: data }, { headers: { "Content-Disposition": `attachment; filename="hyltekollen-${kind}-${stamp}.json"`, "Cache-Control": "public, max-age=3600" } });
  return new Response("\uFEFF" + csv(data), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="hyltekollen-${kind}-${stamp}.csv"`, "Cache-Control": "public, max-age=3600" } });
}
