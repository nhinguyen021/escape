const fs=require('fs'),vm=require('vm'),assert=require('assert');
const {boot}=require('./place-oracle.cjs');
const source=fs.readFileSync('assets/js/oracle-places.js','utf8');
const key='escape_place_oracle_v1',ids=['sea','rainy','quiet','city','impossible'];
function start(storage,throws=false){
 const a=boot(),buttons=[];let ready;
 Object.defineProperty(a.window,'localStorage',{get(){if(throws)throw Error('denied');return storage;}});
 a.document.addEventListener=(type,fn)=>{ready=fn;};
 a.document.querySelector=()=>({append(b){buttons.push(b);},querySelector(){return {after(b){buttons.push(b);}};}});
 a.document.createElement=()=>{const b=a.node();b.dataset={};return b;};
 a.window.PlaceOracle.create=()=>a.api;
 vm.runInNewContext(source,{window:a.window,document:a.document});ready();
 return {...a,buttons,model:a.window.PlaceOracleProgress.createProgress};
}
const data=new Map([['escape_neon_city_progress_v1','city sentinel'],['escape_somewhere_impossible_progress_v1','magic sentinel'],['forest','forest sentinel'],['sea','sea sentinel'],['rain','rain sentinel']]);
const original=[...data];let writes=0;
const storage={getItem:k=>data.get(k)??null,setItem(k,v){assert.equal(k,key);writes++;data.set(k,v);},clear(){throw Error('must never clear');},removeItem(){throw Error('must never remove');}};
let a=start(storage);assert(a.buttons.every(b=>!b.classList.contains('oracle-discovered')));assert.equal(writes,0);
for(let i=0;i<ids.length;i++){
 const b=a.buttons[i];b.click({stopPropagation(){}});assert(a.dialog.open);assert(b.classList.contains('oracle-discovered'));assert(b.attrs['aria-label'].includes('đọc lại'));
 a.api.close();assert.equal(a.document.activeElement,b);
 const saved=JSON.parse(data.get(key));ids.forEach((id,j)=>assert.equal(saved.cards[id],j<=i));
 const count=writes;b.click({stopPropagation(){}});a.api.close();assert.equal(writes,count);
 a=start(storage);a.buttons.forEach((button,j)=>assert.equal(button.classList.contains('oracle-discovered'),j<=i));
}
for(const [k,v] of original)assert.equal(data.get(k),v);
for(const raw of [null,'','{','null','[]','true','42','{}','{"version":2,"cards":{"sea":true}}','{"version":1,"cards":[]}','{"version":1,"cards":{"sea":"true","rainy":1,"quiet":null}}']){
 data.delete(key);if(raw!==null)data.set(key,raw);a=start(storage);assert(a.buttons.every(b=>!b.classList.contains('oracle-discovered')));a.buttons[0].click({stopPropagation(){}});a.api.close();assert.equal(JSON.parse(data.get(key)).cards.sea,true);
}
data.set(key,JSON.stringify({version:1,cards:{sea:true,rainy:'yes',unknown:true}}));a=start(storage);assert(a.buttons[0].classList.contains('oracle-discovered'));assert(!a.buttons[1].classList.contains('oracle-discovered'));
for(const [store,throws] of [[undefined,false],[null,false],[null,true],[{getItem(){throw Error('read');}},false],[{getItem(){return null;},setItem(){throw Error('quota');}},false]]){
 a=start(store,throws);for(const b of a.buttons){b.click({stopPropagation(){}});assert(a.dialog.open);a.nodes['.oracle-back'].click();a.flush();a.api.close();assert(b.classList.contains('oracle-discovered'));b.click({stopPropagation(){}});assert(a.dialog.open);a.api.close();}
}
const model=a.model(()=>null);assert(!model.discover('unknown'));assert(!model.has('unknown'));
console.log('PASS Oracle persistence: fresh visit, five independent flags, real reveal opens/closes, repeat/revisit, fresh-VM reload, 11 invalid/missing payloads, partial validation, getter/read/write/unavailable failures, isolated writes and no duplicate saves. Simulated DOM/storage, not live-browser reload.');
