/* Four small counters. Orders and preparation live in memory; exploration saves elsewhere. */
(() => {
  const shops = {
    alley:{name:'Tiệm bánh mì',vessel:'bread',tool:'Gói bánh',kind:'fold',instruction:'Bấm từng nếp giấy để gói bánh. Có thể dùng Tab rồi Enter.',pantry:['Bánh mì','Trứng','Chả','Dưa leo','Đồ chua','Ớt'],orders:[{guest:'Chị Mai vừa tan ca',ask:'Cho chị bánh mì trứng, dưa leo và đồ chua. Không ớt nghen.',items:['Bánh mì','Trứng','Dưa leo','Đồ chua'],reply:'Giòn thơm quá. Có ổ bánh nóng là đường về nhà vui hơn rồi.'},{guest:'Chú Tư chạy xe',ask:'Một ổ chả với đồ chua, thêm chút ớt nha con.',items:['Bánh mì','Chả','Đồ chua','Ớt'],reply:'Gói gọn ghẽ quá. Chú mang theo, lát nghỉ chân ăn.'}]},
    market:{name:'Xe nước mía',vessel:'glass',tool:'Quay máy ép',kind:'press',instruction:'Bấm tay quay ba lần để ép mía. Có thể dùng Tab rồi Enter.',pantry:['Mía','Tắc','Đá','Gừng'],orders:[{guest:'Hai bạn sinh viên',ask:'Nước mía tắc có đá nha cô, tụi con đi bộ hơi xa.',items:['Mía','Tắc','Đá'],reply:'Chua nhẹ, mát lạnh. Tụi con ngồi đây nghỉ chút nha.'},{guest:'Bác hàng xóm',ask:'Cho bác mía gừng, không đá, không tắc nhé.',items:['Mía','Gừng'],reply:'Vị gừng ấm nhẹ. Như ly bác hay uống hồi trước.'}]},
    ramen:{name:'Quán hủ tiếu',vessel:'bowl',tool:'Chan nước dùng',kind:'pour',range:[35,55],instruction:'Kéo mức nước dùng vào vạch 35–55 ml rồi bấm Chan nước dùng.',pantry:['Hủ tiếu','Thịt','Đậu hũ','Rau','Hành','Ớt'],orders:[{guest:'Anh thợ sửa xe',ask:'Một tô hủ tiếu thịt với rau. Đừng bỏ hành, anh không ăn hành.',items:['Hủ tiếu','Thịt','Rau'],reply:'Đúng ý anh rồi. Hết một ngày lấm lem cũng có tô nóng chờ mình.'},{guest:'Cô bán hoa',ask:'Hủ tiếu đậu hũ, thêm rau với hành, không ớt nhé.',items:['Hủ tiếu','Đậu hũ','Rau','Hành'],reply:'Tô này thơm quá. Tặng quán một lời chúc đông vui nha.'}]},
    corner:{name:'Cà phê phin',vessel:'cup',tool:'Rót nước vào phin',kind:'pour',range:[60,80],instruction:'Kéo lượng nước vào vạch 60–80 ml rồi rót vào phin.',pantry:['Cà phê','Sữa đặc','Đá','Đường'],orders:[{guest:'Chị họa sĩ',ask:'Cà phê sữa đá, không thêm đường. Chị ngồi vẽ con hẻm một lát.',items:['Cà phê','Sữa đặc','Đá'],reply:'Một ly quen, một góc ngồi quen. Hôm nay chắc vẽ được nhiều.'},{guest:'Ông đọc báo',ask:'Cà phê đen nóng, chút đường thôi. Không sữa, không đá.',items:['Cà phê','Đường'],reply:'Ừ, đậm vừa. Tờ báo sáng nay còn mấy trang chưa đọc.'}]}
  };
  function createOrder(id,index=0) {
    const shop=shops[id]; if(!shop)throw Error('Unknown shop');
    const order=shop.orders[index%shop.orders.length];const selected=new Set();let prepared=false,served=false,work=0;
    return {shop,order,get selected(){return [...selected]},get prepared(){return prepared},get served(){return served},get work(){return work},
      toggle(item){if(served||!shop.pantry.includes(item))return false;selected.has(item)?selected.delete(item):selected.add(item);prepared=false;work=0;return true},
      prepare(value){if(served||selected.size===0)return false;
        if(shop.kind==='pour'){if(!Number.isFinite(value)||value<shop.range[0]||value>shop.range[1])return false;work=1;}
        else work=Math.min(3,work+1);
        prepared=shop.kind==='pour'||work===3;return true;
      },
      serve(){if(served)return 'done';if(!prepared)return 'prepare';if(selected.size!==order.items.length||order.items.some(i=>!selected.has(i)))return 'ingredients';served=true;return 'served';}
    };
  }
  window.StreetShops={shops,createOrder};
  window.createStreetShop=({panel,isActive})=>{
    if(!panel)return null;
    let model=null,current=null;const visits={};let drag=null;
    panel.innerHTML=`<header class="shop-header"><p>CHUYỆN Ở QUẦY</p><h3 id="shop-heading" tabindex="-1"></h3><button id="shop-close" type="button">Gấp quầy lại ×</button></header>
      <div class="shop-customer"><span aria-hidden="true" class="shop-portrait">◡</span><div><strong id="shop-guest"></strong><p id="shop-request"></p></div></div>
      <p class="shop-tip">Chọn nguyên liệu rồi chạm khay, hoặc kéo thả vào khay. Chạm lại nguyên liệu đã thêm để lấy ra.</p>
      <div id="shop-pantry" class="shop-pantry" role="group" aria-label="Nguyên liệu"></div>
      <button id="shop-tray" class="shop-tray" type="button" aria-label="Khay chế biến: chạm để thêm nguyên liệu đã chọn"><span id="shop-dish"></span><span id="shop-filled"></span></button>
      <p id="shop-method"></p><div id="shop-folds" class="shop-folds"></div>
      <div id="shop-measure"><label for="shop-water">Lượng nước: <output id="shop-water-value">0</output> ml</label><input id="shop-water" type="range" min="0" max="100" value="0" step="5"></div>
      <button id="shop-tool" type="button"></button><div id="shop-work" aria-live="polite"></div>
      <p id="shop-feedback" role="status"></p><div class="shop-actions"><button id="shop-serve" type="button">Mời khách dùng</button><button id="shop-new" type="button" hidden>Đón vị khách tiếp theo</button></div>`;
    const $=id=>panel.querySelector('#'+id);let picked=null, dropped=false;
    const ghost=document.createElement('div');ghost.className='shop-drag-ghost';ghost.hidden=true;ghost.setAttribute('aria-hidden','true');panel.append(ghost);
    document.addEventListener('pointermove',e=>{if(!drag||!isActive()||panel.hidden)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<8)return;ghost.hidden=false;ghost.innerHTML=window.StreetShopArt?.icon(drag.item)||'';ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';});
    function render(){
      if (window.StreetShopArt) $('shop-dish').innerHTML=window.StreetShopArt.scene(model);
      $('shop-filled').textContent=model.selected.length?model.selected.join(' · '):'Khay đang trống';
      $('shop-tray').dataset.vessel=model.shop.vessel;$('shop-tray').classList.toggle('is-ready',model.prepared);
      for(const button of $('shop-pantry').children){button.setAttribute('aria-pressed',String(model.selected.includes(button.dataset.ingredient)));button.disabled=model.served;button.classList.toggle('is-picked',picked===button.dataset.ingredient);}
      $('shop-tool').disabled=model.prepared||model.served||!model.selected.length;
      $('shop-water').disabled=model.prepared||model.served;
      $('shop-work').textContent=model.prepared?'Đã chế biến xong. Kiểm tra món rồi mời khách nhé.':model.shop.kind==='pour'?'':`Đã làm ${model.work}/3 lượt`;
      $('shop-serve').disabled=!model.prepared||model.served;$('shop-new').hidden=!model.served;
      $('shop-filled').setAttribute('aria-live','polite');
      for(const button of $('shop-folds').children)button.disabled=model.served||model.prepared||!model.selected.length||Number(button.dataset.fold)!==model.work;
    }
    function addPicked(){if(!picked||!isActive())return;model.toggle(picked);picked=null;$('shop-feedback').textContent='Đã cập nhật khay. Bạn có thể lấy nguyên liệu ra để sửa món.';render();}
    function open(id){
      if(!shops[id])return;
      if(current!==id||!model){current=id;model=createOrder(id,visits[id]||0);}
      panel.hidden=false;picked=null;
      $('shop-heading').textContent=model.shop.name;$('shop-guest').textContent=model.order.guest;$('shop-request').textContent=model.order.ask;
      $('shop-method').textContent=model.shop.instruction;$('shop-tool').textContent=model.shop.kind==='press'?'Quay một vòng':model.shop.tool;
      $('shop-tool').hidden=model.shop.kind==='fold';$('shop-measure').hidden=model.shop.kind!=='pour';
      $('shop-pantry').replaceChildren();
      for(const item of model.shop.pantry){const button=document.createElement('button');button.type='button';button.dataset.ingredient=item;button.setAttribute('aria-label',item);
        button.innerHTML=(window.StreetShopArt?.icon(item)||'')+'<span>'+item+'</span>';
        button.addEventListener('click',e=>{if(dropped&&e.detail>0){dropped=false;return;}if(!isActive())return;if(model.selected.includes(item)){model.toggle(item);picked=null;}else picked=item;render();});
        button.addEventListener('pointerdown',e=>{if(!isActive()||model.served||e.button>0)return;dropped=false;drag={item,x:e.clientX,y:e.clientY};});$('shop-pantry').append(button);
      }
      $('shop-folds').replaceChildren();
      if(model.shop.kind==='fold')for(let i=0;i<3;i++){const button=document.createElement('button');button.type='button';button.dataset.fold=i;button.textContent=['Gấp mép trái','Gấp mép phải','Cuộn giấy ôm bánh'][i];button.addEventListener('click',()=>{if(!isActive())return;model.prepare();render();});$('shop-folds').append(button);}
      $('shop-feedback').textContent=model.served?model.order.reply:'Đọc lời khách dặn trước khi chọn nguyên liệu nhé.';render();
    }
    $('shop-tray').addEventListener('click',addPicked);
    document.addEventListener('pointerup',e=>{if(!drag)return;const d=drag;drag=null;ghost.hidden=true;if(!isActive()||panel.hidden)return;
      const r=$('shop-tray').getBoundingClientRect();if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>10&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom){picked=d.item;addPicked();dropped=true;}
    });
    document.addEventListener('pointercancel',()=>{drag=null;ghost.hidden=true;});
    $('shop-water').addEventListener('input',()=>{$('shop-water-value').textContent=$('shop-water').value;});
    $('shop-tool').addEventListener('click',()=>{if(!isActive())return;const ok=model.prepare(Number($('shop-water').value));$('shop-feedback').textContent=ok?'Bạn làm khéo rồi đó.':'Lượng nước chưa đúng vạch gợi ý. Kéo lại một chút nhé.';render();});
    $('shop-serve').addEventListener('click',()=>{if(!isActive())return;const result=model.serve();$('shop-feedback').textContent=result==='served'?model.order.reply:result==='ingredients'?'Khách nhắc nhẹ: món chưa đúng lời dặn. Lấy bớt hoặc thêm nguyên liệu rồi chế biến lại nhé.':'Mình chế biến xong rồi hãy mời khách nhé.';render();});
    $('shop-new').addEventListener('click',()=>{if(!isActive()||!model.served)return;visits[current]=(visits[current]||0)+1;model=null;$('shop-water').value=0;$('shop-water-value').textContent='0';open(current);$('shop-heading').focus();});
    $('shop-close').addEventListener('click',()=>{panel.hidden=true;drag=null;ghost.hidden=true;document.getElementById('nc-interact')?.focus();});
    return {open,close(){panel.hidden=true;drag=null;}};
  };
})();
