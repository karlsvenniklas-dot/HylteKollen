export const filterKeys = ['party', 'person', 'outcome', 'implementation', 'query'];
/** @param {Record<string,string>} filters */
export function timelineLink(filters) {
  const params = new URLSearchParams();
  for (const key of filterKeys) if (filters[key]) params.set('tl_'+key, filters[key]);
  return '/statistik'+(params.size?'?'+params.toString():'')+'#partitidslinje';
}
/** @param {string} search @param {Record<string,string[]>} allowed */
export function readTimelineFilters(search, allowed) {
  const params = new URLSearchParams(search);
  const values = {party:'',person:'',outcome:'',implementation:'',query:''};
  let invalid = false;
  for (const key of filterKeys) {
    const value = params.get('tl_'+key) || '';
    if (key==='query') { values.query=value.slice(0,150); if(value.length>150)invalid=true; }
    else if (!value || allowed[key]?.includes(value)) values[key]=value;
    else invalid=true;
  }
  return {values,invalid};
}
