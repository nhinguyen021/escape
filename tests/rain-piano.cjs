const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
let contextTime=0,created=0;
class Param { value=0;setValueAtTime(v,t){assert(Number.isFinite(v)&&Number.isFinite(t));this.value=v;}linearRampToValueAtTime(v,t){this.setValueAtTime(v,t);}exponentialRampToValueAtTime(v,t){assert(v>0);this.setValueAtTime(v,t);}cancelAndHoldAtTime(){}cancelScheduledValues(){} }
class Node {constructor(){this.gain=new Param();this.frequency=new Param();}connect(){}disconnect(){this.disconnected=true;}start(t){assert(t>=0);}stop(t){this.stopAt=t;} }
const nodes=[];const ctx={state:'running',get currentTime(){return contextTime;},createGain:()=>new Node(),createBiquadFilter:()=>new Node(),createOscillator:()=>{created++;const n=new Node();nodes.push(n);return n;},resume:async()=>{ctx.state='running';}};
class El { constructor(){this.events={};this.attrs={};this.classSet=new Set();this.classList={add:c=>this.classSet.add(c),remove:c=>this.classSet.delete(c),toggle:(c,v)=>v?this.classSet.add(c):this.classSet.delete(c)};}addEventListener(n,f){this.events[n]=f;}setAttribute(k,v){this.attrs[k]=v;}closest(){return null;} }
const ids=['rain-piano-status','rain-guide','rain-quote','rain-guide-progress','rain-change-quote','rain-piano-volume','rain-piano-volume-value'];
const els=Object.fromEntries(ids.map(id=>[id,new El()]));const keys=Array.from({length:8},()=>new El());const docEvents={};
const document={hidden:false,getElementById:id=>els[id],querySelector:()=>null,addEventListener:(n,f)=>docEvents[n]=f};
let timerId=0;const timers=new Map();
const sandbox={window:{},document,setTimeout:f=>{timers.set(++timerId,f);return timerId;},clearTimeout:id=>timers.delete(id)};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync('assets/js/rain-piano.js','utf8'),sandbox);
async function test(){
 const engine={isPlaying:false,ctx:null,masterGain:new Node()};const Voices=sandbox.window.RainVoices;const v=new Voices(engine);v.setActive(true);
 assert.equal(await v.play(0),false);assert.equal(created,0);
 engine.ctx=ctx;engine.isPlaying=true;
 for(let i=0;i<100;i++){contextTime+=.04;assert.equal(await v.play(i%8),true);assert(v.voices.length<=6);}
 assert.equal(v.voices.length,6);assert.equal(await v.play(0),false);
 assert(nodes.every(n=>Number.isFinite(n.stopAt)));
 v.stop();assert.equal(v.voices.length,0);
 nodes.forEach(n=>n.onended?.());assert(nodes.every(n=>n.disconnected));
 v.setActive(false);contextTime+=1;assert.equal(await v.play(0),false);
 v.setActive(true);v.volume=0;assert.equal(await v.play(1),false);v.volume=.6;
 ctx.state='suspended';ctx.resume=async()=>{throw Error('blocked');};contextTime+=1;assert.equal(await v.play(1),false);
 let resume;ctx.resume=()=>new Promise(resolve=>resume=resolve);contextTime+=1;
 const pending=v.play(1);v.stop();resume();assert.equal(await pending,false);ctx.state='running';
 console.log('PASS instrument: no autoplay, 100 rapid notes capped at six voices, rate limiting, cleanup, mute/exit, zero volume, rejected resume and pending resume cancellation.');
 const room=new El();room.querySelectorAll=()=>keys;room.inert=false;
 engine.isPlaying=false;
 const controller=sandbox.window.createRainPiano({engine,room});controller.setActive(true);
 const flush=async()=>{await Promise.resolve();await Promise.resolve();};
 keys[0].events.click();await flush();assert(els['rain-piano-status'].textContent.includes('Bật âm thanh'));assert(keys[0].classSet.has('is-struck'));
 engine.isPlaying=true;controller.syncAudio();els['rain-guide'].events.click();assert.equal(els['rain-guide'].attrs['aria-pressed'],'true');
 for(const note of [0,0,4,4,5,5,4,3,3,2,2,1,1,0]){contextTime+=.2;keys[note].events.click();await flush();}
 assert.equal(els['rain-guide'].attrs['aria-pressed'],'false');assert(els['rain-piano-status'].textContent.includes('vừa đàn xong'));
 els['rain-change-quote'].events.click();const first=els['rain-quote'].textContent;els['rain-change-quote'].events.click();assert.notEqual(els['rain-quote'].textContent,first);
 let prevented=false;contextTime+=.2;docEvents.keydown({key:'8',target:new El(),preventDefault(){prevented=true;}});await flush();assert(prevented);assert(els['rain-piano-status'].textContent.includes('Đô cao'));
 const before=created;docEvents.keydown({key:'1',repeat:true,target:new El()});assert.equal(created,before);
 els['rain-piano-volume'].events.input({target:{value:'0'}});assert.equal(els['rain-piano-volume-value'].textContent,'0%');
 controller.setActive(false);contextTime+=1;keys[2].events.click();await flush();assert.equal(created,before);
 document.hidden=true;docEvents.visibilitychange();assert(room.classSet.has('rr-paused'));
 console.log('PASS UI simulation: every key, visual strike, sound-off hint, full guided melody, changing quotes, 1–8 shortcuts, repeat prevention, volume and hidden/inactive handling.');
}
test().catch(e=>{console.error(e);process.exitCode=1;});
