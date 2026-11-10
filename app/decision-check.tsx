"use client";
import { useState } from "react";
import initial from "@/data/public-catalog.json";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Download,
  FileCheck2,
  Info,
} from "lucide-react";
const source = (title: string) =>
  initial.documents.find((d) => d.title.startsWith(title));
function Original({
  href,
  children,
}: {
  href?: string;
  children: React.ReactNode;
}) {
  return href ? (
    <a className="out" href={href} target="_blank" rel="noreferrer">
      {children}
      <ArrowUpRight size={15} />
    </a>
  ) : null;
}
export default function DecisionCheck() {
  const meeting = initial.meetings[0];
  const rydö = source("§137 KS Hantering av fastighet Rydö skola");
  const råd = meeting.items.find((i) => i.number === 7);
  const protocols = initial.documents.filter((document) =>
    /^§\d+/.test(document.title),
  );
  return (
    <>
      <div className="notice">
        <Info size={18} />
        <div>
          <strong>Så fungerar kontrollen</strong>
          <br />
          Ett förslag blir aldrig ett verifierat fullmäktigebeslut förrän
          Hyltekollen har läst ett justerat protokoll och pekat ut paragraf och
          sida.
        </div>
      </div>
      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Kontrollkö</TabsTrigger>
          <TabsTrigger value="protocols">
            Protokoll ({protocols.length})
          </TabsTrigger>
          <TabsTrigger value="method">Metod & gränser</TabsTrigger>
        </TabsList>
        <TabsContent value="queue">
          <div className="checkgrid">
            <article className="panel checkcard">
              <Clock3 size={25} />
              <p className="eyebrow">KOMMUNFULLMÄKTIGE · 8 SEPTEMBER 2026</p>
              <h2>Justerat protokoll hittat i kommunens arkiv</h2>
              <p>
                Mötesidan i MeetingPlus visar fortfarande ingen publicerad
                protokollfil. Hylte kommuns separata protokollarkiv innehåller
                den justerade PDF:en. Fem utvalda ärenden har granskats med
                paragraf och sida; övriga punkter är inte genomgångna här.
              </p>
              <Original href={meeting.protocolUrl || meeting.url}>Justerat KF-protokoll 8 september · 37 sidor</Original>
            </article>
            <article className="panel checkcard">
              <FileCheck2 size={25} />
              <p className="eyebrow">KOMMUNSTYRELSEN · 25 AUGUSTI 2026</p>
              <h2>Rydö skola: beredningsbeslut verifierat</h2>
              <p>
                Kommunstyrelsen beslutade att föreslå fullmäktige att
                återremissen är besvarad, avtal kan ingås och kommunstyrelsen
                får verkställa åtagandena. Detta är kommunstyrelsens beslut,
                inte ett verifierat beslut av fullmäktige.
              </p>
              <p className="small">
                Omröstningen om återremiss: 6 JA och 5 NEJ. Reservationer anges
                i protokollet.
              </p>
              {rydö && (
                <>
                  <a className="out" href={"/dokument/" + rydö.id + "#sida-6"}>
                    Läs justerat KS-protokoll §137 · sida 6{" "}
                    <ArrowUpRight size={15} />
                  </a>
                  <a className="out" href={"/api/original/" + rydö.id}>
                    <Download size={15} />
                    Ladda ner original-PDF
                  </a>
                </>
              )}
            </article>
            <article className="panel checkcard">
              <Clock3 size={25} />
              <p className="eyebrow">KOMMUNFULLMÄKTIGE · 8 SEPTEMBER 2026</p>
              <h2>{råd?.title || "Ny rådsorganisation"} · §93</h2>
              <p>
                Det justerade protokollet visar att fullmäktige antog
                arbetsformerna. Efterföljande genomförande har inte granskats.
              </p>
              <a className="out" href={`/dokument/${meeting.protocolDocumentId}#sida-12`}>Justerat protokoll · sida 12 <ArrowUpRight size={15}/></a>
            </article>
          </div>
        </TabsContent>
        <TabsContent value="protocols">
          <div className="stack gap16">
            <section className="panel prose">
              <h2>Protokoll och beslutsutdrag i importen</h2>
              <p>
                Varje handling kan läsas direkt här med importerad text.
                Nedladdning hämtar original-PDF:en från Hylte kommuns
                MeetingPlus-källa.
              </p>
            </section>
            {protocols.map((document) => (
              <article className="panel" key={document.id}>
                <div className="sectionhead">
                  <div>
                    <p className="eyebrow">
                      {document.committee} · {document.date}
                    </p>
                    <h3>{document.title}</h3>
                  </div>
                  <div className="inline-actions">
                    <a className="out" href={"/dokument/" + document.id}>
                      Läs här <ArrowUpRight size={14} />
                    </a>
                    <a className="out" href={"/api/original/" + document.id}>
                      <Download size={14} />
                      PDF
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="method">
          <div className="panel">
            <div className="methodrow">
              <CheckCircle2 size={23} />
              <div>
                <h3>Verifierat beslut</h3>
                <p>
                  Exakt beslutstext, justerat protokoll, datum, paragraf och
                  sida finns dokumenterade.
                </p>
              </div>
            </div>
            <div className="methodrow">
              <Clock3 size={23} />
              <div>
                <h3>Förslag eller beredning</h3>
                <p>
                  Nämndens eller kommunstyrelsens protokoll kan visa
                  beredningen, men ersätter inte fullmäktiges beslut när det är
                  fullmäktige som ska avgöra frågan.
                </p>
              </div>
            </div>
            <div className="methodrow">
              <Info size={23} />
              <div>
                <h3>Genomförande</h3>
                <p>
                  Ett beslut, en slutredovisning och ett faktisk resultat är tre
                  olika saker. Varje steg behöver egen källa.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
