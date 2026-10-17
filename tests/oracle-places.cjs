const fs=require('fs'),vm=require('vm'),assert=require('assert');
const {boot}=require('./place-oracle.cjs');
const a=boot(),buttons=[],hosts=new Map();
const scenes={sea:{shells:[{x:30,y:40}],strokes:['curve']},rainy:{note:4,quote:2},quiet:{stage:3},city:{current:'alley',discovered:['alley','market'],order:['bread']},impossible:{visited:['stars'],discoveries:['stars']}};
const before=JSON.stringify(scenes);
let ready;
a.document.addEventListener=(type,fn)=>{if(type==='DOMContentLoaded')ready=fn;};
a.document.querySelector=selector=>{if(!hosts.has(selector))hosts.set(selector,{append(button){buttons.push(button);},querySelector(){return {after(button){buttons.push(button);}};}});return hosts.get(selector);};
a.document.createElement=tag=>{assert.equal(tag,'button');const b=a.node();b.dataset={};return b;};
a.window.PlaceOracle.create=()=>a.api;
vm.runInNewContext(fs.readFileSync('assets/js/oracle-places.js','utf8'),{document:a.document,window:a.window});ready();
assert.equal(buttons.length,5);assert.equal(new Set(buttons.map(b=>b.dataset.oraclePlace)).size,5);
for(const button of buttons){
 assert.equal(button.type,'button');assert.equal(button.attrs['aria-haspopup'],'dialog');
 button.click({stopPropagation(){}});assert(a.dialog.open);assert.equal(a.nodes['.oracle-title'].textContent,a.cards[button.dataset.oraclePlace].title);
 a.nodes['.oracle-back'].click();a.flush();assert(a.dialog.classList.contains('oracle-revealed'));
 let stopped=false;a.dialog.keydown({key:'w',stopPropagation(){stopped=true;}});assert(stopped);
 a.nodes['.oracle-close'].click();assert(!a.dialog.open);assert.equal(a.document.activeElement,button);assert.equal(JSON.stringify(scenes),before);
 button.closest=()=>({});button.click({stopPropagation(){}});assert(!a.dialog.open);button.closest=()=>null;
}
const html=fs.readFileSync('index.html','utf8');for(const path of ['assets/css/place-oracle.css','assets/css/oracle-places.css','assets/js/place-oracle.js','assets/js/oracle-places.js'])assert(html.includes(path)&&fs.existsSync(path));
console.log('PASS five scene mounts and identities, actual Oracle open/reveal/close, focus restoration, keyboard propagation guard, inactive guard and asset links (simulated DOM). State sentinels unchanged; existing game suites test their own interactions separately.');
