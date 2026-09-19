/** ESCAPE — scene coordinator */
document.addEventListener('DOMContentLoaded', () => {
  if (window.RainSimulation) new window.RainSimulation('rain-canvas');
  const audioEngine = window.AmbientAudioEngine ? new window.AmbientAudioEngine() : null;
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const hero = $('.experience-wrapper');
  const selection = $('#selection-scene');
  const preview = $('#preview-scene');
  const room = $('#room-scene');
  const curtain = $('#transition-curtain');
  const audioToggle = $('#audio-toggle');
  const soundStatus = $('#sound-status');
  const previewTitle = $('#preview-title');

  function setScene(scene) {
    [hero, selection, preview, room].forEach((item) => {
      if (!item) return;
      const active = item === scene;
      item.classList.toggle('active', active);
      if (item !== hero) item.setAttribute('aria-hidden', String(!active));
      if (item === hero) {
        item.style.opacity = active ? '1' : '0';
        item.style.pointerEvents = active ? 'auto' : 'none';
      }
    });
  }
  function fadeThrough(message, next) {
    const text = curtain?.querySelector('.trans-message');
    if (text) text.textContent = message;
    curtain?.classList.add('active');
    window.setTimeout(() => {
      setScene(next);
      window.setTimeout(() => curtain?.classList.remove('active'), 700);
    }, 1100);
  }
  function startAudio() {
    if (!audioEngine || audioEngine.isPlaying) return;
    audioEngine.start();
    audioToggle?.classList.add('is-playing');
    if (soundStatus) soundStatus.textContent = 'bật';
  }
  audioToggle?.addEventListener('click', () => {
    if (!audioEngine) return;
    const playing = audioEngine.toggle();
    audioToggle.classList.toggle('is-playing', playing);
    if (soundStatus) soundStatus.textContent = playing ? 'bật' : 'tắt';
  });
  $('#enter-btn')?.addEventListener('click', () => { startAudio(); fadeThrough('Where would you go?', selection); });
  $('#selection-back')?.addEventListener('click', () => setScene(hero));
  $('#preview-back')?.addEventListener('click', () => setScene(selection));

  $$('.destination').forEach((destination) => {
    destination.addEventListener('click', () => {
      const name = destination.querySelector('span')?.textContent || '';
      if (destination.dataset.destination === 'rainy') fadeThrough('Somewhere Rainy', room);
      else {
        if (previewTitle) previewTitle.textContent = name;
        preview.className = `preview-scene active ${destination.dataset.destination}`;
        selection.classList.remove('active');
        selection.setAttribute('aria-hidden', 'true');
      }
    });
  });
  function returnToSelection() { room?.classList.remove('is-staying'); fadeThrough('Where would you go?', selection); }
  $('#escape-again')?.addEventListener('click', returnToSelection);
  $('#escape-again-bottom')?.addEventListener('click', returnToSelection);
  $('#stay-here')?.addEventListener('click', () => room?.classList.add('is-staying'));

  const showCaption = (node) => { node?.classList.add('visible'); window.setTimeout(() => node?.classList.remove('visible'), 2600); };
  const windowEl = $('#interactive-window');
  const activateWindow = () => { windowEl?.classList.remove('is-wiped'); window.requestAnimationFrame(() => windowEl?.classList.add('is-wiped')); showCaption($('#window-caption')); };
  windowEl?.addEventListener('click', activateWindow);
  windowEl?.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activateWindow(); } });
  const book = $('#interactive-book');
  const activateBook = () => { book?.classList.remove('is-open'); window.requestAnimationFrame(() => book?.classList.add('is-open')); showCaption($('#book-caption')); };
  book?.addEventListener('click', activateBook);
  book?.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activateBook(); } });

  const letter = $('#interactive-letter');
  const letterModal = $('#letter-modal');
  const closeModal = () => { letterModal?.classList.remove('active'); letterModal?.setAttribute('aria-hidden', 'true'); };
  const openLetter = () => { letterModal?.classList.add('active'); letterModal?.setAttribute('aria-hidden', 'false'); };
  letter?.addEventListener('click', openLetter);
  letter?.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openLetter(); } });
  $('#close-letter-btn')?.addEventListener('click', closeModal);
  $('#letter-backdrop')?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeModal(); });

  const lampGlow = $('.warm-lamp-glow');
  if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches && window.innerWidth > 768) {
    window.addEventListener('mousemove', (event) => {
      const x = (event.clientX / window.innerWidth - .5) * 20;
      const y = (event.clientY / window.innerHeight - .5) * 14;
      if (lampGlow) lampGlow.style.transform = `translate(${x}px, ${y}px)`;
    }, { passive: true });
  }
  const time = $('#current-time');
  const updateTime = () => { if (time) time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
  updateTime(); window.setInterval(updateTime, 30000);
});
