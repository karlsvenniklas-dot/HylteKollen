#!/usr/bin/env python3
"""Build the reviewed index of official Hylte Kommunfullmäktige recordings."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = "https://www.hylte.se/kommun-och-politik/kommunens-organisation/kommunfullmaktige/webbsandning-av-kommunfullmaktige"
CHANNEL = "https://www.youtube.com/@Hyltekommun"
VIDEOS = {
 "2026-09-08":"iVBk2_zrYcg","2026-06-02":"kBfA4pwgTJc","2026-05-05":"qAG1cnTcyIo","2026-03-03":"jYa0J-KnNx8","2026-01-27":"d-g6eLcznBI",
 "2025-12-16":"ScjmtShJlTA","2025-11-11":"kKCIceH7FmI","2025-10-21":"P3lEBJ9_wps","2025-09-16":"_mXuMxQriwQ","2025-06-03":"HifaFfwybJo","2025-05-06":"tN5M3px-9Dg","2025-03-04":"ZDh4DnrjQi0",
 "2024-12-10":"aQxWSftWMgo","2024-11-19":"3V7Ts-KQfZc","2024-10-22":"5tWDKqD8yfk","2024-09-10":"VfGeuavMDsc","2024-06-13":"8X0zC2gKzeA","2024-05-07":"f11pUqTRvko","2024-03-12":"-3K56UF-AFs",
 "2023-12-12":"mXlpCrHmqaA","2023-11-14":"tzWT_aw8lfM","2023-10-17":"30gdCwMur_c","2023-09-12":"fPTcXoPXeRY","2023-06-13":"utfyPyVbHA8","2023-05-02":"jcC932Dv9bg","2023-03-16":"rz9W1b6jqho",
 "2022-12-08":"kPraaGcIXK4","2022-12-07":"8X28zBKPicQ","2022-11-15":"wPSW-le6s7o","2022-10-20":"fryMkcDt2so","2022-09-01":"ldAFjLK9eLM","2022-06-16":"AiXsMbhyLX8","2022-05-05":"1TyJlv4VwCo","2022-02-17":"fiTKepO7CBs"
}
ALTERNATES = {"2026-09-08":["lm6Wdh-4yG8"],"2025-09-16":["Z-_j1LcC2Mg"],"2025-06-03":["aFMl-xk7ZkI"]}
records=[]
for date, video_id in sorted(VIDEOS.items(), reverse=True):
 records.append({
  "id":"kf-video-"+date,"body":"Kommunfullmäktige","meetingDate":date,"title":"Kommunfullmäktige "+date,
  "youtubeVideoId":video_id,"watchUrl":"https://www.youtube.com/watch?v="+video_id,"embedUrl":"https://www.youtube.com/embed/"+video_id,
  "archiveStatus":"official_channel_only" if date=="2025-12-16" else "municipality_listed","verification":"verified",
  "evidence":[{"kind":"official_channel_feed" if date=="2025-12-16" else "municipality_archive","url":CHANNEL if date=="2025-12-16" else ARCHIVE,"observedAt":"2026-09-16"}],
  "alternateRecordings":[{"youtubeVideoId":value,"reason":"superseded_live"} for value in ALTERNATES.get(date,[])],"chapters":[]
 })
output={"schemaVersion":1,"checkedAt":"2026-09-16","scope":"Hylte kommun","channel":{"id":"UCpdF5Jd0TYuFrpP04tmq-WA","name":"Hylte kommun","url":CHANNEL},"archiveUrl":ARCHIVE,"coverage":{"verifiedRecordings":len(records),"municipalityListed":sum(x["archiveStatus"]=="municipality_listed" for x in records),"officialChannelOnly":sum(x["archiveStatus"]=="official_channel_only" for x in records),"verifiedChapters":0},"records":records}
(ROOT/"data/meeting-videos.json").write_text(json.dumps(output,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(output["coverage"]))
