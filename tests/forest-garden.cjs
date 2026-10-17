const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const handlers={};
class El {
 constructor(){this.events={};this.dataset={};this.attrs={};this.disabled=false;this.hidden=false;this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:(...c)=>c.forEach(x=>this.classes.delete(x))};}
 addEventListener(k,fn){this.events[k]=fn;}
 setAttribute(k,v){this.attrs[k]=v;}
 focus(){this.focused=true;}
}
const ids=['forest-scene','forest-plant','forest-earth','forest-feedback','forest-restart','forest-stage','forest-quote','forest-garden-description'];
const nodes=Object.fromEntries(ids.map(id=>[id,new El()]));
const buttons=['plant','water','sunlight'].map(action=>{const b=new El();b.dataset.gardenAction=action;return b;});
nodes['forest-scene'].querySelectorAll=()=>buttons;
const document={hidden:false,getElementById:id=>nodes[id],addEventListener:(key,fn)=>handlers[key]=fn};
const sandbox={window:{confirm:()=>true},document};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('assets/js/forest-garden.js','utf8'),sandbox);
const Model=sandbox.window.EscapeForestGarden;
let cases=0;
function checkSequence(actions){
 const m=new Model();let expected=null;
 for(const action of actions){
  const valid=expected===null?'plant':expected===0?'water':expected===1?'sunlight':expected===2?'water':null;
  const accepted=valid!==null&&action===valid;
  assert.equal(m.act(action),accepted);
  if(accepted)expected=expected===null?0:expected+1;
  assert.equal(m.stage,expected);
 }cases++;
}
function sequences(prefix,depth){checkSequence(prefix);if(depth)for(const action of ['plant','water','sunlight','unknown'])sequences([...prefix,action],depth-1);}
sequences([],6);
const m=new Model();assert.equal(m.restart(),false);
const quotes=['Mọi khởi đầu đều bé nhỏ.','Từng chút một cũng là tiến về phía trước.','Bạn được phép lớn lên chậm rãi.','Một chút chăm chút đã đưa bạn đi xa đến vậy.'];
for(const [i,action]of ['plant','water','sunlight','water'].entries()){assert(m.act(action));assert.equal(m.stage,i);assert.equal(m.copy.quote,quotes[i]);if(i<3)assert.equal(m.restart(),false);}
assert.equal(m.act(null),false);assert.equal(m.act(undefined),false);assert.equal(m.stage,3);
assert(m.restart());assert.equal(m.stage,null);assert.equal(m.nextAction,'plant');
console.log(`PASS model: ${cases} action sequences; exact four stages/quotes; invalid and repeated actions cannot skip; replay only after bloom.`);
handlers.DOMContentLoaded();
const allowed=()=>buttons.filter(b=>!b.disabled).map(b=>b.dataset.gardenAction);
assert.deepEqual(allowed(),['plant']);assert(nodes['forest-restart'].hidden);
buttons[1].events.click();assert.equal(nodes['forest-plant'].dataset.stage,'empty');
for(const [i,index]of [0,1,2,1].entries()){
 buttons[index].events.click();assert.equal(nodes['forest-plant'].dataset.stage,String(i));assert.equal(nodes['forest-quote'].textContent,quotes[i]);
 const expected=[['water'],['sunlight'],['water'],[]][i];assert.deepEqual(allowed(),expected);
 buttons[index].events.click();assert.equal(nodes['forest-plant'].dataset.stage,String(i));
}
assert(!nodes['forest-restart'].hidden);assert(nodes['forest-restart'].focused);
assert(nodes['forest-feedback'].classes.has('is-blooming'));
nodes['forest-scene'].inert=true;nodes['forest-restart'].events.click();assert.equal(nodes['forest-plant'].dataset.stage,'3');
nodes['forest-scene'].inert=false;nodes['forest-restart'].events.click();assert.equal(nodes['forest-plant'].dataset.stage,'empty');assert.deepEqual(allowed(),['plant']);assert(buttons[0].focused);
document.hidden=true;buttons[0].events.click();assert.equal(nodes['forest-plant'].dataset.stage,'empty');
document.hidden=false;buttons[0].events.click();assert.equal(nodes['forest-plant'].dataset.stage,'0');
console.log('PASS DOM simulation: disabled actions, feedback classes, focus moves to next valid control, intentional replay, inactive/hidden guards and second playthrough.');
console.log('Browser animation appearance and real touch input are not verified by these tests.');
