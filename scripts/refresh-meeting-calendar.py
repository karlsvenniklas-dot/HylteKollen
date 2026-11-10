#!/usr/bin/env python3
"""Refresh calendar independently of PDF imports; retain old dates on failure."""
import datetime
import hashlib
import html
import json
import re
import urllib.request
from pathlib import Path
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parents[1]
URL = 'https://meetings.hylte.se/'
now = datetime.datetime.now(datetime.timezone.utc).isoformat()
request = urllib.request.Request(URL, headers={'User-Agent': 'Hyltekollen/1.0 municipal calendar check'})
with urllib.request.urlopen(request, timeout=45) as response:
    raw = response.read()
page = raw.decode('utf-8-sig')
rows = {}
for path, date in re.findall(r'href="([^\"]*/mote-(20\d{2}-\d\d-\d\d)[^\"]*)"', page):
    if date < now[:10]:
        continue
    for slug, title in [('kommunfullmaktige', 'Kommunfullmäktige'), ('kommunstyrelsens-arbetsutskott', 'Kommunstyrelsens arbetsutskott'), ('kommunstyrelsen', 'Kommunstyrelsen')]:
        if '/' + slug + '/' in path:
            url = urljoin(URL, html.unescape(path))
            rows[url] = {'date': date, 'title': title, 'url': url}
if not rows:
    raise SystemExit('No recognizable future meetings: prior calendar preserved; not evidence of no meetings.')
snapshot = ROOT / 'data/snapshots' / (hashlib.sha256(URL.encode()).hexdigest()[:24] + '-' + hashlib.sha256(raw).hexdigest() + '.html')
if not snapshot.exists():
    snapshot.write_bytes(raw)
for name in ['catalog.json', 'public-catalog.json']:
    target = ROOT / 'data' / name
    data = json.loads(target.read_text())
    data['upcoming'] = sorted(rows.values(), key=lambda row: (row['date'], row['title']))
    data['upcomingCheckedAt'] = now
    temporary = target.with_suffix('.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(target)
print(json.dumps({'checkedAt': now, 'upcoming': list(rows.values())}, ensure_ascii=False))
