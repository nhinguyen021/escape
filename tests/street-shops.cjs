const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');const sandbox={window:{}};vm.runInNewContext(fs.readFileSync('assets/js/street-shops.js','utf8'),sandbox);
const {shops,createOrder}=sandbox.window.StreetShops;
let completed=0;for(const id of Object.keys(shops))for(let i=0;i<2;i++){
 const m=createOrder(id,i);assert.equal(m.serve(),'prepare');assert.equal(m.toggle('invalid'),false);assert.equal(m.prepare(50),false);
 for(const item of m.order.items)assert(m.toggle(item));
 if(m.shop.kind==='pour'){assert.equal(m.prepare(-1),false);assert.equal(m.prepare(101),false);assert.equal(m.prepare(NaN),false);assert(m.prepare(m.shop.range[0]));}
 else {assert(m.prepare());assert(!m.prepared);assert(m.prepare());assert(!m.prepared);assert(m.prepare());}
 assert(m.prepared);assert.equal(m.serve(),'served');assert(m.served);assert.equal(m.toggle(m.order.items[0]),false);assert.equal(m.serve(),'done');completed++;
 const wrong=createOrder(id,i);wrong.toggle(wrong.order.items[0]);for(let k=0;k<3;k++)wrong.prepare(wrong.shop.range?.[0]);assert.equal(wrong.serve(),'ingredients');
 for(const item of wrong.order.items.slice(1))wrong.toggle(item);assert(!wrong.prepared);for(let k=0;k<3;k++)wrong.prepare(wrong.shop.range?.[0]);assert.equal(wrong.serve(),'served');
}
console.log(`PASS ${completed} distinct customer orders, ingredient selection/removal, wrong-order correction, folding/press/pour bounds, serve-before-ready and repeated-serve guards. Model tests, not real drag/touch input.`);
