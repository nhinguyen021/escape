const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const handlers={};let now=0;
class El{
 constructor(){this.children=[];this.events={};this.attrs={};this.dataset={};this.style={setProperty(){}};this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};}
 addEventListener(k,f){(this.events[k]??=[]).push(f);}
 fire(k,e={}){for(const fn of this.events[k]||[])fn({target:this,preventDefault(){},...e});}
 appendChild(c){if(c.parentElement)c.parentElement.children=c.parentElement.children.filter(x=>x!==c);this.children.push(c);c.parentElement=this;}
 setAttribute(k,v){this.attrs[k]=v;}
 closest(s){return this.dataset.shell!==undefined?this:null;}
 focus(){this.focused=true;}
 setPointerCapture(id){this.capture=id;}hasPointerCapture(id){return this.capture===id;}releasePointerCapture(){this.capture=null;}
 getBoundingClientRect(){return {left:0,top:0,width:400,height:200,right:400,bottom:200};}
}
const ids=['sea-scene','sea-play','sea-tray','sea-save','sea-crab','sea-message','sea-count','sea-reset','sea-ink','sea-draw-mode','sea-shell-mode','sea-undo','sea-clear-drawing','sea-help'];
const els=Object.fromEntries(ids.map(id=>[id,new El()]));
const sandbox={window:{},document:{getElementById:id=>els[id],createElement:()=>new El(),addEventListener:(k,f)=>handlers[k]=f},performance:{now:()=>now},setTimeout:()=>1,clearTimeout(){},MutationObserver:class{observe(){}}};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync('assets/js/sea.js','utf8'),sandbox);
const Model=sandbox.window.EscapeSeaModel,m=new Model();
assert.equal(m.count,0);assert.equal(m.place(99,0,0),false);assert.equal(m.place(0,NaN,1),false);
m.place(0,-100,500);assert.equal(m.shells[0].x,9);assert.equal(m.shells[0].y,82);
for(let i=0;i<6;i++)m.place(i,15+i*13,30+i*6);
assert.equal(m.count,6);assert(m.message.includes('Con cua')||m.message.includes('con cua'));
assert.equal((m.svg().match(/<g transform="translate/g)||[]).length,6);
assert(!m.svg().includes('NaN'));assert(!m.svg().includes('http:',100));
m.reset();assert.equal(m.count,0);
handlers.DOMContentLoaded();
let shells=[...els['sea-tray'].children];assert.equal(shells.length,6);assert.equal(els['sea-save'].disabled,true);
shells[0].fire('click');els['sea-play'].fire('click',{clientX:120,clientY:100});
assert.equal(shells[0].parentElement,els['sea-play']);assert.equal(els['sea-save'].disabled,false);
assert.equal(els['sea-count'].textContent.startsWith('1 / 6'),true);
shells[1].fire('keydown',{key:'ArrowRight'});assert.equal(shells[1].parentElement,els['sea-play']);
shells[2].fire('click');els['sea-play'].fire('keydown',{key:'Enter'});assert(shells[2].focused);
shells[3].fire('pointerdown',{button:0,isPrimary:true,pointerId:1,clientX:10,clientY:10});
shells[3].fire('pointermove',{pointerId:1,clientX:200,clientY:100});
shells[3].fire('pointerup',{pointerId:1,clientX:200,clientY:100,type:'pointerup'});
assert.equal(shells[3].parentElement,els['sea-play']);
shells[4].fire('pointerdown',{button:0,isPrimary:true,pointerId:2,clientX:10,clientY:10});
shells[4].fire('pointermove',{pointerId:2,clientX:200,clientY:100});
shells[4].fire('pointercancel',{pointerId:2,type:'pointercancel'});assert.equal(shells[4].parentElement,els['sea-tray']);
shells[5].fire('pointerdown',{button:0,isPrimary:true,pointerId:3,clientX:10,clientY:10});
shells[5].fire('pointermove',{pointerId:3,clientX:900,clientY:100});
shells[5].fire('pointerup',{pointerId:3,clientX:900,clientY:100,type:'pointerup'});assert.equal(shells[5].parentElement,els['sea-tray']);
assert(els['sea-count'].textContent.startsWith('4 / 6'));
els['sea-reset'].fire('click');assert.equal(els['sea-tray'].children.length,6);assert.equal(els['sea-save'].disabled,true);
console.log('PASS: six-shell model, bounds, unique collection count, reset, SVG export contents.');
console.log('PASS: tap placement, keyboard arrows and Enter, successful drag, cancelled drag, drop outside, UI reset.');
console.log('Simulated DOM tests; PNG browser download and visual layout require manual verification.');

els['sea-draw-mode'].fire('click');
const board=els['sea-play'];
board.fire('pointerdown',{button:0,isPrimary:true,pointerId:7,clientX:20,clientY:30});
board.fire('pointermove',{pointerId:7,clientX:150,clientY:80});
board.fire('pointerup',{pointerId:7,clientX:200,clientY:100});
assert.equal(els['sea-save'].disabled,false);
assert.equal(els['sea-undo'].disabled,false);
assert.equal((els['sea-ink'].innerHTML.match(/<path/g)||[]).length,1);
board.fire('pointerdown',{button:0,isPrimary:true,pointerId:8,clientX:20,clientY:30});
board.fire('pointermove',{pointerId:8,clientX:150,clientY:80});
board.fire('pointercancel',{pointerId:8});
assert.equal((els['sea-ink'].innerHTML.match(/<path/g)||[]).length,1);
els['sea-undo'].fire('click');assert.equal(els['sea-ink'].innerHTML,'');assert.equal(els['sea-save'].disabled,true);
board.fire('pointerdown',{button:0,isPrimary:true,pointerId:9,clientX:20,clientY:30});
board.fire('pointerup',{pointerId:9,clientX:20,clientY:30});
assert.equal(els['sea-save'].disabled,false);
now=1000;shells[0].fire('click');board.fire('click',{clientX:120,clientY:100});
assert.equal(shells[0].parentElement,board);
assert(els['sea-ink'].innerHTML.includes('<path'));
els['sea-clear-drawing'].fire('click');assert.equal(els['sea-ink'].innerHTML,'');assert.equal(shells[0].parentElement,board);assert.equal(els['sea-save'].disabled,false);
m.addStroke([{x:10,y:10},{x:50,y:80},{x:90,y:10}]);
assert(m.hasArt);const svg=m.svg(1.5);assert(svg.includes('stroke="#806950"'));assert(!svg.includes('NaN'));

m.undoStroke();assert(!m.hasArt);
m.addStroke([{x:Infinity,y:4}]);assert(!m.hasArt);
m.addStroke([{x:-4,y:400}]);assert.equal(m.strokes[0][0].x,0);assert.equal(m.strokes[0][0].y,100);
m.reset();assert.equal(m.strokes.length,0);
console.log('PASS: freehand and dot strokes, cancellation, undo, drawing-only export, shell decoration preserves drawing, clear drawing preserves shells, SVG coordinates and reset.');

