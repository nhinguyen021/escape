const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('assets/js/neon-city.js','utf8');const events={},nodes={};
function element(dataset={}){return {dataset,hidden:false,inert:false,disabled:false,textContent:'',attrs:{},classList:{toggle(){}},addEventListener(e,f){this[e]=f},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},focus(){this.focused=true}}}
for(const id of ['preview-scene','neon-city','nc-entry','nc-explore','nc-enter','nc-location','nc-message','nc-restart','nc-entry-back','nc-interact','nc-story','nc-coordinate','nc-event','shop-heading','card'])nodes[id]=element();
const dirs=['north','west','south','east'],buttons=dirs.map(d=>element({ncDirection:d})),markers=['alley','market','corner','ramen'].map(id=>element({ncPlace:id}));
nodes['neon-city'].querySelectorAll=s=>s==='[data-nc-direction]'?buttons:markers;nodes['preview-scene'].dataset.destination='city';nodes['nc-explore'].hidden=true;
let opened=null;const ctx={window:{createStreetShop:()=>({open(id){opened=id},close(){opened=null}})},document:{hidden:false,getElementById:id=>nodes[id],querySelector:()=>nodes.card,addEventListener(e,f){events[e]=f}}};vm.runInNewContext(code,ctx);
const {places,createExploration}=ctx.window.NeonCity;const paths={alley:[],market:['east'],corner:['south'],ramen:['east','south']};
let count=0;for(const [id,path] of Object.entries(paths))for(const d of [...dirs,'bad','__proto__','toString']){const game=createExploration(()=>null);path.forEach(x=>game.move(x));const target=Object.hasOwn(places[id].neighbors,d)?places[id].neighbors[d]:null;assert.equal(game.move(d),!!target);assert.equal(game.current,target||id);count++;}
events.DOMContentLoaded();nodes['nc-enter'].click();assert(!nodes['nc-explore'].hidden);
for(const d of ['east','south','west','north'])buttons[dirs.indexOf(d)].click();assert(markers.every(m=>m.textContent.includes('Đã ghé')||m.textContent.includes('Bạn đang ở đây')));
markers[1].click();assert.equal(opened,'market');nodes['nc-interact'].click();assert.equal(opened,'market');
function key(code,target={closest:()=>null}){events.keydown({code,key:code.slice(3),target,preventDefault(){}})}
key('KeyS');assert.equal(nodes['nc-location'].textContent,'Quán hủ tiếu');key('KeyA',{closest:()=>true});assert.equal(nodes['nc-location'].textContent,'Quán hủ tiếu');
nodes['preview-scene'].inert=true;key('KeyA');assert.equal(nodes['nc-location'].textContent,'Quán hủ tiếu');nodes['preview-scene'].inert=false;
nodes['nc-entry-back'].click();assert(nodes['nc-explore'].hidden);key('KeyA');assert.equal(nodes['nc-location'].textContent,'Quán hủ tiếu');nodes['nc-enter'].click();
nodes['nc-restart'].click();assert.equal(nodes['nc-location'].textContent,'Tiệm bánh mì');assert.equal(markers.filter(m=>m.textContent.includes('Chưa ghé')).length,3);
console.log(`PASS ${count} moves/invalid directions, four-shop UI, map interaction, WASD, input/shop/inactive guards, entrance and restart (simulated DOM).`);
