import {spawnSync} from 'node:child_process';
const checks=['test-usability','test-change-baseline','test-watch-filters','test-visual-tools','test-review-tools','test-source-functions','test-manual-reviews','test-protocol-review-updates','validate-superteam-data','check-internal-routes'];
for(const name of checks){console.log('\nChecking '+name);const r=spawnSync(process.execPath,['scripts/'+name+'.mjs'],{stdio:'inherit'});if(r.error)throw r.error;if(r.status!==0)process.exit(r.status||1);}
console.log('Prepublication data and source-code checks passed. This does not replace browser/mobile interaction testing.');
