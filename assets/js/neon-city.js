/* A small connected map with optional, stage-independent browser storage. */
(() => {
  const places = {
    alley: {name:'Tiệm bánh mì', message:'Ổ bánh nóng giòn, gói theo một lời chào.', neighbors:{east:'market',south:'corner'}},
    market: {name:'Xe nước mía', message:'Một ly mát lành giữa buổi dạo phố.', neighbors:{west:'alley',south:'ramen'}},
    corner: {name:'Cà phê phin', message:'Ngồi xuống đây. Chuyện gì rồi cũng kể được.', neighbors:{north:'alley',east:'ramen'}},
    ramen: {name:'Quán hủ tiếu', message:'Tiếng muỗng chạm tô, mùi nước dùng thân quen.', neighbors:{north:'market',west:'corner'}}
  };
  const details = {
    alley:{x:'8%',y:'52%',action:'Đón khách ở tiệm bánh mì'},
    market:{x:'30%',y:'58%',action:'Đứng quầy nước mía'},
    ramen:{x:'48%',y:'62%',action:'Vào bếp hủ tiếu'},
    corner:{x:'95%',y:'55%',action:'Pha cà phê cho khách'}
  };
  const storageKey = 'escape_neon_city_progress_v1';
  function createExploration(storageProvider = () => window.localStorage) {
    let current = 'alley';
    const discovered = new Set([current]);
    let storage = null;
    try { storage = storageProvider() || null; } catch { /* Session-only play. */ }
    function restore() {
      if (!storage) return;
      let raw;
      try { raw = storage.getItem(storageKey); }
      catch { storage = null; return; }
      let saved;
      try { saved = JSON.parse(raw); } catch { saved = null; }
      current = 'alley';
      discovered.clear();
      discovered.add(current);
      const validId = id => typeof id === 'string' && (Object.hasOwn(places, id) || id === 'rooftop');
      // A versioned key and strict shape reject obsolete schemas and unknown IDs.
      if (!saved || typeof saved !== 'object' || Array.isArray(saved) ||
          Object.keys(saved).length !== 2 || !Object.hasOwn(saved,'current') ||
          !Object.hasOwn(saved,'discovered') || !validId(saved.current) ||
          !Array.isArray(saved.discovered) || saved.discovered.length < 1 ||
          saved.discovered.length > 5 || !saved.discovered.every(validId) ||
          new Set(saved.discovered).size !== saved.discovered.length ||
          !saved.discovered.includes('alley') || !saved.discovered.includes(saved.current)) return;
      current = saved.current === 'rooftop' ? 'ramen' : saved.current;
      for (const id of saved.discovered) discovered.add(id === 'rooftop' ? 'ramen' : id);
    }
    function save() {
      if (!storage) return;
      try { storage.setItem(storageKey, JSON.stringify({current, discovered:[...discovered]})); }
      catch { storage = null; }
    }
    restore();
    return {
      restore,
      get storageAvailable() { return storage !== null; },
      get current() { return current; },
      get discovered() { return [...discovered]; },
      move(direction) {
        const neighbors = places[current].neighbors;
        if (!Object.hasOwn(neighbors, direction)) return false;
        current = neighbors[direction];
        discovered.add(current);
        save();
        return true;
      },
      restart() {
        current='alley'; discovered.clear(); discovered.add(current);
        // Remove only this place's key; a fresh visit defaults to Hẻm đèn lồng.
        if (storage) {
          try { storage.removeItem(storageKey); } catch { storage = null; }
        }
      }
    };
  }
  window.NeonCity = {places, createExploration, storageKey};
  document.addEventListener('DOMContentLoaded', () => {
    const $ = id => document.getElementById(id);
    const scene = $('preview-scene'), ui = $('neon-city');
    if (!scene || !ui) return;
    const game = createExploration();
    const shop = window.createStreetShop?.({panel:$('nc-event'),isActive:()=>!scene.inert && !document.hidden && scene.dataset.destination==='city' && !$('nc-explore').hidden});
    function showEvent() { shop?.open(game.current); }
    const entry = $('nc-entry'), explore = $('nc-explore'), enter = $('nc-enter');
    const heading = $('nc-location');
    const buttons = [...ui.querySelectorAll('[data-nc-direction]')];
    const markers = [...ui.querySelectorAll('[data-nc-place]')];
    const active = () => !scene.inert && !document.hidden && scene.dataset.destination === 'city' && !explore.hidden;
    function render(focus = false) {
      const place = places[game.current];
      heading.textContent = place.name;
      $('nc-message').textContent = place.message;
      ui.dataset.location = game.current;
      const detail = details[game.current];
      ui.style?.setProperty('--nc-view-x', detail.x);
      ui.style?.setProperty('--nc-view-y', detail.y);
      const interaction = $('nc-interact');
      if (interaction) interaction.textContent = detail.action;
      shop?.close();
      const story = $('nc-story');
      if (story) { story.hidden = true; story.textContent = ''; }
      const coordinate = $('nc-coordinate');
      if (coordinate) coordinate.textContent = 'SÀI GÒN / ' + place.name.toUpperCase();
      const status = $('nc-storage-status');
      if (status) status.textContent = game.storageAvailable
        ? 'Tiến độ được lưu trong trình duyệt này.'
        : 'Không lưu được lúc này. Bạn vẫn có thể chơi trong lượt này.';
      for (const button of buttons) {
        const direction = button.dataset.ncDirection;
        const target = place.neighbors[direction];
        button.disabled = !target;
        button.setAttribute('aria-label', target ? `Đi ${ {north:"lên",south:"xuống",west:"trái",east:"phải"}[direction]} đến ${places[target].name}` : "Hướng này không có lối đi");
      }
      for (const marker of markers) {
        const id = marker.dataset.ncPlace;
        const visited = game.discovered.includes(id);
        marker.disabled = id !== game.current && !Object.values(place.neighbors).includes(id);
        marker.classList.toggle('is-discovered', visited);
        marker.classList.toggle('is-current', id === game.current);
        if (id === game.current) marker.setAttribute('aria-current','location');
        else marker.removeAttribute('aria-current');
        marker.textContent = `${places[id].name} · ${id === game.current ? 'Bạn đang ở đây' : visited ? 'Đã ghé' : 'Chưa ghé'}`;
      }
      if (focus) heading.focus();
    }
    function showExplore(visible, focus = false) {
      entry.hidden = visible;
      explore.hidden = !visible;
      ui.classList.toggle('is-exploring', visible);
      render();
      if (focus) (visible ? heading : enter).focus();
    }
    enter.addEventListener('click', () => {
      if (!scene.inert && !document.hidden && scene.dataset.destination === 'city') showExplore(true,true);
    });
    buttons.forEach(button => button.addEventListener('click', () => {
      if (!active() || button.disabled) return;
      if (game.move(button.dataset.ncDirection)) render(true);
    }));
    $('nc-interact')?.addEventListener('click', () => { if (active()) showEvent(); });
    markers.forEach(marker => marker.addEventListener('click', () => {
      if (!active()) return;
      const id = marker.dataset.ncPlace;
      if (id !== game.current) {
        const direction = Object.keys(places[game.current].neighbors).find(d => places[game.current].neighbors[d] === id);
        if (!direction || !game.move(direction)) return;
        render();
      }
      showEvent(); $('shop-heading')?.focus();
    }));
    document.addEventListener('keydown', event => {
      if (!active() || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target?.closest?.('#nc-event')) return;
      if (event.target?.closest?.('input, textarea, select, [contenteditable], [role="slider"]')) return;
      const direction = {w:'north',ArrowUp:'north',a:'west',ArrowLeft:'west',s:'south',ArrowDown:'south',d:'east',ArrowRight:'east'}[event.code?.startsWith('Key') ? event.code.slice(3).toLowerCase() : event.key.length === 1 ? event.key.toLowerCase() : event.key];
      if (!direction) return;
      event.preventDefault();
      if (game.move(direction)) render(true);
    });
    $('nc-restart').addEventListener('click', () => {
      if (!active()) return;
      game.restart(); render(true);
    });
    $('nc-entry-back').addEventListener('click', () => {
      if (active()) showExplore(false,true);
    });
    document.querySelector('[data-destination="city"]').addEventListener('click', () => {
      game.restore(); showExplore(false);
    });
    render();
  });
})();

