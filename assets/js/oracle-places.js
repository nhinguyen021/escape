/* Oracle-only discovery state; never writes place progress or routing. */
(() => {
  const storageKey = 'escape_place_oracle_v1';
  const ids = ['sea', 'rainy', 'quiet', 'city', 'impossible'];
  function createProgress(provider = () => window.localStorage) {
    const discovered = new Set();
    let storage;
    try { storage = provider(); } catch { storage = null; }
    if (storage) {
      let raw;
      try { raw = storage.getItem(storageKey); } catch { storage = null; }
      try {
        const data = JSON.parse(raw);
        if (data && data.version === 1 && data.cards && typeof data.cards === 'object' && !Array.isArray(data.cards)) {
          // Validate each known place independently; never coerce strings/numbers.
          for (const id of ids) if (Object.hasOwn(data.cards, id) && data.cards[id] === true) discovered.add(id);
        }
      } catch { /* Missing/malformed data starts with undiscovered cards. */ }
    }
    return {
      has: id => discovered.has(id),
      discover(id) {
        if (!ids.includes(id) || discovered.has(id)) return false;
        discovered.add(id);
        if (storage) {
          const cards = Object.fromEntries(ids.map(key => [key, discovered.has(key)]));
          try { storage.setItem(storageKey, JSON.stringify({version: 1, cards})); }
          catch { storage = null; } // Retain the in-memory discovery for this session.
        }
        return true;
      }
    };
  }
  window.PlaceOracleProgress = {storageKey, createProgress};
})();

document.addEventListener('DOMContentLoaded', () => {
  if (!window.PlaceOracle) return;
  const oracle = window.PlaceOracle.create();
  const progress = window.PlaceOracleProgress.createProgress();
  const placements = [
    ['sea', '#sea-scene .sea-world', 'Một lá bài sóng mang đến', '≈'],
    ['rainy', '#room-scene .rr-illustration', 'Lá bài bên ánh đèn', '☂'],
    ['quiet', '#forest-scene .qf-garden', 'Lá bài bên rêu xanh', '❧'],
    ['city', '#nc-explore .nc-landmark', 'Lá bài sáng trong hẻm', '✧'],
    ['impossible', '#imp-garden', 'Lá bài giữa khu vườn', '☾']
  ];
  for (const [id, selector, label, symbol] of placements) {
    const host = document.querySelector(selector);
    if (!host) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'oracle-discovery oracle-discovery--' + id;
    button.dataset.oraclePlace = id;
    button.setAttribute('aria-label', label + ' — mở ' + window.PlaceOracle.cards[id].title);
    button.setAttribute('aria-haspopup', 'dialog');
    button.innerHTML = '<span class="oracle-found-card" aria-hidden="true">' + symbol + '</span><span class="oracle-found-hint">' + label + '</span>';
    function updateDiscovery() {
      if (!progress.has(id)) return;
      button.classList.add('oracle-discovered');
      button.setAttribute('aria-label', label + ' — đã tìm thấy; đọc lại ' + window.PlaceOracle.cards[id].title);
    }
    updateDiscovery();
    button.addEventListener('click', event => {
      event.stopPropagation();
      if (button.closest('[inert], [hidden]')) return;
      // Finding the object counts even if the visitor closes before flipping it.
      if (oracle.open(id, {trigger: button})) {
        progress.discover(id);
        updateDiscovery();
      }
    });
    // These are siblings of the drawing/piano/plant controls, never their children.
    if (id === 'quiet') host.querySelector('.qf-earth').after(button);
    else host.append(button);
  }
});
