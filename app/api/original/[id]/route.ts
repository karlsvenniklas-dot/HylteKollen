import { catalog } from "@/lib/catalog";
import historicalProtocols from "@/data/historical-protocols.json";
import archiveIndex from "@/data/historical-protocol-archive-index.json";
import reviews from "@/data/protocol-manual-reviews.json";

function safeFilename(title: string) {
  const base =
    title
      .replace(/\.pdf$/i, "")
      .replace(/[^\p{L}\p{N}._ -]/gu, "")
      .trim()
      .slice(0, 140) || "hyltekollen-original";
  return `${base}.pdf`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const review = reviews.records.find(item=>item.id===id);
  const document = catalog.documents.find((item) => item.id === id) || historicalProtocols.records.find((item) => item.id === id) || archiveIndex.records.find((item) => item.id === id) || (review ? {...review,title:review.body+' '+review.meetingDate} : undefined);
  if (!document)
    return Response.json(
      { error: "Handlingen finns inte i den publika importen." },
      { status: 404 },
    );
  try {
    const upstream = await fetch(document.url, {
      headers: { "User-Agent": "Hyltekollen/1.0" },
    });
    if (!upstream.ok || !upstream.body)
      return Response.json(
        { error: "Originalfilen kunde inte hämtas just nu." },
        { status: 502 },
      );
    const bytes = await upstream.arrayBuffer();
    if (new TextDecoder().decode(bytes.slice(0,5)) !== '%PDF-') return Response.json({error:'Källan levererade inte en PDF. Tidigare textversion är bevarad.'},{status:502});
    if (document.sha256) {
      const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
      if(digest!==document.sha256) return Response.json({error:'Originalet har ändrats sedan textversionen hämtades. Ny källgranskning behövs.'},{status:409});
    }
    const inline = new URL(request.url).searchParams.get('inline') === '1';
    return new Response(bytes, {
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") || "application/pdf",
        "Content-Disposition": `${inline?'inline':'attachment'}; filename*=UTF-8''${encodeURIComponent(safeFilename(document.title))}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return Response.json(
      { error: "Originalfilen kunde inte hämtas just nu." },
      { status: 502 },
    );
  }
}
