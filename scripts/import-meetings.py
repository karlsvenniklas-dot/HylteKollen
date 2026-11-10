"""Repeatable, non-destructive MeetingPlus import. Python stdlib + pdftotext.
Source observations never imply verified decisions. Run with --refresh to refetch PDFs.
"""
import json,re,html,hashlib,urllib.request,urllib.parse,datetime,sys,subprocess,tempfile,concurrent.futures,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='https://meetings.hylte.se'
TARGET=BASE+'/committees/kommunfullmaktige/mote-2026-09-08'
DATA=ROOT/'data'; DATA.mkdir(exist_ok=True)
NOW=datetime.datetime.now(datetime.timezone.utc).isoformat()
CHECKPOINT=DATA/'meeting-refresh-checkpoint.json'
checkpoint=json.loads(CHECKPOINT.read_text()) if CHECKPOINT.exists() else {}
# Resume only an unfinished batch. Completed batches always start a fresh check.
if checkpoint.get('complete') or '--new-batch' in sys.argv:checkpoint={}
checkpoint.setdefault('documents',{})
def save_checkpoint():
 tmp=CHECKPOINT.with_suffix('.tmp');tmp.write_text(json.dumps(checkpoint,ensure_ascii=False));tmp.replace(CHECKPOINT)
def clean(s):return re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]+>',' ',s))).strip()
def fetch(u):
 req=urllib.request.Request(u,headers={'User-Agent':'Hyltekollen/0.1 public municipal document index'})
 with urllib.request.urlopen(req,timeout=45) as r:
  if r.status!=200:raise ValueError('HTTP '+str(r.status))
 return r.read(20_000_000)
def ident(u):return hashlib.sha256(u.encode()).hexdigest()[:24]
def source_key(u):
 """Treat MeetingPlus' volatile numeric slug suffix as the same source document."""
 parsed=urllib.parse.urlsplit(u)
 path=re.sub(r'(?<=pdf)-\d+$','',parsed.path,flags=re.I)
 query=urllib.parse.parse_qsl(parsed.query,keep_blank_values=True)
 return urllib.parse.urlunsplit((parsed.scheme,parsed.netloc,path,urllib.parse.urlencode(query),''))
def pages_from_pdf(url):
 b=fetch(url)
 if not b.startswith(b'%PDF'):raise ValueError('Not a PDF')
 with tempfile.TemporaryDirectory() as t:
  p=Path(t)/'source.pdf';p.write_bytes(b)
  r=subprocess.run(['pdftotext','-layout',str(p),'-'],capture_output=True,timeout=45,check=True)
  pages=[x.strip() for x in r.stdout.decode(errors='replace').split('\f')]
 return pages[:-1] if pages and not pages[-1] else pages
def words(s):
 return {x.lower() for x in re.findall(r'[A-Za-zÅÄÖåäö]{4,}',s) if x.lower() not in {'kommunfullmäktige','hantering','kommunstyrelsen','beslut','ärendet','motion'}}
def protocol_candidates(items,pages):
 out=[]
 for item in items:
  key=words(item['title']);hits=[]
  for n,page in enumerate(pages,1):
   overlap=len(key & words(page))
   if overlap>=min(3,max(1,len(key))):hits.append(n)
  if hits:out.append({'itemId':item['id'],'pages':hits[:8],'confidence':'candidate','note':'Automatisk rubrikträff. Kontrollera beslutstext, paragraf och justering innan ett beslut publiceras.'})
 return out
def observe(u,b):
 h=hashlib.sha256(b).hexdigest(); p=DATA/'snapshots'/f'{ident(u)}-{h}.html'
 if not p.exists():p.write_bytes(b)
 return h
def committed_json(path, fallback):
 try:return json.loads(subprocess.check_output(['git','show',f'HEAD:{path}'],cwd=ROOT,text=True))
 except Exception:return fallback
old=json.loads((DATA/'catalog.json').read_text()) if (DATA/'catalog.json').exists() else committed_json('data/catalog.json',{'meetings':[],'documents':[]})
old_public=json.loads((DATA/'public-catalog.json').read_text()) if (DATA/'public-catalog.json').exists() else committed_json('data/public-catalog.json',{})
committed_catalog=committed_json('data/catalog.json',{})
committed_public=committed_json('data/public-catalog.json',{})
if '--preserve-history-only' in sys.argv:
 current=json.loads((DATA/'catalog.json').read_text())
 baseline=next((m for m in committed_catalog.get('meetings',[]) if m.get('id')=='kf-2026-09-08'),{})
 old_meeting=next((m for m in current.get('meetings',[]) if m.get('id')=='kf-2026-09-08'),{})
 archived=json.loads((DATA/'municipal-protocol-archive.json').read_text()) if (DATA/'municipal-protocol-archive.json').exists() else {}
 official=next((r for r in archived.get('records',[]) if r.get('bodyCode')=='kf' and r.get('meetingDate')=='2026-09-08' and r.get('status')=='published_verified' and all(r.get('identityChecks',{}).values())),None)
 evidence=baseline.get('protocolPublicationEvidence',{})
 if not official or not evidence or official.get('sha256')!=evidence.get('sha256'):
  raise SystemExit('Archive PDF did not match the previously verified protocol hash; refusing to transfer decision annotations.')
 old_items={i.get('id'):i for i in baseline.get('items',[])}
 for item in old_meeting.get('items',[]):
  prior=old_items.get(item.get('id'),{})
  if item.get('title')==prior.get('title') and prior.get('protocolReview'):item['protocolReview']=prior['protocolReview']
 for key in ('protocolUrl','protocolCandidates','protocolSource','protocolObservedAt','protocolPublicationEvidence','meetingPageProtocolStatus','protocolReviewed','protocolDocumentId','verifiedDecisions'):
  if key in baseline:old_meeting[key]=baseline[key]
 old_meeting['meetingPlusProtocolPublished']=old_meeting.get('meetingPlusProtocolPublished',old_meeting.get('protocolPublished',False))
 old_meeting['protocolPublished']=True
 old_meeting['municipalProtocol']={'documentId':official.get('id'),'sourceFileId':official.get('sourceFileId'),'url':official.get('url'),'sha256':official.get('sha256'),'pageCount':official.get('pageCount'),'checkedAt':archived.get('checkedAt')}
 current['meetings']=[old_meeting if m.get('id')==old_meeting.get('id') else m for m in current.get('meetings',[])]
 current.setdefault('coverage',{})['verifiedDecisions']=len(old_meeting.get('verifiedDecisions',[]))
 (DATA/'catalog.json').write_text(json.dumps(current,ensure_ascii=False,indent=2)+'\n')
 public={**current,'documents':[{**{k:v for k,v in d.items() if k!='pages'},'pageCount':len(d.get('pages',[]))} for d in current.get('documents',[])], 'versions':committed_public.get('versions',old_public.get('versions',[])), 'corrections':committed_public.get('corrections',old_public.get('corrections',[]))}
 (DATA/'public-catalog.json').write_text(json.dumps(public,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'repaired':'annotations-and-source-separation','verifiedDecisions':len(old_meeting.get('verifiedDecisions',[])),'versions':len(public['versions']),'corrections':len(public['corrections'])}))
 sys.exit(0)
old_docs={source_key(x['url']):x for x in old['documents']}
# The reviewed identity register prevents MeetingPlus' volatile URL suffixes from
# changing public document IDs. Append-only snapshots restore the matching record.
identity_path=DATA/'document-identities.json'
stable_ids=json.loads(identity_path.read_text()) if identity_path.exists() else {}
for key,stable_id in stable_ids.items():
 snapshots=sorted((DATA/'snapshots').glob(f'{stable_id}-*.json'),key=lambda p:p.stat().st_mtime,reverse=True)
 if snapshots:old_docs[key]=json.loads(snapshots[0].read_text())
changes=old.get('changes',[])
# Initial bootstrap may use a just-fetched local page; subsequent runs always fetch live.
bootstrap=Path('meeting.bootstrap.html')
if '--bootstrap' in sys.argv:
 b=bootstrap.read_bytes()
else:
 b=b''
 agenda_checked_at=NOW
 for _ in range(3):
  candidate=fetch(TARGET)
  if len(re.split(rb'<li class="meeting-item-row[^\"]*"[^>]*>',candidate))-1==18:
   b=candidate;break
 if not b:
  for snapshot in sorted((DATA/'snapshots').glob(f'{ident(TARGET)}-*.html'),key=lambda p:p.stat().st_mtime,reverse=True):
   candidate=snapshot.read_bytes()
   if len(re.split(rb'<li class="meeting-item-row[^\"]*"[^>]*>',candidate))-1==18:
    b=candidate
    agenda_checked_at=datetime.datetime.fromtimestamp(snapshot.stat().st_mtime,datetime.timezone.utc).isoformat()
    break
 if not b:raise RuntimeError('MeetingPlus returned an incomplete agenda and no complete snapshot exists; preserving the previous catalog')
h=observe(TARGET,b); body=b.decode('utf-8-sig')
meeting_plus_protocol_published='Inget protokoll har publicerats' not in body
meeting={'id':'kf-2026-09-08','title':'Kommunfullmäktige','date':'2026-09-08','time':'18:30–21:00','venue':'Forum','url':TARGET,'sourceHash':h,'checkedAt':agenda_checked_at if 'agenda_checked_at' in locals() else NOW,'meetingPlusProtocolPublished':meeting_plus_protocol_published,'protocolPublished':meeting_plus_protocol_published,'verified':False,'items':[]}
# A protocol PDF is a source for matching, never a decision by itself.
protocol_links=[]
for raw_url in re.findall(r'href="([^"]+)"',body,re.I):
 url=urllib.parse.urljoin(BASE,html.unescape(raw_url))
 if '/protocol/' in url and ('pdf' in url.lower() or 'downloadMode=open' in url):protocol_links.append(url)
meeting['protocolUrl']=protocol_links[0] if protocol_links else None
meeting['protocolCandidates']=[]
# MeetingPlus and Hylte's official adjusted-protocol archive are independent
# sources. A missing link in MeetingPlus must not erase a verified archive PDF.
archive_path=DATA/'municipal-protocol-archive.json'
if archive_path.exists():
 archive=json.loads(archive_path.read_text())
 official=next((r for r in archive.get('records',[]) if r.get('bodyCode')=='kf' and r.get('meetingDate')==meeting['date'] and r.get('status')=='published_verified' and all(r.get('identityChecks',{}).values())),None)
 if official:
  meeting['municipalProtocol']={'documentId':official.get('id'),'sourceFileId':official.get('sourceFileId'),'url':official.get('url'),'sha256':official.get('sha256'),'pageCount':official.get('pageCount'),'checkedAt':archive.get('checkedAt')}
  meeting['protocolPublished']=True
  if not meeting['protocolUrl']:meeting['protocolUrl']=official.get('url')
docs=[]
for block in re.split(r'<li class="meeting-item-row[^\"]*"[^>]*>',body)[1:]:
 title=re.search(r'<p class="item-title">(.*?)</p>',block,re.S)
 number=re.search(r'<span class="list-item-number">(.*?)</span>',block,re.S)
 if not title or not number:continue
 n=int(clean(number.group(1))); title=clean(title.group(1))
 item={'id':f'kf-2026-09-08-{n}','number':n,'title':title,'meetingId':meeting['id'],'location':'Rydöbruk' if n==6 else 'Hela kommunen','topic':{6:'Fastigheter & föreningsliv',7:'Demokrati & delaktighet',8:'Vård & omsorg',9:'Vård & omsorg',10:'Bygga & bo',11:'Samhällsmiljö',12:'Klimat & resor',13:'Arbetsmarknad',14:'Vård & omsorg',15:'Trafik & infrastruktur'}.get(n,'Mötesformalia'),'documentIds':[],'status':'underlag','summary':None}
 for raw_url,raw_title in re.findall(r'<a\s[^>]*href="([^\"]+downloadMode=open)"[^>]*>(.*?)</a>',block,re.S):
  url=urllib.parse.urljoin(BASE,html.unescape(raw_url)); name=clean(raw_title)
  if not name.endswith('.pdf'):continue
  key=source_key(url);previous=old_docs.get(key)
  did=stable_ids.get(key) or (previous['id'] if previous else ident(key)); item['documentIds'].append(did)
  docs.append({'id':did,'title':name,'url':url,'itemId':item['id'],'meetingId':meeting['id'],'checkedAt':NOW,'pages':[],'sha256':None,'fetchStatus':'pending'})
 meeting['items'].append(item)
if meeting['protocolUrl']:
 try:
  protocol_pages=pages_from_pdf(meeting['protocolUrl'])
  meeting['protocolCandidates']=protocol_candidates(meeting['items'],protocol_pages)
 except Exception as e:
  meeting['protocolError']=str(e)[:150]
if len(meeting['items'])!=18:raise RuntimeError('Schema drift: expected all 18 pilot agenda items; refusing partial overwrite')
# Preserve human-verified annotations across routine source refreshes. They are
# keyed by stable agenda item IDs and cite an immutable protocol document hash.
prior_meeting=next((m for m in old.get('meetings',[]) if m.get('id')==meeting['id']),{})
committed_meeting=next((m for m in committed_json('data/catalog.json',{}).get('meetings',[]) if m.get('id')==meeting['id']),{})
if not prior_meeting.get('verifiedDecisions') and committed_meeting.get('verifiedDecisions'):prior_meeting=committed_meeting
prior_items={i.get('id'):i for i in prior_meeting.get('items',[])}
for item in meeting['items']:
 previous_item=prior_items.get(item['id'],{})
 if previous_item.get('protocolReview'):
  item['protocolReview']=previous_item['protocolReview']
 if previous_item.get('summaryReview'):
  item['summaryReview']=previous_item['summaryReview']
for key in ('protocolReviewed','verifiedDecisions','protocolSource','protocolObservedAt','protocolPublicationEvidence','meetingPageProtocolStatus','protocolDocumentId'):
 if key in prior_meeting:meeting[key]=prior_meeting[key]
if meeting.get('protocolPublicationEvidence') and meeting.get('municipalProtocol',{}).get('sha256')==meeting['protocolPublicationEvidence'].get('sha256'):
 meeting.pop('protocolError',None)
def pdf(d):
 cached=checkpoint['documents'].get(source_key(d['url']))
 if cached and cached.get('url')==d['url'] and cached.get('fetchStatus') in ('ok','ocr_required') and not cached.get('lastError'):
  return cached
 prev=old_docs.get(source_key(d['url']))
 if prev and prev.get('fetchStatus')=='ok' and '--refresh' not in sys.argv:return prev
 try:
  last_error=None
  for attempt in range(2):
   try:
    b=fetch(d['url'])
    if not b.startswith(b'%PDF'):raise ValueError('Not a PDF')
    break
   except Exception as e:
    last_error=e
    if attempt<1:time.sleep(1.5)
  else:raise last_error
  d['sha256']=hashlib.sha256(b).hexdigest()
  with tempfile.TemporaryDirectory() as t:
   p=Path(t)/'doc.pdf'; p.write_bytes(b)
   r=subprocess.run(['pdftotext','-layout',str(p),'-'],capture_output=True,timeout=30,check=True)
   d['pages']=[x.strip() for x in r.stdout.decode(errors='replace').split('\f')]
   if d['pages'] and not d['pages'][-1]:d['pages'].pop()
  d['fetchStatus']='ok' if any(d['pages']) else 'ocr_required'
  # Keep each extracted document revision; PDFs remain linked at their canonical source.
  version=DATA/'snapshots'/f"{d['id']}-{d['sha256']}.json"
  if not version.exists():version.write_text(json.dumps(d,ensure_ascii=False))
 except Exception as e:
  if prev:
   d=prev.copy();d['lastAttemptAt']=NOW;d['lastError']=str(e)[:150]
  else:d['fetchStatus']='error';d['error']=str(e)[:150]
 checkpoint['documents'][source_key(d['url'])]=d
 save_checkpoint()
 print(json.dumps({'document':d['id'],'status':d.get('fetchStatus'),'retryNeeded':bool(d.get('lastError'))}),flush=True)
 return d
# MeetingPlus occasionally returns an HTML fallback when document downloads
# overlap. Refresh serially and retry before recording a failed attempt; the
# previously archived revision is preserved throughout.
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:docs=list(pool.map(pdf,docs))
# Keep previously observed source records when MeetingPlus stops listing a link. Absence
# from one refreshed HTML page is not evidence that the source was withdrawn or invalid.
current_keys={source_key(d['url']) for d in docs}
for key,previous in old_docs.items():
 if key not in stable_ids:continue
 if previous.get('meetingId')==meeting['id'] and key not in current_keys:
  retained=previous.copy()
  retained['sourcePresence']='not_observed_on_latest_meeting_page'
  retained['lastObservedAt']=previous.get('checkedAt')
  retained['checkedAt']=NOW
  docs.append(retained)
  item=next((item for item in meeting['items'] if item['id']==retained.get('itemId')),None)
  if item and retained['id'] not in item['documentIds']:item['documentIds'].append(retained['id'])
# A changed PDF gets a review event. Hashes establish that a source changed; they do not establish what a decision means.
for d in docs:
 prev=old_docs.get(source_key(d['url']))
 if prev and prev.get('sha256') and d.get('sha256') and prev['sha256']!=d['sha256']:
  event={'id':d['id']+':'+d['sha256'],'documentId':d['id'],'title':d['title'],'previousHash':prev['sha256'],'newHash':d['sha256'],'observedAt':NOW,'status':'review_needed','note':'Källdokumentet har ändrats. Jämför originalversionerna innan ändringen beskrivs.'}
  if not any(x['id']==event['id'] for x in changes):changes.append(event)
# The generic overview preserves observed dates/committee links; no political judgments.
upcoming=[]
def collect_upcoming(home):
 found=[]
 for path,date in re.findall(r'href="([^\"]*/mote-(2026-\d\d-\d\d)[^\"]*)"',home):
  if date<NOW[:10]:continue
  committee=next((name for slug,name in [('kommunfullmaktige','Kommunfullmäktige'),('kommunstyrelsens-arbetsutskott','Kommunstyrelsens arbetsutskott'),('kommunstyrelsen','Kommunstyrelsen')] if '/'+slug+'/' in path),None)
  url=urllib.parse.urljoin(BASE,path)
  if committee and not any(x['url']==url for x in found):found.append({'date':date,'title':committee,'url':url})
 return found
try:
 home=fetch(BASE+'/').decode('utf-8-sig')
 if home:observe(BASE+'/',home.encode())
 upcoming=collect_upcoming(home)
 if not upcoming:
  for snapshot in sorted((DATA/'snapshots').glob(f'{ident(BASE+"/")}-*.html'),key=lambda p:p.stat().st_mtime,reverse=True):
   upcoming=collect_upcoming(snapshot.read_text(errors='replace'))
   if upcoming:break
except Exception:upcoming=old.get('upcoming',[])
result={'schemaVersion':1,'checkedAt':NOW,'meetings':[meeting],'documents':docs,'changes':changes,'upcoming':sorted(upcoming,key=lambda x:x['date']),'coverage':{'pilot':True,'semanticSearch':False,'videoTranscribed':False,'verifiedDecisions':len(meeting.get('verifiedDecisions',[]))}}
failed=[d for d in docs if d.get('lastError') or d.get('fetchStatus')=='error']
if failed:result['checkedAt']=old.get('checkedAt',NOW)
result['latestCheckAttempt']={'date':NOW,'status':'partial' if failed else 'successful','note':f'{len(docs)-len(failed)} källposter tillgängliga; {len(failed)} hämtningar behöver återförsök. Tidigare versioner bevaras.'}
p=DATA/'catalog.json';tmp=p.with_suffix('.tmp');tmp.write_text(json.dumps(result,ensure_ascii=False,indent=2));tmp.replace(p)
print(json.dumps({'meetings':1,'items':len(meeting['items']),'documents':len(docs),'downloaded':sum(x['fetchStatus']=='ok' for x in docs),'protocolPublished':meeting['protocolPublished'],'upcoming':len(upcoming)}))

docs=[d for d in docs if not re.search(r"KF (Falkenberg|Varberg|Halmstad|Laholm)\b", d["title"])]
allowed={d["id"] for d in docs}
public_meetings=json.loads(json.dumps(result["meetings"]))
for m in public_meetings:
 for i in m["items"]: i["documentIds"]=[x for x in i["documentIds"] if x in allowed]
public={**result,"meetings":public_meetings,"documents":[{**{k:v for k,v in d.items() if k!="pages"},"pageCount":len(d["pages"])} for d in docs],"versions":old_public.get("versions",[]),"corrections":old_public.get("corrections",[])}
(DATA/"public-catalog.json").write_text(json.dumps(public,ensure_ascii=False))
subprocess.run([sys.executable,str(Path(__file__).with_name("build-document-network.py"))],check=True)
checkpoint['complete']=not failed
save_checkpoint()
