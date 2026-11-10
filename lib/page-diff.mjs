// Compare extracted pages, not political meaning. Page shifts remain visible.
export function pageDiff(before, after) {
  return Array.from({length: Math.max(before.length, after.length)}, (_, i) => ({
    page: i + 1, before: before[i] ?? null, after: after[i] ?? null,
    kind: before[i] === after[i] ? 'unchanged' : before[i] == null ? 'added' : after[i] == null ? 'removed' : 'changed'
  })).filter(row => row.kind !== 'unchanged');
}

// Exact block comparison. Whitespace is retained; no semantic claims or OCR correction.
export function paragraphDiff(before = '', after = '') {
  const split = text => text ? text.split(/\n\s*\n/).filter(s => s.trim()) : [];
  const a = split(before), b = split(after);
  if (a.length > 250 || b.length > 250) return {limited:true, blocks:[{kind:'removed',text:before},{kind:'added',text:after}].filter(x=>x.text)};
  const dp = Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
  for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]===b[j]?1+dp[i+1][j+1]:Math.max(dp[i+1][j],dp[i][j+1]);
  const blocks=[];let i=0,j=0;
  while(i<a.length||j<b.length){
    if(i<a.length&&j<b.length&&a[i]===b[j]){blocks.push({kind:'unchanged',text:a[i++]});j++;}
    else if(i<a.length&&(j===b.length||dp[i+1][j]>=dp[i][j+1]))blocks.push({kind:'removed',text:a[i++]});
    else blocks.push({kind:'added',text:b[j++]});
  }
  return {limited:false,blocks};
}
