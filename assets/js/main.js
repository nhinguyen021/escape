/**
 * ESCAPE — Main Coordinator & Subtle Interactive Physics
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Rain Canvas Simulation
  let rainSim = null;
  if (window.RainSimulation) {
    rainSim = new window.RainSimulation('rain-canvas');
  }

  // 2. Initialize Ambient Audio Engine
  let audioEngine = null;
  if (window.AmbientAudioEngine) {
    audioEngine = new window.AmbientAudioEngine();
  }

  const audioToggle = document.getElementById('audio-toggle');
  const soundStatus = document.getElementById('sound-status');

  if (audioToggle && audioEngine) {
    audioToggle.addEventListener('click', () => {
      const isNowPlaying = audioEngine.toggle();
      if (isNowPlaying) {
        audioToggle.classList.add('is-playing');
        soundStatus.textContent = 'bật';
      } else {
        audioToggle.classList.remove('is-playing');
        soundStatus.textContent = 'tắt';
      }
    });
  }

  // 3. Subtle Cinematic Parallax (Mouse & Gyroscope)
  const lampGlow = document.querySelector('.warm-lamp-glow');
  const heroContent = document.querySelector('.quote-container');
  
  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  let isParallaxActive = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

  if (isParallaxActive && window.innerWidth > 768) {
    window.addEventListener('mousemove', (e) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      // Very slight normalized offset (-1 to 1)
      targetX = (e.clientX - centerX) / centerX;
      targetY = (e.clientY - centerY) / centerY;
    }, { passive: true });

    const updateParallax = () => {
      // Smooth linear interpolation (lerp)
      currentX += (targetX - currentX) * 0.04;
      currentY += (targetY - currentY) * 0.04;

      if (lampGlow) {
        // Lamp moves gently in opposite direction to simulate interior depth
        lampGlow.style.transform = `translate(${currentX * -25}px, ${currentY * -20}px)`;
      }

      if (heroContent) {
        // Text floating with slight perspective
        heroContent.style.transform = `translate(${currentX * 10}px, ${currentY * 8}px)`;
      }

      requestAnimationFrame(updateParallax);
    };

    requestAnimationFrame(updateParallax);
  }

  // 4. "Enter" CTA Transition Flow into Room Scene
  const enterBtn = document.getElementById('enter-btn');
  const transitionCurtain = document.getElementById('transition-curtain');
  const experienceWrapper = document.querySelector('.experience-wrapper');
  const roomScene = document.getElementById('room-scene');
  const backToWindowBtn = document.getElementById('back-to-window');

  // Letter Modal Elements
  const letterEl = document.getElementById('interactive-letter');
  const letterModal = document.getElementById('letter-modal');
  const closeLetterBtn = document.getElementById('close-letter-btn');
  const letterBackdrop = document.getElementById('letter-backdrop');

  if (enterBtn && transitionCurtain && roomScene) {
    enterBtn.addEventListener('click', () => {
      // 1. Activate sound if not yet playing, with gentle user consent
      if (audioEngine && !audioEngine.isPlaying) {
        audioEngine.start();
        if (audioToggle) audioToggle.classList.add('is-playing');
        if (soundStatus) soundStatus.textContent = 'bật';
      }

      // 2. Smooth curtain fade in (interlude)
      transitionCurtain.classList.add('active');

      // 3. After reading interlude, reveal Room Scene
      setTimeout(() => {
        if (experienceWrapper) {
          experienceWrapper.style.opacity = '0';
          experienceWrapper.style.pointerEvents = 'none';
          experienceWrapper.style.transition = 'opacity 1s ease';
        }
        roomScene.classList.add('active');
        roomScene.setAttribute('aria-hidden', 'false');

        // Gently lift the curtain to reveal the room
        setTimeout(() => {
          transitionCurtain.classList.remove('active');
        }, 900);
      }, 2600);
    });
  }

  // Return to Window / Hero view
  if (backToWindowBtn && roomScene && experienceWrapper) {
    backToWindowBtn.addEventListener('click', () => {
      roomScene.classList.remove('active');
      roomScene.setAttribute('aria-hidden', 'true');

      setTimeout(() => {
        experienceWrapper.style.opacity = '1';
        experienceWrapper.style.pointerEvents = 'auto';
      }, 400);
    });
  }

  // 5. Interactive Letter Reader Interaction
  const openLetter = () => {
    if (letterModal) {
      letterModal.classList.add('active');
      letterModal.setAttribute('aria-hidden', 'false');
    }
  };

  const closeLetter = () => {
    if (letterModal) {
      letterModal.classList.remove('active');
      letterModal.setAttribute('aria-hidden', 'true');
    }
  };

  if (letterEl) {
    letterEl.addEventListener('click', openLetter);
    letterEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLetter();
      }
    });
  }

  if (closeLetterBtn) {
    closeLetterBtn.addEventListener('click', closeLetter);
  }

  if (letterBackdrop) {
    letterBackdrop.addEventListener('click', closeLetter);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLetter();
    }
  });

  // 6. Subtle Parallax for the Desk Still-Life
  const deskSurface = document.querySelector('.desk-surface');
  if (isParallaxActive && window.innerWidth > 768 && deskSurface) {
    window.addEventListener('mousemove', (e) => {
      if (!roomScene.classList.contains('active')) return;
      const xOffset = (e.clientX - window.innerWidth / 2) * 0.015;
      const yOffset = (e.clientY - window.innerHeight / 2) * 0.012;
      deskSurface.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
    }, { passive: true });
  }

  // 5. Subtle Real-Time Night Clock in Footer
  const timeEl = document.getElementById('current-time');
  if (timeEl) {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      timeEl.textContent = `${hours}:${minutes}`;
    };
    updateTime();
    setInterval(updateTime, 30000);
  }
});
