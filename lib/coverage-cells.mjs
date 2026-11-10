export function coverageCell(archive, body, month) {
 return {records:archive.records.filter(r=>r.bodyCode===body&&r.meetingDate.startsWith(month)),issues:archive.issues.filter(r=>r.body===archive.coverage.find(b=>b.bodyCode===body)?.body&&r.meetingDate?.startsWith(month))};
}
