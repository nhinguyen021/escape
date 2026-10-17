/** ESCAPE — Scene coordinator, atmospheres & audio accessibility */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize procedural simulations
  const rainSimulation = window.RainSimulation ? new window.RainSimulation('rain-canvas') : null;
  const audioEngine = window.AmbientAudioEngine ? new window.AmbientAudioEngine() : null;

  // DOM Elements
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const hero = $('#hero-scene') || $('.experience-wrapper');
  const selection = $('#selection-scene');
  const preview = $('#preview-scene');
  const room = $('#room-scene');
  const sea = $('#sea-scene');
  const forest = $('#forest-scene');
  const curtain = $('#transition-curtain');
  const audioWidget = $('#audio-widget');
  const audioToggle = $('#audio-toggle');
  const audioPanelBtn = $('#audio-panel-btn');
  const audioPanel = $('#audio-panel');
  const soundStatus = $('#sound-status');
  const musicSlider = $('#music-vol-slider');
  const rainSlider = $('#rain-vol-slider');
  const musicValLabel = $('#music-vol-val');
  const rainValLabel = $('#rain-vol-val');
  const rainStatusBadge = $('#rain-status-badge');

  const previewTitle = $('#preview-title');
  const enterBtn = $('#enter-btn');
  const selectionBack = $('#selection-back');
  const previewBack = $('#preview-back');
  const doorwayPortal = $('#doorway-portal');
  const rainCanvas = $('#rain-canvas');
  const themeLayers = $$('.theme-layer');
  const destinationCards = $$('.destination-card');
  const letter = $('#interactive-letter');
  const letterModal = $('#letter-modal');
  const closeLetterBtn = $('#close-letter-btn');
  const letterBackdrop = $('#letter-backdrop');

  const allScenes = [hero, selection, preview, room, sea, forest];
  const rainPiano = window.createRainPiano?.({engine:audioEngine,room});
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let currentScene = hero;
  const syncBackgroundRain = () => rainSimulation?.setPaused(document.hidden || motionPreference.matches || currentScene === room || currentScene === forest);
  motionPreference.addEventListener?.('change',syncBackgroundRain);
  document.addEventListener('visibilitychange',syncBackgroundRain);
  let transitionTimer;
  let curtainTimer;
  let focusTimer;

  function updateRainBadge() {
    if (!rainStatusBadge) return;
    const isRainActive = audioEngine?.isPlaying && audioEngine?.inRainyRoom && (audioEngine?.rainVolume > 0.001);
    rainStatusBadge.textContent = isRainActive ? 'đang phát' : 'chỉ trong Góc mưa';
    rainStatusBadge.classList.toggle('is-active', Boolean(isRainActive));
  }

  function updateAudioUI(isPlaying) {
    if (!audioToggle) return;
    audioToggle.classList.toggle('is-playing', isPlaying);
    if (soundStatus) soundStatus.textContent = isPlaying ? 'bật' : 'tắt';
    audioToggle.setAttribute('aria-pressed',String(isPlaying));
    rainPiano?.syncAudio();
    updateRainBadge();
  }

  /**
   * Set active scene with strict focus trapping prevention & room audio syncing:
   * Hidden scenes are marked inert, aria-hidden="true", and visibility="hidden"
   */
  function setScene(targetScene, focusTarget) {
    currentScene = targetScene;
    syncBackgroundRain();
    rainPiano?.setActive(targetScene === room);
    document.body.classList.toggle('in-subscene', targetScene !== hero);

    // Sync rain sound presence: only audible inside Góc mưa
    if (audioEngine) {
      audioEngine.setRoom(targetScene === room);
      audioEngine.setTrack(targetScene === room ? 'rainy' :
        targetScene === forest ? 'quiet' : targetScene === sea ? 'sea' : targetScene === preview ? preview.dataset.destination : 'intro');
      updateRainBadge();
    }

    allScenes.forEach((scene) => {
      if (!scene) return;
      const isActive = scene === targetScene;

      scene.classList.toggle('active', isActive);
      scene.setAttribute('aria-hidden', String(!isActive));
      scene.inert = !isActive;

      if (isActive) {
        scene.style.visibility = 'visible';
        scene.style.pointerEvents = 'auto';
        if (scene === hero) scene.style.opacity = '1';
      } else {
        scene.style.pointerEvents = 'none';
        if (scene === hero) scene.style.opacity = '0';
        window.setTimeout(() => {
          if (!scene.classList.contains('active')) {
            scene.style.visibility = 'hidden';
          }
        }, 1100);
      }
    });

    // Cancel focus left over from an earlier scene.
    clearTimeout(focusTimer);
    focusTimer = window.setTimeout(() => {
      if (!targetScene?.classList.contains('active')) return;
      const target = focusTarget || (targetScene === selection ? selection.querySelector('.destination-card') :
        targetScene === forest ? $('#forest-back') : targetScene === hero ? enterBtn : targetScene === preview ? previewBack : targetScene === sea ? $('#sea-back') : $('#escape-again'));
      target?.focus();
    }, 350);
  }

  /**
   * Cinematic curtain transition
   */
  function fadeThrough(message, nextScene, focusTarget) {
    clearTimeout(transitionTimer);
    clearTimeout(curtainTimer);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const text = curtain?.querySelector('.trans-message');
    if (text) text.textContent = message || '';
    curtain?.classList.add('active');

    transitionTimer = window.setTimeout(() => {
      setScene(nextScene, focusTarget);
      curtainTimer = window.setTimeout(() => curtain?.classList.remove('active'), reduced ? 0 : 650);
    }, reduced ? 0 : 1000);
  }

  // Initial State: Only hero is active & interactive
  setScene(hero);
  if (letterModal) {
    letterModal.inert = true;
    letterModal.setAttribute('aria-hidden', 'true');
    letterModal.style.visibility = 'hidden';
  }

  /**
   * Audio Controls & Dual Volume Sliders (Music & Rain)
   */
  // Initialize slider values from stored settings (zero autoplay on page load)
  const initialMusic = Math.round((audioEngine?.musicVolume ?? 0.65) * 100);
  const initialRain = Math.round((audioEngine?.rainVolume ?? 0.60) * 100);

  if (musicSlider) musicSlider.value = initialMusic;
  if (musicValLabel) musicValLabel.textContent = initialMusic === 0 ? '0% (tắt)' : initialMusic + '%';

  if (rainSlider) rainSlider.value = initialRain;
  if (rainValLabel) rainValLabel.textContent = initialRain === 0 ? '0% (tắt)' : initialRain + '%';

  // Master Sound Toggle
  audioToggle?.addEventListener('click', async () => {
    if (!audioEngine) return;
    try {
      audioEngine.toggle();
      updateAudioUI(audioEngine.isPlaying);
      if (audioEngine.isPlaying && audioEngine.ctx?.state === 'suspended') await audioEngine.ctx.resume();
    } catch (error) {
      audioEngine.stop();updateAudioUI(false);
      if(soundStatus)soundStatus.textContent='chưa bật được — thử lại';
    }
  });

  updateAudioUI(false);

  // Toggle Volume Panel
  const toggleAudioPanel = (open) => {
    if (!audioPanel) return;
    const shouldOpen = open !== undefined ? open : !audioPanel.classList.contains('is-open');
    audioPanel.classList.toggle('is-open', shouldOpen);
    audioPanel.setAttribute('aria-hidden', String(!shouldOpen));
    audioPanel.inert = !shouldOpen;
    audioPanelBtn?.setAttribute('aria-expanded', String(shouldOpen));
  };
  toggleAudioPanel(false);

  audioPanelBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleAudioPanel();
  });

  // Close audio panel when clicking outside or pressing Escape
  document.addEventListener('click', (e) => {
    if (audioWidget && !audioWidget.contains(e.target)) {
      toggleAudioPanel(false);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && audioPanel?.classList.contains('is-open')) {
      toggleAudioPanel(false);
    }
  });

  // Music volume slider event
  musicSlider?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    if (musicValLabel) musicValLabel.textContent = val === 0 ? '0% (tắt)' : val + '%';
    audioEngine?.setMusicVolume(val / 100);
  });

  // Rain volume slider event
  rainSlider?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    if (rainValLabel) rainValLabel.textContent = val === 0 ? '0% (tắt)' : val + '%';
    audioEngine?.setRainVolume(val / 100);
    updateRainBadge();
  });

  /**
   * MÀN 1: Mở đầu — Doorway Portal Light Interaction
   * Hover or focus on ESCAPE expands the ambient light beam like an ajar door
   */
  const openDoor = () => {
    doorwayPortal?.classList.add('is-open');
    document.body.classList.add('door-opened');
  };
  const closeDoor = () => {
    doorwayPortal?.classList.remove('is-open');
    document.body.classList.remove('door-opened');
  };

  enterBtn?.addEventListener('pointerenter', openDoor);
  enterBtn?.addEventListener('pointerleave', closeDoor);
  enterBtn?.addEventListener('focus', openDoor);
  enterBtn?.addEventListener('blur', closeDoor);

  // Click ESCAPE: Smooth transition to selection scene WITHOUT auto-playing music
  enterBtn?.addEventListener('click', () => {
    closeDoor();
    fadeThrough('BẠN MUỐN GHÉ NƠI NÀO?', selection);
  });

  /**
   * MÀN 2: Chọn nơi — Atmospheric Shifts on Hover & Focus
   */
  function setAtmosphere(theme) {
    themeLayers.forEach((layer) => {
      const match = layer.dataset.theme === theme;
      layer.classList.toggle('active', match);
    });

    if (rainCanvas) {
      rainCanvas.style.transition = 'opacity 1.2s ease';
      rainCanvas.style.opacity = (theme === 'rainy' || !theme) ? '1' : '0.15';
    }
  }

  function resetAtmosphere() {
    themeLayers.forEach((layer) => layer.classList.remove('active'));
    if (rainCanvas) {
      rainCanvas.style.opacity = '1';
    }
  }

  destinationCards.forEach((card) => {
    const theme = card.dataset.destination;

    const handleEnter = () => setAtmosphere(theme);
    const handleLeave = (event) => {
      if (event.type === 'blur') {
        window.setTimeout(() => {
          const activeCard = document.activeElement?.closest('.destination-card');
          if (!activeCard) resetAtmosphere();
        }, 50);
      } else {
        resetAtmosphere();
      }
    };

    card.addEventListener('pointerenter', handleEnter);
    card.addEventListener('pointerleave', handleLeave);
    card.addEventListener('focus', handleEnter);
    card.addEventListener('blur', handleLeave);

    // Click navigation (direct, mobile-friendly without hover dependency)
    card.addEventListener('click', () => {
      resetAtmosphere();
      const cardTitle = card.querySelector('.card-title')?.textContent || '';

      if (theme === 'rainy') {
        fadeThrough('Góc mưa', room);
      } else if (theme === 'quiet') {
        fadeThrough('Điều đẹp đẽ chẳng cần vội vàng.', forest);
      } else if (theme === 'sea') {
        fadeThrough('Một góc biển, dành riêng cho bạn.', sea);
      } else {
        if (previewTitle) previewTitle.textContent = cardTitle;
        if (preview) {
          preview.className = `preview-scene ${theme}`;
          preview.dataset.destination = theme;
        }
        fadeThrough('', preview);
      }
    });
  });

  // Selection Back button: Return to Hero scene
  selectionBack?.addEventListener('click', () => {
    resetAtmosphere();
    fadeThrough('', hero);
  });

  $('#forest-back')?.addEventListener('click', () => fadeThrough('BẠN MUỐN GHÉ NƠI NÀO?', selection));

  $('#sea-back')?.addEventListener('click', () => fadeThrough('BẠN MUỐN GHÉ NƠI NÀO?', selection));

  // Preview Back button: Return to Selection scene
  previewBack?.addEventListener('click', () => {
    fadeThrough('BẠN MUỐN GHÉ NƠI NÀO?', selection);
  });

  /**
   * SCENE 3: The Quiet Room & Desk by the Rain
   */
  function returnToSelection() {
    room?.classList.remove('is-staying');
    fadeThrough('BẠN MUỐN GHÉ NƠI NÀO?', selection);
  }

  $('#escape-again')?.addEventListener('click', returnToSelection);
  $('#escape-again-bottom')?.addEventListener('click', returnToSelection);
  $('#stay-here')?.addEventListener('click', () => room?.classList.add('is-staying'));
  const leaveStay = () => room?.classList.remove('is-staying');
  room?.addEventListener('click', (event) => {
    if (!event.target.closest('button, [role="button"]')) leaveStay();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') leaveStay();
  });

  // Windowwipe interaction
  const showCaption = (node) => {
    if (!node) return;
    node.classList.add('visible');
    window.setTimeout(() => node.classList.remove('visible'), 2600);
  };

  const windowEl = $('#interactive-window');
  const activateWindow = () => {
    windowEl?.classList.remove('is-wiped');
    window.requestAnimationFrame(() => windowEl?.classList.add('is-wiped'));
    showCaption($('#window-caption'));
  };
  windowEl?.addEventListener('click', activateWindow);
  windowEl?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activateWindow();
    }
  });

  // Book page turning interaction
  const book = $('#interactive-book');
  const activateBook = () => {
    book?.classList.remove('is-open');
    window.requestAnimationFrame(() => book?.classList.add('is-open'));
    showCaption($('#book-caption'));
  };
  book?.addEventListener('click', activateBook);
  book?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activateBook();
    }
  });

  // Handwritten letter modal interaction
  const openLetter = () => {
    if (!letterModal) return;
    letterModal.classList.add('active');
    letterModal.inert = false;
    letterModal.setAttribute('aria-hidden', 'false');
    letterModal.style.visibility = 'visible';
    closeLetterBtn?.focus();
  };

  const closeModal = () => {
    if (!letterModal) return;
    letterModal.classList.remove('active');
    letterModal.inert = true;
    letterModal.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => {
      if (!letterModal.classList.contains('active')) {
        letterModal.style.visibility = 'hidden';
      }
    }, 400);
    letter?.focus();
  };

  letter?.addEventListener('click', openLetter);
  letter?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openLetter();
    }
  });
  closeLetterBtn?.addEventListener('click', closeModal);
  letterBackdrop?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && letterModal?.classList.contains('active')) {
      closeModal();
    }
  });

  // Subtle mousemove parallax (respects prefers-reduced-motion)
  const lampGlow = $('.warm-lamp-glow');
  if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches && window.innerWidth > 768) {
    window.addEventListener('mousemove', (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 20;
      const y = (event.clientY / window.innerHeight - 0.5) * 14;
      if (lampGlow) lampGlow.style.transform = `translate(${x}px, ${y}px)`;
    }, { passive: true });
  }

  // Subtle clock in footer
  const time = $('#current-time');
  const updateTime = () => {
    if (time) time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  updateTime();
  window.setInterval(updateTime, 30000);
});
