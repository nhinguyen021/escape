const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('assets/js/impossible.js','utf8');
function boot(reduced=false){
 const ids=['impossible-world','preview-scene','imp-garden','imp-realm','imp-return','imp-object','imp-realm-title','imp-realm-en','imp-realm-intro','imp-object-art','imp-object-label','imp-discovery','preview-back','imp-completion','imp-save-note','imp-reset-progress'];
 const nodes={};function element(){const classes=new Set();return {dataset:{},hidden:false,inert:false,disabled:false,attrs:{},classList:{contains(c){return classes.has(c)},toggle(c,on){on?classes.add(c):classes.delete(c)},add(c){classes.add(c)},remove(c){classes.delete(c)}},addEventListener(e,f){this[e]=f},setAttribute(k,v){this.attrs[k]=v},focus(){this.focused=true},offsetWidth:100};}
 ids.forEach(id=>nodes[id]=element());const portals=['moonflower','isles','crystal','stars'].map(id=>{const n=element();n.dataset.impPortal=id;n.badge={textContent:""};n.querySelector=()=>n.badge;return n});nodes['impossible-world'].querySelectorAll=()=>portals;nodes['preview-scene'].dataset.destination='impossible';let observe;const events={},timers=new Map();let serial=0;
 const document={hidden:false,getElementById:id=>nodes[id],addEventListener(e,f){events[e]=f}};
 const context={window:{confirm:()=>true,matchMedia:()=>({matches:reduced})},document,MutationObserver:class{constructor(cb){observe=cb}observe(){}},setTimeout(fn){timers.set(++serial,fn);return serial},clearTimeout(id){timers.delete(id)}};
 vm.runInNewContext(source,context);events.DOMContentLoaded();return {context,nodes,portals,document,events,observe:()=>observe(),flush(){for(const [id,fn] of [...timers]){timers.delete(id);fn()}},timers};
}
for(const reduced of [false,true]){
 const app=boot(reduced),n=app.nodes;
 for(const p of app.portals){p.click();if(!reduced){assert(p.disabled);const other=app.portals.find(x=>x!==p);other.click();n['imp-object'].click();}app.flush();assert.equal(n['impossible-world'].dataset.realm,p.dataset.impPortal);assert(n['imp-garden'].hidden);assert(!n['imp-realm'].hidden);assert(n['imp-realm-title'].focused);
 const messages=new Set();for(let i=0;i<7;i++){n['imp-object'].click();messages.add(n['imp-discovery'].textContent);}assert.equal(messages.size,3);assert(n['imp-object'].attrs['aria-label']);
 n['imp-return'].click();app.flush();assert(!n['imp-garden'].hidden);assert(n['imp-realm'].hidden);assert(p.focused);
 }
 assert(n['impossible-world'].classList.contains('imp-awakened'));assert(!n['imp-completion'].hidden);assert(app.portals.every(p=>p.badge.textContent.includes('Đã đánh thức')));
 app.context.window.confirm=()=>false;n['imp-reset-progress'].click();assert(!n['imp-completion'].hidden);
 app.context.window.confirm=()=>true;n['imp-reset-progress'].click();assert(n['imp-completion'].hidden);assert(app.portals.every(p=>!p.classList.contains('imp-found')));
 app.portals[0].click();n['preview-back'].click();app.flush();assert(!n['imp-garden'].hidden);assert(n['imp-realm'].hidden);
 app.portals[1].click();n['preview-scene'].inert=true;app.observe();app.flush();assert(n['imp-realm'].hidden);assert.equal(n['impossible-world'].attrs['aria-busy'],'false');
 n['preview-scene'].inert=false;app.portals[2].click();app.flush();app.document.hidden=true;const before=n['imp-discovery'].textContent;n['imp-object'].click();assert.equal(n['imp-discovery'].textContent,before);
}
console.log('PASS all four portals, return/focus, 7 repeated interactions per world, 3 messages each, transition lock, exit cancellation, hidden-page guard and reduced motion in simulated DOM.');

console.log('PASS discovery badges, garden unlock, cancel reset and confirmed reset in simulated DOM.');
