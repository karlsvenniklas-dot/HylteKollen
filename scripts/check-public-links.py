#!/usr/bin/env python3
"""Check every source URL used by the public Hyltekollen import."""
import json, sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
def urls():
    catalog=json.loads((ROOT/'data/public-catalog.json').read_text())
    followups=json.loads((ROOT/'data/followups.json').read_text())
    historical=json.loads((ROOT/'data/historical-protocols.json').read_text())
    found=[*(x['url'] for x in catalog['meetings']), *(x['url'] for x in catalog['upcoming']), *(x['url'] for x in catalog['documents'])]
    found.extend(source['url'] for source in followups.get('sources', {}).values())
    found.extend(source['url'] for row in followups.get('records', []) for source in row.get('sources', []))
    found.extend(row['meetingUrl'] for row in historical.get('records', []))
    found.extend(row['url'] for row in historical.get('records', []))
    return sorted(set(found))
def check(url):
    try:
        with urlopen(Request(url, method='HEAD', headers={'User-Agent':'Hyltekollen link check/1.0'}), timeout=20) as response:
            return url, 200 <= response.status < 400, response.status
    except HTTPError as error: return url, False, error.code
    except (URLError, TimeoutError, OSError) as error: return url, False, str(getattr(error, 'reason', error))
def main():
    source_urls=urls(); failed=[]
    with ThreadPoolExecutor(max_workers=12) as pool:
        for future in as_completed([pool.submit(check,url) for url in source_urls]):
            url, ok, detail=future.result()
            if not ok: failed.append({'url':url,'detail':detail})
    print(json.dumps({'checked':len(source_urls),'working':len(source_urls)-len(failed),'failed':failed},ensure_ascii=False,indent=2))
    return bool(failed)
if __name__ == '__main__': sys.exit(main())
