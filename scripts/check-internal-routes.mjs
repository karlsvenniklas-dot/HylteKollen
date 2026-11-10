import catalog from '../data/public-catalog.json' with { type: 'json' };
import followups from '../data/followups.json' with { type: 'json' };
import observations from '../data/politician-observations.json' with { type: 'json' };
import historicalProtocols from '../data/historical-protocols.json' with { type: 'json' };
import archiveIndex from '../data/historical-protocol-archive-index.json' with { type: 'json' };

const routes = new Set(['/podd','/', '/radar', '/hyltepulsen', '/koalitionskartan', '/bevakningar', '/moten', '/moteskompisen', '/debattkartan', '/motioner', '/fragor', '/protokolltolken', '/protokollanalys', '/beslutsdiff', '/kallpaket', '/veckobrief', '/jamfor', '/arenden', '/arendekedjor', '/uppfoljning', '/kallglapp', '/avtalsvakten', '/ekonomi', '/statistik', '/analys', '/politiker', '/orter', '/fraga', '/granskningsko', '/data', '/nyhetsbrev', '/motesbrief', '/beslutskontroll', '/andringar', '/attfolja', '/kalender', '/minort', '/min-ort']);
const dynamic = [...new Set([
  ...catalog.meetings.map(meeting => '/moten/' + meeting.id),
  ...catalog.meetings.flatMap(meeting => meeting.items.map(item => '/arenden/' + item.id)),
  ...catalog.documents.map(document => '/dokument/' + document.id),
  ...historicalProtocols.records.map(document => '/dokument/' + document.id),
  ...archiveIndex.records.filter(document => !catalog.documents.some(row => row.id === document.id)).map(document => '/dokument/' + document.id),
  ...followups.records.map(record => '/uppfoljning/' + record.id),
  ...observations.politicians.map(person => '/politiker/' + person.id),
])];
const invalid = dynamic.filter(path => !/^\/(moten|arenden|dokument|uppfoljning|politiker)\/[a-z0-9-]+$/i.test(path));
const duplicate = dynamic.filter((path, index) => dynamic.indexOf(path) !== index);
const result = { staticRoutes: routes.size, dynamicRoutes: dynamic.length, invalid, duplicate: [...new Set(duplicate)] };
console.log(JSON.stringify(result, null, 2));
if (invalid.length || duplicate.length) process.exit(1);
