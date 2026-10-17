const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('assets/js/neon-city.js','utf8');
function boot(provider){const sandbox={window:{},document:{addEventListener(){}}};vm.runInNewContext(code,sandbox);return sandbox.window.NeonCity.createExploration(provider);}
const key='escape_neon_city_progress_v1';
const data=new Map([['escape_quiet_forest_garden_v1','{"stage":3}'],['escape_music_volume','0.4']]);
let writes=0;const storage={getItem:k=>data.get(k)??null,setItem(k,v){assert.equal(k,key);writes++;data.set(k,v)},removeItem(k){assert.equal(k,key);data.delete(k)}};
let game=boot(()=>storage);assert.equal(game.current,'alley');assert.equal(game.discovered.length,1);assert.equal(writes,0);
assert.equal(game.move('north'),false);assert.equal(writes,0);
for(const [dir,location,count] of [['east','market',2],['south','ramen',3],['west','corner',4],['north','alley',4]]){
 assert(game.move(dir));game=boot(()=>storage);assert.equal(game.current,location);assert.equal(game.discovered.length,count);
}
assert.equal(writes,4);assert.deepEqual(Object.keys(JSON.parse(data.get(key))).sort(),['current','discovered']);
game.move('east');const reopened=boot(()=>storage);game.move('south');reopened.restore();assert.equal(reopened.current,'ramen');
game.restart();assert(!data.has(key));game=boot(()=>storage);assert.equal(game.current,'alley');assert.equal(game.discovered.length,1);
assert.equal(data.get('escape_quiet_forest_garden_v1'),'{"stage":3}');assert.equal(data.get('escape_music_volume'),'0.4');
const invalid=[null,'','{','null','[]','1','{}',JSON.stringify({current:'removed',discovered:['alley']}),JSON.stringify({current:'market',discovered:['alley']}),JSON.stringify({current:'alley',discovered:['alley','alley']}),JSON.stringify({current:'alley',discovered:['alley','removed']}),JSON.stringify({current:'alley',discovered:'alley'}),JSON.stringify({current:'alley',discovered:[]}),JSON.stringify({current:'alley',discovered:['alley'],version:0}),JSON.stringify({current:'__proto__',discovered:['alley','__proto__']})];
for(const raw of invalid){data.delete(key);if(raw!==null)data.set(key,raw);game=boot(()=>storage);assert.equal(game.current,'alley');assert.equal(game.discovered.length,1);assert(game.move('east'));assert.equal(boot(()=>storage).current,'market');}
const fail=()=>{throw Error('blocked')};
for(const provider of [()=>null,fail,()=>({getItem:fail}),()=>({getItem:()=>null,setItem:fail}),()=>{let value=null;return {getItem:()=>value,setItem(k,v){value=v},removeItem:fail}}]){
 game=boot(provider);for(const d of ['east','south','west'])assert(game.move(d));game.restore();assert.equal(game.current,'corner');game.restart();assert.equal(game.current,'alley');assert.equal(game.discovered.length,1);assert(game.move('east'));assert.equal(game.storageAvailable,false);
}
console.log('PASS: fresh visit, valid moves/revisits saved, fresh-VM reload at all four locations, reopen restoration, reset removes only City key, other-place data intact.');
console.log('PASS: 15 missing/invalid/obsolete payloads; storage absent/getter/read/write/remove failures retain session play. Reload tests use fake storage and fresh Node VMs, not a real browser.');


// Original five-landmark saves migrate without discarding valid discoveries.
data.set(key,JSON.stringify({current:'rooftop',discovered:['alley','market','rooftop','corner','ramen']}));
game=boot(()=>storage);assert.equal(game.current,'ramen');assert.equal(game.discovered.length,4);
game.move('north');game=boot(()=>storage);assert.equal(game.current,'market');assert.equal(game.discovered.length,4);
console.log('PASS legacy five-place save migration: Rooftop maps to hủ tiếu and all four shop discoveries survive.');
