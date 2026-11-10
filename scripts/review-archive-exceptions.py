#!/usr/bin/env python3
"""Re-extract the bounded review queue without promoting uncertain documents."""
import concurrent.futures, hashlib, json, os, re, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
WORK=ROOT/'.cache'/'protocol-review'
WORK.mkdir(parents=True,exist_ok=True)
archive=json.loads((ROOT/'data/municipal-protocol-archive.json').read_text())
if len(archive['issues'])!=35 or (ROOT/'data/protocol-manual-reviews.json').exists():
    raise SystemExit('This one-time 35-file review batch is already applied or its input changed; preserving the review history.')
def review(pair):
    i,row=pair
    path=ROOT/'.cache/hylte-protocols'/f"{row['sourceFileId'].replace('.','-')}.pdf"
    digest=hashlib.sha256(path.read_bytes()).hexdigest()
    folder=WORK/row['sourceFileId'];folder.mkdir(exist_ok=True)
    raw=subprocess.check_output(['pdftotext','-layout',str(path),'-']).decode('utf8','replace')
    pages=raw.split('\f');pages=pages[:-1] if not pages[-1].strip() else pages
    ocr=not re.search(r'(?:M[ÖO]TES|SAMMANTR[ÄA]DES)PROTOKOLL',raw[:10000],re.I)
    if ocr:
        output=folder/'ocr.json'
        if output.exists():pages=json.loads(output.read_text())
        else:
            subprocess.run(['pdftoppm','-r','180','-png',str(path),str(folder/'page')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
            pages=[]
            for image in sorted(folder.glob('page-*.png')):
                result=subprocess.run(['tesseract',str(image),'stdout','-l','eng','--psm','3'],env={**os.environ,'OMP_THREAD_LIMIT':'1'},capture_output=True,check=True,timeout=90)
                pages.append(result.stdout.decode('utf8','replace').strip())
            output.write_text(json.dumps(pages,ensure_ascii=False))
    # Always render the first page for human inspection, even with readable embedded text.
    cover=folder/'cover.png'
    if not cover.exists():subprocess.run(['pdftoppm','-f','1','-l','1','-scale-to','1100','-singlefile','-png',str(path),str(folder/'cover')],check=True,stderr=subprocess.DEVNULL)
    result={**row,'id':'review-'+row['sourceFileId'].replace('.','-'),'sha256':digest,'pages':pages,'pageCount':len(pages),'ocrApplied':ocr,'textStatus':'OCR – ej korrekturläst' if ocr else 'Extraherad text – ej fullständigt korrekturläst','reviewedAt':'2026-11-04','status':'reviewed_uncertain','reviewNote':'Dokumentidentitet eller text kräver kontroll mot original. Räknas inte som verifierat protokoll.','history':[{'date':'2026-11-04','action':'Ny extraktion och granskning av tidigare importhinder; original och hash bevarade.'}]}
    (folder/'result.json').write_text(json.dumps(result,ensure_ascii=False))
    print(json.dumps({'index':i,'body':row['body'],'date':row['meetingDate'],'pages':len(pages),'ocr':ocr}),flush=True)
    return result
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:rows=list(pool.map(review,enumerate(archive['issues'])))
(ROOT/'data/protocol-manual-reviews.json').write_text(json.dumps({'reviewedAt':'2026-11-04','records':[{k:v for k,v in r.items() if k!='pages'} for r in rows]},ensure_ascii=False,indent=2)+'\n')
out=ROOT/'public/data/protocol-reviews';out.mkdir(exist_ok=True)
for r in rows:(out/(r['id']+'.json')).write_text(json.dumps(r,ensure_ascii=False)+'\n')
