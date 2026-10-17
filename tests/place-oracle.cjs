const fs=require('fs'),vm=require('vm'),assert=require('assert');
function boot(reduced=false){
 const nodes={},timers=new Map();let serial=0;
 const document={activeElement:null};
 function node(){const classes=new Set();return {attrs:{},isConnected:true,hidden:false,disabled:false,inert:false,style:{setProperty(){}},classList:{add(...v){v.forEach(x=>classes.add(x));},remove(...v){v.forEach(x=>classes.delete(x));},contains:x=>classes.has(x)},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},addEventListener(k,f){if(k === 'close')this.onclose=f;else this[k]=f;},focus(){document.activeElement=this;},closest(){return null;},remove(){this.isConnected=false;}};}
 const dialog=node();document.createElement=()=>dialog;document.body={append(){}};
 dialog.querySelector=s=>nodes[s]||(nodes[s]=node());
 dialog.querySelectorAll=()=>[nodes['.oracle-close'],...(!nodes['.oracle-back'].hidden&&!nodes['.oracle-back'].disabled?[nodes['.oracle-back']]:[]),...(!nodes['.oracle-front'].inert?[nodes['.oracle-title']]:[])];
 dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;};
 const media={matches:reduced,addEventListener(k,f){this.changed=f;},removeEventListener(){this.changed=null;}};
 const window={matchMedia:()=>media};vm.runInNewContext(fs.readFileSync('assets/js/place-oracle.js','utf8'),{window,document,setTimeout(fn){timers.set(++serial,fn);return serial;},clearTimeout(id){timers.delete(id);}});
 const api=window.PlaceOracle.create(),trigger=node();
 return {api,nodes,dialog,document,media,trigger,timers,window,node,cards:window.PlaceOracle.cards,flush(){for(const [id,fn] of [...timers]){timers.delete(id);fn();}}};
}
for(const reduced of [false,true]){
 const a=boot(reduced),n=a.nodes;assert.equal(Object.keys(a.cards).length,5);assert.equal(a.api.open('unknown'),false);
 const expected={sea:['THE TIDE',"You don't have to hold on to everything."],rainy:['THE PAUSE','Rest is not a step backward.'],quiet:['THE BECOMING','You are not behind. You are becoming.'],city:['THE POSSIBILITY','Your story is bigger than the world you know.'],impossible:['THE WONDER','You are still allowed to believe in beautiful things.']};
 assert.equal(new Set(Object.values(a.cards).map(c=>c.motif)).size,5);
 for(const [id,[title,message]] of Object.entries(expected)){assert.equal(a.cards[id].title,title);assert.equal(a.cards[id].message,message);assert(a.cards[id].translation.length>20);assert(a.cards[id].reflection.length>60);}
 for(const [id,card] of Object.entries(a.cards)){
  assert(a.api.open(id,{trigger:a.trigger}));assert(!a.api.open(id));assert(n['.oracle-front'].inert);assert.equal(a.document.activeElement,n['.oracle-back']);
  for(const [selector,value] of [['.oracle-title',card.title],['.oracle-english',card.message],['.oracle-vietnamese',card.translation],['.oracle-reflection',card.reflection]])assert.equal(n[selector].textContent,value);
  assert(n['.oracle-illustration'].innerHTML.includes(card.motif));n['.oracle-back'].click();const count=a.timers.size;n['.oracle-back'].click();assert.equal(a.timers.size,count);a.flush();assert(a.dialog.classList.contains('oracle-revealed'));assert(!n['.oracle-front'].inert);assert(n['.oracle-back'].hidden);assert.equal(a.document.activeElement,n['.oracle-title']);
  a.dialog.keydown({key:'Tab',shiftKey:false,stopPropagation(){},preventDefault(){}});assert.equal(a.document.activeElement,n['.oracle-close']);
  n['.oracle-close'].click();assert(!a.dialog.open);assert.equal(a.document.activeElement,a.trigger);assert.equal(a.timers.size,0);
 }
 a.api.open('sea');n['.oracle-back'].click();a.api.close();a.flush();assert(!a.dialog.classList.contains('oracle-revealed'));
 a.dialog.scrollTop=300;a.api.open('rainy');assert.equal(a.dialog.scrollTop,0);assert(!n['.oracle-back'].hidden);a.dialog.onclose();assert(a.dialog.open);a.dialog.keydown({key:'Escape',stopPropagation(){},preventDefault(){}});assert(!a.dialog.open);
 a.api.open('sea');a.dialog.open=false;a.dialog.onclose();assert.equal(a.timers.size,0);assert(a.api.open('quiet'));a.api.close();
 a.api.open('quiet');a.dialog.cancel({preventDefault(){}});assert(!a.dialog.open);
 a.api.open('city');n['.oracle-back'].click();a.media.matches=true;a.media.changed();assert(a.dialog.classList.contains('oracle-revealed'));assert.equal(a.timers.size,0);
 a.api.destroy();assert(!a.dialog.isConnected);assert.equal(a.api.open('sea'),false);
}
console.log('PASS Oracle simulated DOM: five bilingual cards, unique motifs, reveal, duplicate guard, close/cancel/Escape, focus return and Tab wrap, animation cancellation, reopen, reduced motion and destroy.');
module.exports={boot};

// Verify lift precedes flip and reveal, with cancellation independent of animation events.
const sequence=boot();sequence.api.open('sea');sequence.nodes['.oracle-back'].click();
assert(sequence.dialog.classList.contains('oracle-rising'));assert(!sequence.dialog.classList.contains('oracle-flipping'));assert(!sequence.dialog.classList.contains('oracle-revealed'));
const callbacks=[...sequence.timers.values()];callbacks[0]();assert(sequence.dialog.classList.contains('oracle-flipping'));assert(!sequence.dialog.classList.contains('oracle-revealed'));callbacks[1]();assert(sequence.dialog.classList.contains('oracle-revealed'));sequence.api.close();
console.log('PASS approved titles/messages, distinct motifs, reveal phase order, queued-close race and scroll reset.');

