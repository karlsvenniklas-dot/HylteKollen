#!/usr/bin/env python3
"""Create source-linked politician observations from imported Hylte protocol PDFs.

This is intentionally conservative: a meeting is counted only once per body/date,
attendance is limited to the protocol's 'Beslutande ledamöter' list, and a motion
signatory is saved only when a name is printed in the original motion document.
"""
import hashlib, json, re, unicodedata
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
catalog = json.loads((ROOT / 'data/catalog.json').read_text())
archive = json.loads((ROOT / 'data/municipal-protocol-archive.json').read_text())
output_path = ROOT / 'data/politician-observations.json'
existing_ids = {}
if output_path.exists():
    existing = json.loads(output_path.read_text())
    existing_ids = {row['name']: row.get('id') for row in existing.get('politicians', []) if row.get('id')}
outside = re.compile(r'KF (Falkenberg|Varberg|Halmstad|Laholm)\b', re.I)
bodies = [
    'Kommunstyrelsens arbetsutskott', 'Kommunfullmäktige', 'Kommunstyrelsen',
    'Samhällsbyggnadsnämnden', 'Kultur- och folkhälsonämnden', 'Omsorgsnämnden',
    'Barn- och ungdomsnämnden', 'Personalutskottet', 'Tillväxtutskott',
    'Kommunala pensionärsrådet', 'Tillsynsnämnden', 'Valnämnden',
    'Kommunala tillgänglighetsrådet', 'Folkhälso- och trygghetsrådet',
    'Kommunstyrelsens tillväxtutskott',
]
name = r'([A-ZÅÄÖ][A-Za-zÀ-ÖØ-ö\-]+(?:\s+[A-ZÅÄÖ][A-Za-zÀ-ÖØ-ö\-]+){1,2})'
party_name = re.compile(name + r'\s*\((S|M|C|L|V|SD|KD|KV)\)')
plain_name = re.compile(name + r'\s*(?:\((?:ordförande|vice ordförande|[12]:e vice ordförande|-)\))?')

def compact(text): return re.sub(r'\s+', ' ', unicodedata.normalize('NFC', text)).strip()
def body_for(text): return next((body for body in bodies if body in text), None)
def date_for(text):
    match = re.search(r'(?:Mötesdatum|Sammanträdesdatum)\s+(\d{4}-\d\d-\d\d)', text)
    if not match: match = re.search(r'\b(20\d\d-\d\d-\d\d)\b', text[:1500])
    return match.group(1) if match else None
def people_in(text):
    stop = re.search(r'(?:Ej tjänstgörande ersättare|Övriga närvarande|Utses att justera)', text, re.I)
    segment = text[:stop.start()] if stop else text
    known = {}
    for match in party_name.finditer(segment): known[match.group(1)] = match.group(2)
    # Names without a party label are retained, but never assigned a party by inference.
    for match in plain_name.finditer(segment):
        candidate = compact(match.group(1))
        if candidate not in {'Beslutande ledamöter', 'Mötesprotokoll'} and len(candidate.split()) >= 2:
            known.setdefault(candidate, None)
    return [{'name': person, 'party': party} for person, party in known.items()]

meetings = {}
documents = [*catalog['documents'], *[
    {'id': r['id'], 'title': r['title'], 'url': r['url'], 'pages': r['pages']}
    for r in archive['records'] if r.get('status') == 'published_verified'
]]
for document in documents:
    if outside.search(document['title']) or not document.get('pages'): continue
    first = document['pages'][0]
    header = compact(first[:3500])
    body, date = body_for(header), date_for(header)
    marker = re.search(r'Beslutande ledamöter', header, re.I)
    if not body or not date or not marker: continue
    key = f'{body}|{date}'
    meetings.setdefault(key, {'body': body, 'date': date, 'documentId': document['id'], 'documentUrl': document['url'], 'attendees': people_in(header[marker.end():])})

initiatives = []
known_people = {attendee['name'] for meeting in meetings.values() for attendee in meeting['attendees']}
for document in catalog['documents']:
    if outside.search(document['title']) or not re.match(r'Motion\b', document['title'], re.I) or not document.get('pages'): continue
    text = '\n'.join(document['pages'])
    tail = text[-2200:]
    party = next((p for p in re.findall(r'(Sverigedemokraterna|Moderaterna|Centerpartiet|Socialdemokraterna|Kristdemokraterna|Liberalerna|Vänsterpartiet)', text, re.I)), None)
    party = {'Sverigedemokraterna':'SD','Moderaterna':'M','Centerpartiet':'C','Socialdemokraterna':'S','Kristdemokraterna':'KD','Liberalerna':'L','Vänsterpartiet':'V'}.get(party.title() if party else '', None)
    # A signature is recognised only when a known full name occurs in the closing area.
    # This avoids treating prose such as “Att Hylte kommun” as a person.
    signers = [person for person in known_people if re.search(r'(?<![A-Za-zÀ-ÖØ-ö])' + re.escape(person) + r'(?![A-Za-zÀ-ÖØ-ö])', tail)]
    for signer in sorted(signers): initiatives.append({'politician': signer, 'party': party, 'kind': 'motion_signature', 'title': document['title'].removeprefix('Motion - ').removesuffix('.pdf'), 'documentId': document['id'], 'documentUrl': document['url'], 'page': len(document['pages'])})

politicians = defaultdict(lambda: {'attendance': [], 'initiatives': []})
for meeting in meetings.values():
    for attendee in meeting['attendees']:
        politicians[attendee['name']]['attendance'].append({'body': meeting['body'], 'date': meeting['date'], 'documentId': meeting['documentId'], 'documentUrl': meeting['documentUrl'], 'party': attendee['party']})
for initiative in initiatives:
    politicians[initiative['politician']]['initiatives'].append(initiative)

rows = []
for person, values in politicians.items():
    parties = sorted({entry['party'] for entry in values['attendance'] if entry['party']} | {entry['party'] for entry in values['initiatives'] if entry['party']})
    stable_id = existing_ids.get(person) or 'person-' + hashlib.sha256(person.casefold().encode()).hexdigest()[:12]
    rows.append({'id': stable_id, 'name': person, 'parties': parties, 'servedMeetings': len(values['attendance']), 'motionSignatures': len(values['initiatives']), 'attendance': values['attendance'], 'initiatives': values['initiatives']})
rows.sort(key=lambda row: (-row['servedMeetings'], -row['motionSignatures'], row['name']))
output = {'scope':'Hylte kommun', 'method':'Observed serving attendees in unique imported protocol meetings; no attendance rate is calculated until all eligible meetings are imported.', 'meetingsObserved': len(meetings), 'sourceDocuments': len({meeting['documentId'] for meeting in meetings.values()}), 'politicians': rows}
# A verified named roll-call is an event observation, not an attendance denominator.
ledger = json.loads((ROOT / 'data/proposal-ledger.json').read_text())
votes_by_name = defaultdict(list)
for vote in ledger.get('votes', []):
    for person in vote.get('individualVotes', []):
        votes_by_name[person.get('name')].append({
            'documentId': vote.get('source', {}).get('documentId'),
            'documentUrl': vote.get('source', {}).get('documentUrl'),
            'page': person.get('page'), 'date': vote.get('date'),
            'vote': person.get('vote'), 'party': person.get('party'),
        })
for row in rows:
    row['votes'] = votes_by_name.get(row['name'], [])
output['method'] = 'Observed serving attendees in unique imported Hylte protocol meetings, plus individually documented roll-call votes. Counts are observations in available sources; no attendance rate or complete historical ranking is calculated.'
output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2))
print(json.dumps({'meetings':len(meetings),'politicians':len(rows),'motion_signatures':len(initiatives)}, ensure_ascii=False))
