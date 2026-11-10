"use client";

type Corpus = { records: Array<{ id: string; title: string; body: string; bodyCode: string; meetingDate: string; url: string; pageCount: number; sha256: string; pages: string[] }> };
let corpusPromise: Promise<Corpus> | null = null;

function corpus() {
  if (!corpusPromise) {
    corpusPromise = fetch("/data/protocol-search-corpus.json")
      .then((response) => { if (!response.ok) throw new Error("Källindexet kunde inte hämtas."); return response.json(); })
      .catch((error) => { corpusPromise = null; throw error; });
  }
  return corpusPromise;
}

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("sv-SE");

export async function findProtocolDocument(id: string) {
  // Document pages are split into one small asset per protocol. Loading the
  // complete multi-year search corpus just to open one source was both slow
  // and could exhaust the browser on large archives.
  try {
    const response = await fetch(`/data/protocols/${encodeURIComponent(id)}.json`);
    if (response.ok) return response.json();
  } catch {
    // Older deployments may not have split document assets; retain the
    // complete-corpus fallback until every published version does.
  }
  const data = await corpus();
  return data.records.find((record) => record.id === id) ?? null;
}

export async function searchProtocolArchive(query: string) {
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return { results: [], total: 0 };
  const data = await corpus();
  const results: Array<{ type: string; title: string; url: string; text: string; page: number; meetingDate: string }> = [];
  for (const document of data.records) {
    let firstHit: { page: number; text: string } | null = null;
    for (let index = 0; index < document.pages.length; index += 1) {
      const page = document.pages[index];
      const normalized = normalize(page);
      if (!terms.every((term) => normalized.includes(term))) continue;
      const offset = Math.max(0, normalized.indexOf(terms[0]) - 90);
      firstHit = { page: index + 1, text: page.slice(offset, offset + 280).replace(/\s+/g, " ").trim() };
      break;
    }
    if (firstHit || terms.every((term) => normalize(`${document.title} ${document.body} ${document.meetingDate}`).includes(term))) {
      results.push({ type: "Historiskt protokoll", title: document.title, url: `/dokument/${document.id}${firstHit ? `#sida-${firstHit.page}` : ""}`, text: firstHit?.text || `${document.body} · ${document.meetingDate}`, page: firstHit?.page || 1, meetingDate: document.meetingDate });
    }
  }
  results.sort((a, b) => b.meetingDate.localeCompare(a.meetingDate));
  return { results: results.slice(0, 100), total: results.length };
}
