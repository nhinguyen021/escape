/* Four small worlds inside the existing Impossible preview. Validated, place-specific progress. */
(() => {
 const worlds = {
  moonflower:{title:'Vườn hoa trăng',en:'The Moonflower Garden',intro:'Có những bông hoa chỉ nở khi được ai đó lắng nghe.',action:'Chạm để hoa trăng hé nở',art:'<g fill="#bcb8ef"><ellipse cy="-28" rx="17" ry="40"/><ellipse cy="-28" rx="17" ry="40" transform="rotate(72)"/><ellipse cy="-28" rx="17" ry="40" transform="rotate(144)"/><ellipse cy="-28" rx="17" ry="40" transform="rotate(216)"/><ellipse cy="-28" rx="17" ry="40" transform="rotate(288)"/></g><circle r="18" fill="#fff2c2"/>',lines:['Hoa hé nở, giữ một giọt trăng trong lòng cánh. Bạn cũng có thể nở theo nhịp của riêng mình.','Đom đóm ghé lại bên hoa. Có những điều nhỏ bé vẫn đủ soi sáng một khoảng tối.','Cánh hoa khẽ nghiêng về bạn. Đêm nay, chẳng cần trở thành ai khác.']},
  isles:{title:'Đảo giữa tầng mây',en:'The Floating Isles',intro:'Đặt xuống một điều nặng lòng, để mây đưa nó đi.',action:'Chạm để gửi chiếc thuyền mây',art:'<path d="m-72 12 66 45 78-45-59 7 0-70-20 55z" fill="#f5e1d3" stroke="#b79da8" stroke-width="3"/><path d="m-7-44-4 60 23 3" fill="none" stroke="#c5afbd"/>',lines:['Chiếc thuyền giấy rời bến mây. Không phải điều gì bạn cũng cần mang theo.','Gió đưa thuyền qua một dòng thác lơ lửng. Chậm thôi, vẫn là đang đi tới.','Một hòn đảo xa vẫy chào. Đâu đó vẫn có một nơi dành cho bạn.']},
  crystal:{title:'Rừng pha lê',en:'The Crystal Woods',intro:'Một cái chạm nhẹ cũng có thể đánh thức khu rừng.',action:'Chạm để đánh thức pha lê',art:'<path d="m0-72 38 39-6 80-34 26-35-42 5-68z" fill="#88c4c4" stroke="#d1f2e5" stroke-width="3"/><path d="m0-72-8 51 6 94m-30-106 24 12 46-12" fill="none" stroke="#e6fff1" stroke-width="2"/><path d="m-8-21 40 68-34 26z" fill="#b4dcdf"/>',lines:['Ánh ngọc chạy dọc những cạnh pha lê. Bạn không cần hoàn hảo để trở nên đẹp đẽ.','Những ngọn nấm quanh gốc cây sáng lên đáp lại. Một chút dịu dàng có thể đi rất xa.','Khu rừng giữ lại ánh sáng của bạn. Ngay cả khi bạn chưa nhận ra nó.']},
  stars:{title:'Biển sao',en:'The Sea of Stars',intro:'Đến đây rồi, bạn có thể ngồi yên một chút.',action:'Chạm để thả một ngôi sao xuống hồ',art:'<path d="m0-64 18 42 46 3-36 30 11 45-39-24-39 24 11-45-36-30 46-3z" fill="#efdcad" stroke="#fff3cf" stroke-width="3"/>',lines:['Một ngôi sao chạm mặt hồ, mở ra vòng sáng. Hôm nay bạn đã đi đủ xa rồi.','Hồ ôm lấy ngôi sao, chẳng hỏi nó đến từ đâu. Ở đây, bạn được đón nhận như chính mình.','Những vòng sáng tan vào đêm. Không cần làm thêm gì cả. Cứ ở lại nếu bạn muốn.']}
 };
 const storageKey='escape_somewhere_impossible_progress_v1';
 function createProgress(provider=()=>window.localStorage) {
  let visited=new Set(),discoveries=new Set(),storage=null;
  try {storage=provider()||null;}catch{}
  function restore(){
   if(!storage)return;
   let raw;try{raw=storage.getItem(storageKey);}catch{storage=null;return;}
   let data;try{data=JSON.parse(raw);}catch{data=null;}
   visited=new Set();discoveries=new Set();
   const valid=list=>Array.isArray(list)&&list.length<=4&&new Set(list).size===list.length&&list.every(id=>typeof id==='string'&&Object.hasOwn(worlds,id));
   if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).length!==2||!Object.hasOwn(data,'visited')||!Object.hasOwn(data,'discoveries')||!valid(data.visited)||!valid(data.discoveries)||!data.discoveries.every(id=>data.visited.includes(id)))return;
   visited=new Set(data.visited);discoveries=new Set(data.discoveries);
  }
  function save(){if(storage)try{storage.setItem(storageKey,JSON.stringify({visited:[...visited],discoveries:[...discoveries]}));}catch{storage=null;}}
  restore();
  return {
   restore,get visited(){return [...visited]},get discoveries(){return [...discoveries]},get unlocked(){return discoveries.size===4},get canSave(){return storage!==null},
   visit(id){if(!Object.hasOwn(worlds,id)||visited.has(id))return false;visited.add(id);save();return true},
   discover(id){if(!visited.has(id)||discoveries.has(id))return false;discoveries.add(id);save();return true},
   clear(){visited.clear();discoveries.clear();if(storage)try{storage.removeItem(storageKey);}catch{storage=null;}}
  };
 }
 window.ImpossibleProgress={createProgress,storageKey};
 window.ImpossibleWorlds=worlds;
 document.addEventListener('DOMContentLoaded',()=>{
  const $=id=>document.getElementById(id),root=$('impossible-world'),preview=$('preview-scene');if(!root||!preview)return;
  const garden=$('imp-garden'),realm=$('imp-realm'),back=$('imp-return'),object=$('imp-object');
  const portals=[...root.querySelectorAll('[data-imp-portal]')],counts={};let current=null,busy=false,lastPortal=null,timers=[];
  const progress=createProgress();
  function renderProgress(){
   portals.forEach(p=>{const id=p.dataset.impPortal;const found=progress.discoveries.includes(id);p.classList.toggle('imp-found',found);const badge=p.querySelector?.('.imp-discovery-badge');if(badge)badge.textContent=found?'✧ Đã đánh thức điều kỳ diệu':progress.visited.includes(id)?'Đã ghé · còn điều để khám phá':'Một điều kỳ diệu đang chờ';});
   root.classList.toggle('imp-awakened',progress.unlocked);
   if($('imp-completion'))$('imp-completion').hidden=!progress.unlocked;
   if($('imp-save-note'))$('imp-save-note').textContent=progress.canSave?'Những khám phá được lưu trong trình duyệt này.':'Không lưu được lúc này. Bạn vẫn có thể khám phá trong lượt này.';
   object.classList.toggle('imp-discovered',Boolean(current&&progress.discoveries.includes(current)));
  }
  const available=()=>!preview.inert&&!document.hidden&&preview.dataset.destination==='impossible';
  function lock(value){busy=value;root.classList.toggle('imp-transitioning',value);root.setAttribute('aria-busy',String(value));portals.forEach(p=>p.disabled=value);back.disabled=value;object.disabled=value;}
  function cancel(){timers.forEach(clearTimeout);timers=[];lock(false);}
  function reset(){cancel();current=null;garden.hidden=false;realm.hidden=true;delete root.dataset.realm;root.setAttribute('aria-labelledby','impossible-heading');object.classList.remove('imp-touched');renderProgress();}
  function transition(id,portal){
   if(busy||!available()||(id!==null&&!Object.hasOwn(worlds,id)))return false;
   if(id!==null)lastPortal=portal;lock(true);
   const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   const commit=()=>{
    if(!available()){reset();return;}
    current=id;garden.hidden=id!==null;realm.hidden=id===null;
    object.classList.remove('imp-touched');
    if(id===null){delete root.dataset.realm;root.setAttribute('aria-labelledby','impossible-heading');}
    else {
     progress.visit(id);const w=worlds[id];root.dataset.realm=id;root.setAttribute('aria-labelledby','imp-realm-title');
     $('imp-realm-title').textContent=w.title;$('imp-realm-en').textContent=w.en;$('imp-realm-intro').textContent=w.intro;
     $('imp-object-art').innerHTML='<svg viewBox="-100 -100 200 200" focusable="false">'+w.art+'</svg>';
     $('imp-object-label').textContent=w.action;object.setAttribute('aria-label',w.action);
     $('imp-discovery').textContent=counts[id]?w.lines[(counts[id]-1)%w.lines.length]:progress.discoveries.includes(id)?w.lines[0]:'Một điều kỳ diệu đang chờ cái chạm của bạn.';
    }
    renderProgress();preview.scrollTop=0;
   };
   const finish=()=>{timers=[];if(!available()){reset();return;}lock(false);(id===null?lastPortal:$('imp-realm-title'))?.focus();};
   if(reduced){commit();finish();}else{timers.push(setTimeout(commit,220),setTimeout(finish,460));}
   return true;
  }
  portals.forEach(p=>p.addEventListener('click',()=>transition(p.dataset.impPortal,p)));
  back.addEventListener('click',()=>transition(null));
  object.addEventListener('click',()=>{
   if(busy||!available()||!current)return;
   progress.discover(current);renderProgress();
   const w=worlds[current];counts[current]=(counts[current]||0)+1;
   $('imp-discovery').textContent=w.lines[(counts[current]-1)%w.lines.length];
   object.classList.remove('imp-touched');void object.offsetWidth;object.classList.add('imp-touched');
  });
  $('imp-reset-progress')?.addEventListener('click',()=>{
   if(busy||!available())return;
   if(!window.confirm('Bắt đầu lại Miền mộng tưởng? Chỉ các khám phá ở nơi này sẽ được xóa.'))return;
   progress.clear();Object.keys(counts).forEach(id=>delete counts[id]);reset();portals[0]?.focus();
  });
  // Reload progress when entering this place, never while a local transition is running.
  document.querySelector?.('[data-destination="impossible"]')?.addEventListener('click',()=>{progress.restore();Object.keys(counts).forEach(id=>delete counts[id]);reset();});
  // Leaving through the existing shared navigation cancels pending local transitions.
  $('preview-back')?.addEventListener('click',reset);
  new MutationObserver(()=>{if(preview.inert||preview.dataset.destination!=='impossible')reset();}).observe(preview,{attributes:true,attributeFilter:['inert','data-destination']});
  document.addEventListener('visibilitychange',()=>{root.classList.toggle('imp-paused',document.hidden);if(document.hidden&&busy)reset();});
  reset();
 });
})();

