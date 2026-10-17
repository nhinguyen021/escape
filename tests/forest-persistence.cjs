const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('assets/js/forest-garden.js','utf8');
const memory=new Map();let writes=0;
const storage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>{writes++;memory.set(key,value);}};
function boot(store=storage,confirmation=true,throwAccess=false){
 const callbacks={};
 class El{constructor(){this.events={};this.dataset={};this.classList={remove(){},add(){}};this.attrs={};}addEventListener(k,f){this.events[k]=f;}setAttribute(k,v){this.attrs[k]=v;}focus(){}}
 const ids=['forest-scene','forest-plant','forest-earth','forest-feedback','forest-restart','forest-stage','forest-quote','forest-garden-description','forest-storage-note'];
 const els=Object.fromEntries(ids.map(id=>[id,new El()]));
 const buttons=['plant','water','sunlight'].map(action=>{const el=new El();el.dataset.gardenAction=action;return el;});
 els['forest-scene'].querySelectorAll=()=>buttons;
 let confirms=0;
 const window={confirm:()=>{confirms++;return confirmation;}};
 Object.defineProperty(window,'localStorage',{get(){if(throwAccess)throw Error('SecurityError');return store;}});
 const context={window,document:{hidden:false,getElementById:id=>els[id],addEventListener:(n,f)=>callbacks[n]=f}};
 vm.createContext(context);vm.runInContext(source,context);callbacks.DOMContentLoaded();
 return {els,buttons,key:window.EscapeForestStorageKey,Model:window.EscapeForestGarden,confirms:()=>confirms};
}
let page=boot(),key=page.key;
assert.equal(key,'escape_quiet_forest_garden_v1');assert.equal(page.els['forest-plant'].dataset.stage,'empty');assert.equal(writes,0);
page.buttons[1].events.click();assert.equal(writes,0);
for(const [i,action] of ['plant','water','sunlight','water'].entries()){
 page.buttons.find(b=>b.dataset.gardenAction===action).events.click();
 assert.deepEqual(JSON.parse(memory.get(key)),{stage:i});assert.equal(writes,i+1);
 page=boot();assert.equal(page.els['forest-plant'].dataset.stage,String(i));
 assert.equal(page.els['forest-stage'].textContent,['Hạt mầm','Mầm non','Cây xanh','Hoa nở'][i]);
 assert.equal(page.els['forest-quote'].textContent,['Mọi khởi đầu đều bé nhỏ.','Từng chút một cũng là tiến về phía trước.','Bạn được phép lớn lên chậm rãi.','Một chút chăm chút đã đưa bạn đi xa đến vậy.'][i]);
}
const saved=memory.get(key),savedWrites=writes;
page=boot(storage,false);page.els['forest-restart'].events.click();assert.equal(page.confirms(),1);assert.equal(memory.get(key),saved);assert.equal(writes,savedWrites);assert.equal(boot().els['forest-plant'].dataset.stage,'3');
page=boot(storage,true);page.els['forest-restart'].events.click();assert.equal(page.confirms(),1);assert.deepEqual(JSON.parse(memory.get(key)),{stage:null});assert.equal(boot().els['forest-plant'].dataset.stage,'empty');
console.log('PASS reload simulation: every stage and quote restored; bloom persists; cancelled reset preserves saved bloom; confirmed reset persists empty soil; only valid actions write.');
const invalid=[undefined,'','{broken','null','[]','3','true','{}','{"stage":-1}','{"stage":4}','{"stage":1.5}','{"stage":"0"}','{"stage":false}','{"stage":[]}','{"stage":0,"animation":"water"}'];
for(const raw of invalid){memory.clear();if(raw!==undefined)memory.set(key,raw);page=boot();assert.equal(page.els['forest-plant'].dataset.stage,'empty');page.buttons[0].events.click();assert.deepEqual(JSON.parse(memory.get(key)),{stage:0});}
console.log(`PASS invalid-data simulation: ${invalid.length} missing/malformed/out-of-range payloads fall back safely and can be replaced by a valid save.`);
for(const [store,throwAccess] of [[undefined,false],[null,false],[{getItem(){throw Error('denied');}},false],[{getItem(){return null;},setItem(){throw Error('quota');}},false],[storage,true]]){
 // Explicit null is used for unavailable storage (undefined uses boot default).
 page=boot(store===undefined?null:store,true,throwAccess);
 for(const action of ['plant','water','sunlight','water'])page.buttons.find(b=>b.dataset.gardenAction===action).events.click();
 assert.equal(page.els['forest-plant'].dataset.stage,'3');assert(page.els['forest-storage-note'].textContent.includes('Không lưu được'));
 page.els['forest-restart'].events.click();assert.equal(page.els['forest-plant'].dataset.stage,'empty');
}
console.log('PASS unavailable-storage simulation: missing storage, getter/read/write errors all allow full session play and confirmed reset.');
assert.deepEqual([...memory.keys()].filter(k=>k!==key),[]);
console.log('These are fresh VM/DOM instances sharing fake storage, not real-browser reload tests.');
