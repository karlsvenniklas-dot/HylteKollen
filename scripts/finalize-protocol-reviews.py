#!/usr/bin/env python3
"""Apply the 2026-11-04 visual identity review, retaining uncertain dates."""
import hashlib, importlib.util, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('collector',ROOT/'scripts/import-hylte-protocol-archive.py')
c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
metadata,errors=c.discover()
if errors:raise RuntimeError('Incomplete source discovery: review application stopped')
review_path=ROOT/'data/protocol-manual-reviews.json'
reviews=json.loads(review_path.read_text())
if any(row.get('status')=='identity_verified' for row in reviews['records']):
    raise SystemExit('Dated review already applied; preserving source and review history.')
path=ROOT/'data/municipal-protocol-archive.json';archive=json.loads(path.read_text())
conflicts={'18.4385c1e19c47c86a8f99af':'2026-02-03','18.1d4de1319762881c6411f26':'2025-06-18','18.29fb83b19afcdd608f2f8aa':'2025-12-10','18.57d0f32a19386369f911101e':'2024-12-10'}
for row in reviews['records']:
    full_path=ROOT/'public/data/protocol-reviews'/(row['id']+'.json');full=json.loads(full_path.read_text())
    meta=metadata[row['sourceFileId']]
    original=ROOT/'.cache/hylte-protocols'/(row['sourceFileId'].replace('.','-')+'.pdf')
    assert hashlib.sha256(original.read_bytes()).hexdigest()==row['sha256']
    row['originalFailure']=row['detail']
    row['identityEvidence']={'page':1,'method':'Visuell kontroll av originalets förstasida: protokolltyp, organ, mötesdatum och ANSLAG/BEVIS med justeringsmarkör. Textinnehållet är inte fullständigt korrekturläst.','sha256':row['sha256']}
    if row['sourceFileId'] in conflicts:
        row['observedMeetingDate']=conflicts[row['sourceFileId']]
        row['reviewNote']=f"Datumkonflikt: filnamnet anger {row['meetingDate']}, men protokollets förstasida och anslagsbevis anger {row['observedMeetingDate']}. Originalet kan läsas, men filen räknas inte som verifierad och slås inte ihop med ett annat möte."
    else:
        new_id=f"{meta['bodyCode']}-protokoll-{meta['meetingDate']}"
        assert not any(r['id']==new_id and r['sourceFileId']!=row['sourceFileId'] for r in archive['records']),new_id
        row['status']='identity_verified';row['verifiedDocumentId']=new_id
        row['reviewNote']='Dokumentidentitet verifierad genom visuell kontroll av originalets förstasida: organ, mötesdatum, protokolltyp och justeringsmarkör. Ingen automatisk besluts- eller genomförandeverifiering.'
        record={**meta,'id':new_id,'sha256':row['sha256'],'pageCount':full['pageCount'],'pages':full['pages'],'checkedAt':archive['checkedAt'],'status':'published_verified','fetchStatus':'ok','ocrApplied':row['ocrApplied'],'textStatus':row['textStatus'],'identityChecks':{'meetingProtocol':True,'body':True,'meetingDate':True,'adjusted':True},'manualIdentityReview':{'date':'2026-11-04',**row['identityEvidence']},'versions':[{'sha256':row['sha256'],'observedAt':'2026-11-04','pageCount':full['pageCount']}],'sourceVersions':[{'url':meta['url'],'fileId':row['sourceFileId'],'lastModifiedDateTime':meta.get('lastModifiedDateTime'),'sha256':row['sha256'],'observedAt':'2026-11-04'}]}
        if not any(r['sourceFileId']==record['sourceFileId'] for r in archive['records']):archive['records'].append(record)
    row['history'].append({'date':'2026-11-04','action':row['reviewNote'],'sourceSha256':row['sha256'],'page':1})
    full.update(row);full_path.write_text(json.dumps(full,ensure_ascii=False)+'\n')
archive.setdefault('reviewHistory',[]).append({'date':'2026-11-04','action':'35 tidigare granskningsposter genomgångna visuellt: 31 identiteter verifierade, 4 datumkonflikter behållna som osäkra. OCR-text är inte fullständigt korrekturläst.'})
path.write_text(json.dumps(archive,ensure_ascii=False,indent=2)+'\n')
review_path.write_text(json.dumps(reviews,ensure_ascii=False,indent=2)+'\n')
print('31 verified; 4 date conflicts retained separately')
