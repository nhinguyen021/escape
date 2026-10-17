/* Local, pointer + keyboard shell garden. No network or external assets. */
(() => {
  const colors = ['#eed3bf', '#ddb59e', '#f2dfbd', '#b9d0c9', '#d5b7ae', '#e5c78f'];
  const names = ['hồng phấn', 'hổ phách', 'ngà', 'xanh biển', 'tím nhạt', 'vàng cát'];
  const messages = [
    'Không có cách xếp sai. Cứ thử thôi.',
    'Một điều nhỏ xinh. Thế cũng đủ cho lúc này.',
    'Hôm nay, việc của bạn là nhặt những điều dễ thương.',
    'Chú cua đã tới. Có vẻ là một nhà phê bình nghệ thuật.',
    'Chậm một chút cũng được. Biển có hẹn với ai đâu.',
    'Sắp đủ một bộ sưu tập những chuyện bé xíu rồi.',
    'Không cần hoàn hảo. Con cua này thích rồi.'
  ];
  const shellArt = (color, index) => index % 3 === 2
    ? `<path d="M30 5 36 23 55 24 40 35 45 54 30 43 15 54 20 35 5 24 24 23Z" fill="${color}" stroke="#806f60" stroke-width="1.2"/><path d="M30 12V36M12 26 30 32 48 26M19 46 30 32 41 46" fill="none" stroke="#fff3dd" stroke-opacity=".6" stroke-width="1.5"/>`
    : `<path d="M27 52C18 47 1 27 6 18Q9 10 17 14Q20 3 28 9Q36 1 42 12Q52 10 54 21C59 31 43 48 34 52Z" fill="${color}" stroke="#897468" stroke-width="1.2"/><g fill="none" stroke="#fff5df" stroke-opacity=".7" stroke-width="1.6"><path d="M30 49 12 20M30 49 22 14M30 49 32 12M30 49 42 17M30 49 49 24"/></g><path d="M26 49H35L38 55H24Z" fill="${color}" stroke="#897468" stroke-width="1"/>`;

  class SeaModel {
    constructor() { this.reset(); }
    reset() { this.strokes = []; this.shells = colors.map((color, id) => ({id, color, placed:false, x:50, y:50})); }
    place(id, x, y) {
      const shell = this.shells[id];
      if (!shell || !Number.isFinite(x) || !Number.isFinite(y)) return false;
      shell.x = Math.max(9, Math.min(91, x));
      shell.y = Math.max(18, Math.min(82, y));
      shell.placed = true;
      return true;
    }
    addStroke(points) {
      const clean = points.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y))
        .map(p => ({x:Math.max(0,Math.min(100,p.x)),y:Math.max(0,Math.min(100,p.y))}));
      if (clean.length) this.strokes.push(clean);
    }
    undoStroke() { this.strokes.pop(); }
    get hasArt() { return this.count > 0 || this.strokes.length > 0; }
    get count() { return this.shells.filter(s => s.placed).length; }
    get message() { return messages[this.count]; }
    svg(aspect = 3, shellRatio = .065) {
      if (!Number.isFinite(aspect) || aspect <= 0) aspect = 3;
      const w = Math.min(888, 320 * aspect), h = w / aspect, left = (1080-w)/2, top = 750;
      const paths = this.strokes.map(points => {
        const d = points.map((p,i) => (i?'L':'M')+(left+p.x*w/100)+' '+(top+p.y*h/100)).join(' ');
        const line = points.length === 1 ? d+' l0.01 0' : d;
        return '<path d="'+line+'" fill="none" stroke="#806950" stroke-width="'+(w*.004)+'" stroke-linecap="round" stroke-linejoin="round"/>';
      }).join('');
      const drawings = this.shells.filter(s=>s.placed).map(s => `<g transform="translate(${left+s.x*w/100-w*shellRatio/2} ${top+s.y*h/100-w*shellRatio/2}) scale(${w*shellRatio/60}) rotate(${s.id*11-25} 30 30)">${shellArt(s.color,s.id)}</g>`).join('');
      return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#162d3c"/><stop offset="1" stop-color="#d4a48b"/></linearGradient><linearGradient id="sand" x2="0" y2="1"><stop stop-color="#afaa91"/><stop offset="1" stop-color="#d2b795"/></linearGradient></defs><path fill="url(#sky)" d="M0 0h1080v610H0z"/><circle cx="770" cy="440" r="48" fill="#f2ceaa"/><path fill="#4d7882" d="M0 570h1080v210H0z"/><path fill="url(#sand)" d="M0 700Q300 650 580 710T1080 700V1350H0Z"/><path fill="none" stroke="#e6e9d3" stroke-width="3" opacity=".7" d="M0 694Q300 644 580 704T1080 694"/><g fill="#f6ead9" text-anchor="middle" font-family="Georgia,serif"><text x="540" y="165" font-size="20" letter-spacing="6">ĐÊM NAY, TÔI GHÉ</text><text x="540" y="270" font-size="68">Bên biển</text><text x="540" y="328" font-size="26" font-style="italic">Một góc biển, dành riêng cho tôi.</text></g>${paths}${drawings}<g fill="#414c45" text-anchor="middle" font-family="Arial,sans-serif"><text x="540" y="1130" font-size="29" font-style="italic">${this.message}</text><text x="540" y="1225" font-size="18" letter-spacing="8">E S C A P E</text></g></svg>`;
    }
  }
  window.EscapeSeaModel = SeaModel;
  document.addEventListener('DOMContentLoaded', () => {
    const scene = document.getElementById('sea-scene');
    if (!scene) return;
    const board = document.getElementById('sea-play'), tray = document.getElementById('sea-tray');
    const save = document.getElementById('sea-save'), crab = document.getElementById('sea-crab');
    const message = document.getElementById('sea-message'), counter = document.getElementById('sea-count');
    const model = new SeaModel();
    const ink = document.getElementById('sea-ink');
    const drawMode = document.getElementById('sea-draw-mode');
    const shellMode = document.getElementById('sea-shell-mode');
    const undo = document.getElementById('sea-undo');
    const clear = document.getElementById('sea-clear-drawing');
    const help = document.getElementById('sea-help');
    let mode = 'shell', stroke = null;
    const strokePath = points => {
      const d = points.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join(' ');
      return points.length===1 ? d+' l0.01 0' : d;
    };
    function renderInk() {
      const paths = stroke ? [...model.strokes,stroke.points] : model.strokes;
      ink.innerHTML = paths.map(points=>'<path d="'+strokePath(points)+'"/>').join('');
      undo.disabled = clear.disabled = model.strokes.length === 0;
      board.classList.toggle('has-drawing',paths.length>0);
      save.disabled = !model.hasArt || exporting;
    }
    function finishStroke(commit = true) {
      if (!stroke) return;
      const current = stroke; stroke = null;
      if (commit) model.addStroke(current.points);
      if(board.hasPointerCapture(current.pointer))board.releasePointerCapture(current.pointer);
      renderInk();
    }
    function setMode(next) {
      finishStroke(); mode=next;select(null);
      board.classList.toggle('is-drawing',mode==='draw');
      drawMode.setAttribute('aria-pressed',String(mode==='draw'));
      shellMode.setAttribute('aria-pressed',String(mode==='shell'));
      help.textContent=mode==='draw' ? 'Giữ chuột hoặc dùng ngón tay vẽ lên cát. Chọn Xếp vỏ sò để trang trí.' : 'Kéo vỏ sò lên cát, hoặc chọn rồi chạm để đặt. Nét vẽ vẫn được giữ lại.';
    }
    const pointFrom = event => {
      const rect=board.getBoundingClientRect();
      return {x:Math.max(0,Math.min(100,(event.clientX-rect.left)/rect.width*100)),y:Math.max(0,Math.min(100,(event.clientY-rect.top)/rect.height*100))};
    };
    board.addEventListener('pointerdown',event=>{
      if(mode!=='draw'||event.button!==0||!event.isPrimary||stroke||drag)return;
      event.preventDefault();
      stroke={pointer:event.pointerId,points:[pointFrom(event)]};
      board.setPointerCapture(event.pointerId);renderInk();
    });
    board.addEventListener('pointermove',event=>{
      if(!stroke||event.pointerId!==stroke.pointer)return;
      for(const sample of event.getCoalescedEvents?.() || [event]) {
        const p=pointFrom(sample),last=stroke.points[stroke.points.length-1];
        if(Math.hypot(p.x-last.x,p.y-last.y)>.15)stroke.points.push(p);
      }
      renderInk();
    });
    board.addEventListener('pointerup',event=>{if(stroke?.pointer===event.pointerId){stroke.points.push(pointFrom(event));finishStroke();}});
    board.addEventListener('pointercancel',()=>finishStroke(false));
    board.addEventListener('lostpointercapture',()=>finishStroke());
    drawMode.addEventListener('click',()=>setMode('draw'));
    shellMode.addEventListener('click',()=>setMode('shell'));
    undo.addEventListener('click',()=>{finishStroke();model.undoStroke();renderInk();});
    clear.addEventListener('click',()=>{finishStroke();model.strokes=[];renderInk();message.textContent='Cát đã phẳng lại. Những vỏ sò vẫn ở đây.';});
    let selected = null, drag = null, suppressClickUntil = 0, waveTimer, exporting = false;
    const buttons = model.shells.map(s => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'sea-shell'; button.dataset.shell = s.id;
      button.innerHTML = `<svg viewBox="0 0 60 60" aria-hidden="true">${shellArt(s.color,s.id)}</svg>`;
      button.style.setProperty('--tilt', `${s.id*11-25}deg`);
      button.style.setProperty('--delay', `${-s.id*.7}s`);
      button.addEventListener('click', () => {
        if (performance.now() < suppressClickUntil) return;
        if(mode==='draw')setMode('shell');
        select(s.id);
        message.textContent = 'Chạm cát để đặt, hoặc dùng phím mũi tên.';
      });
      button.addEventListener('keydown', event => {
        if (event.key === 'Escape') { select(null); return; }
        const steps = {ArrowLeft:[-4,0],ArrowRight:[4,0],ArrowUp:[0,-6],ArrowDown:[0,6]};
        if (steps[event.key]) {
          event.preventDefault();
          const [dx,dy] = steps[event.key];
          place(s.id,s.x+dx,s.y+dy); button.focus();
        }
      });
      button.addEventListener('pointerdown', event => {
        if (event.button !== 0 || !event.isPrimary || drag) return;
        if(mode==='draw')setMode('shell');
        drag = {id:s.id,pointer:event.pointerId,startX:event.clientX,startY:event.clientY,moved:false};
        button.setPointerCapture(event.pointerId);
      });
      button.addEventListener('pointermove', event => {
        if (!drag || drag.id!==s.id || drag.pointer!==event.pointerId) return;
        if (Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>5) drag.moved=true;
        if (!drag.moved) return;
        button.classList.add('is-dragging');
        // Coordinates relative to the existing parent avoid transformed-scene
        // containing blocks changing the meaning of position:fixed.
        const rect = button.parentElement.getBoundingClientRect();
        button.style.left = `${event.clientX-rect.left}px`;
        button.style.top = `${event.clientY-rect.top}px`;
      });
      const end = event => {
        if (!drag || drag.pointer!==event.pointerId) return;
        const moved=drag.moved; drag=null;
        if(button.hasPointerCapture(event.pointerId))button.releasePointerCapture(event.pointerId);
        button.classList.remove('is-dragging');
        if(moved) {
          suppressClickUntil=performance.now()+300;
          const r=board.getBoundingClientRect();
          if(event.type==='pointerup' && event.clientX>=r.left && event.clientX<=r.right && event.clientY>=r.top && event.clientY<=r.bottom) {
            place(s.id,(event.clientX-r.left)/r.width*100,(event.clientY-r.top)/r.height*100);
          } else render();
        }
      };
      button.addEventListener('pointerup',end);
      button.addEventListener('pointercancel',end);
      button.addEventListener('lostpointercapture',end);
      return button;
    });
    function select(id) { selected=id; buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===id))); }
    function render() {
      model.shells.forEach(s => {
        const button=buttons[s.id], parent=s.placed?board:tray;
        if(button.parentElement!==parent)parent.appendChild(button);
        button.classList.toggle('is-placed',s.placed);
        button.style.left=`${s.placed?s.x:8+s.id*16.8}%`;
        button.style.top=`${s.placed?s.y:50}%`;
        button.setAttribute('aria-label',`Vỏ ${names[s.id]}${s.placed?', đã đặt trên cát':''}. Chọn rồi chạm cát, hoặc dùng phím mũi tên để đặt và di chuyển.`);
      });
      board.classList.toggle('has-shells',model.count>0);
      save.disabled=!model.hasArt||exporting;
      message.textContent=model.message;
      counter.textContent=model.count?`${model.count} / 6 món quà từ biển · cứ xếp theo ý bạn`:'không tính điểm · không cần vội';
      crab.style.left=`${5+model.count*11}%`;
    }
    function place(id,x,y) {
      const before=model.count;
      if(!model.place(id,x,y))return;
      select(null);render();
      if(model.count>before) {
        crab.classList.remove('is-happy');
        void crab.offsetWidth;
        crab.classList.add('is-happy');
        clearTimeout(waveTimer);waveTimer=setTimeout(()=>crab.classList.remove('is-happy'),2600);
      }
    }
    board.addEventListener('click',event=>{
      if(mode==='draw'||selected===null||event.target.closest('.sea-shell'))return;
      const rect=board.getBoundingClientRect();
      place(selected,(event.clientX-rect.left)/rect.width*100,(event.clientY-rect.top)/rect.height*100);
    });
    board.addEventListener('keydown',event=>{
      if(event.target!==board)return;
      if(event.key==='Escape'){select(null);return;}
      if((event.key==='Enter'||event.key===' ')&&selected!==null){
        event.preventDefault();const id=selected;place(id,50,50);buttons[id].focus();
      }
    });
    document.getElementById('sea-reset').addEventListener('click',()=>{
      finishStroke(false);model.reset();renderInk();select(null);crab.classList.remove('is-happy');clearTimeout(waveTimer);render();
      message.textContent='Biển mang quà mới rồi. Mình thử một hình khác nhé?';
    });
    save.addEventListener('click',async()=>{
      finishStroke();
      if(!model.hasArt||exporting)return;
      exporting=true;save.disabled=true;
      const url=URL.createObjectURL(new Blob([model.svg(board.clientWidth/board.clientHeight, buttons[0].getBoundingClientRect().width/board.clientWidth)],{type:'image/svg+xml;charset=utf-8'}));
      try {
        const img=new Image();
        await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});
        const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;
        canvas.getContext('2d').drawImage(img,0,0);
        const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
        if(!blob)throw Error('Cannot encode image');
        const downloadURL=URL.createObjectURL(blob),link=document.createElement('a');
        link.href=downloadURL;link.download='escape-my-little-shore.png';document.body.appendChild(link);link.click();link.remove();
        setTimeout(()=>URL.revokeObjectURL(downloadURL),30000);
        message.textContent='Ảnh đã sẵn sàng tải xuống. Mang một chút biển theo nhé.';
      } catch(error) { message.textContent='Chưa lưu được ảnh. Bạn có thể chụp màn hình để giữ khoảnh khắc này nhé.'; }
      finally {URL.revokeObjectURL(url);exporting=false;save.disabled=!model.hasArt;}
    });
    document.addEventListener('visibilitychange',()=>scene.classList.toggle('is-paused',document.hidden));
    new MutationObserver(()=>{
      if(scene.inert){
        finishStroke();
        if(drag){const b=buttons[drag.id];b.classList.remove('is-dragging');drag=null;render();}
        select(null);
      }
    }).observe(scene,{attributes:true,attributeFilter:['inert']});
    render();select(null);renderInk();setMode('draw');
  });
})();
