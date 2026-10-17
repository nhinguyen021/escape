const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');const ctx={window:{}};
for(const f of ['street-shops','shop-art'])vm.runInNewContext(fs.readFileSync('assets/js/'+f+'.js','utf8'),ctx);
const {shops,createOrder}=ctx.window.StreetShops,{icon,scene}=ctx.window.StreetShopArt;
const names=new Set(Object.values(shops).flatMap(s=>s.pantry));for(const name of names){assert(icon(name).includes('<svg'));assert(!icon(name).includes('undefined'));assert(icon(name).length>200);}
for(const id of Object.keys(shops)){const m=createOrder(id);const empty=scene(m);for(const item of m.order.items)m.toggle(item);const filled=scene(m);assert.notEqual(empty,filled);for(let i=0;i<3;i++)m.prepare(m.shop.range?.[0]);const ready=scene(m);assert.notEqual(ready,filled);assert.equal(m.serve(),'served');assert(scene(m).includes('Món đã tới tay khách'));}
console.log(`PASS ${names.size} ingredient illustrations; all four dish scenes change for ingredients, preparation and serving.`);
