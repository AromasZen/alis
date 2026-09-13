/* ═══════════════════════════════════════════
   PRIMER MES — Motor Cinematográfico
   Navegación entre escenas, animaciones,
   audio player, progreso, interacciones
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Config ──
  const TOTAL_SCENES = 7; // 0=intro, 1-5=content, 6=future
  const TEXT_REVEAL_DELAY = 600;      // ms between each text element
  const TEXT_INITIAL_DELAY = 400;     // ms before first text in scene
  const SCENE_TRANSITION_MS = 800;    // must match CSS transition

  // ── State ──
  let currentScene = 0;
  let isTransitioning = false;
  let sceneTimers = [];

  // ── DOM ──
  const scenes = document.querySelectorAll('.scene');
  const progressFill = document.getElementById('progress-fill');
  const sceneIndicator = document.getElementById('scene-indicator');
  const navBack = document.getElementById('nav-back');

  // ── Particles ──
  function initParticles() {
    const container = document.getElementById('particles-layer');
    if (!container) return;
    const count = window.innerWidth < 600 ? 12 : 20;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDelay = Math.random() * 8 + 's';
      p.style.animationDuration = (6 + Math.random() * 6) + 's';
      p.style.width = p.style.height = (1 + Math.random() * 2) + 'px';
      container.appendChild(p);
    }
  }

  // ── Scene Navigation ──
  function goToScene(index) {
    if (index < 0 || index >= TOTAL_SCENES || index === currentScene || isTransitioning) return;
    isTransitioning = true;

    // Clear any pending timers from previous scene
    sceneTimers.forEach(t => clearTimeout(t));
    sceneTimers = [];

    const oldScene = scenes[currentScene];
    const newScene = scenes[index];

    // Exit old
    oldScene.classList.add('exiting');
    oldScene.classList.remove('active');

    // Enter new
    setTimeout(() => {
      oldScene.classList.remove('exiting');
      // Reset visibility classes on old scene elements
      resetSceneElements(oldScene);

      newScene.classList.add('active');
      newScene.scrollTop = 0;

      currentScene = index;
      updateProgress();
      updateNavBack();
      animateScene(index);

      setTimeout(() => {
        isTransitioning = false;
      }, 300);
    }, SCENE_TRANSITION_MS);
  }

  function nextScene() {
    goToScene(currentScene + 1);
  }

  function prevScene() {
    goToScene(currentScene - 1);
  }

  function resetSceneElements(scene) {
    scene.querySelectorAll('.visible').forEach(el => {
      el.classList.remove('visible');
    });
    scene.querySelectorAll('.revealed').forEach(el => {
      el.classList.remove('revealed');
    });
    scene.querySelectorAll('.show').forEach(el => {
      el.classList.remove('show');
    });
  }

  // ── Progress ──
  function updateProgress() {
    if (progressFill) {
      const pct = ((currentScene) / (TOTAL_SCENES - 1)) * 100;
      progressFill.style.width = pct + '%';
    }
    if (sceneIndicator) {
      if (currentScene === 0) {
        sceneIndicator.style.opacity = '0';
      } else if (currentScene <= 5) {
        sceneIndicator.style.opacity = '0.4';
        sceneIndicator.textContent = '0' + currentScene + ' / 05';
      } else {
        sceneIndicator.style.opacity = '0';
      }
    }
  }

  function updateNavBack() {
    if (navBack) {
      if (currentScene > 0) {
        navBack.classList.add('visible');
      } else {
        navBack.classList.remove('visible');
      }
    }
  }

  // ── Scene Animations ──
  function animateScene(index) {
    const scene = scenes[index];
    if (!scene) return;

    const revealElements = scene.querySelectorAll('[data-reveal]');
    let delay = TEXT_INITIAL_DELAY;

    revealElements.forEach((el) => {
      const customDelay = el.getAttribute('data-reveal-delay');
      const thisDelay = customDelay ? parseInt(customDelay) : delay;

      const timer = setTimeout(() => {
        el.classList.add('visible');
      }, thisDelay);
      sceneTimers.push(timer);

      if (!customDelay) {
        delay += TEXT_REVEAL_DELAY;
      }
    });

    // Special: grid items stagger
    const gridItems = scene.querySelectorAll('.memory-grid-item');
    if (gridItems.length) {
      let gridDelay = delay + 300;
      gridItems.forEach((item, i) => {
        const timer = setTimeout(() => {
          item.classList.add('revealed');
        }, gridDelay + i * 150);
        sceneTimers.push(timer);
      });
    }

    // Special: chapter preview items stagger
    const chapterItems = scene.querySelectorAll('.chapter-preview-item');
    if (chapterItems.length) {
      let chapDelay = delay + 200;
      chapterItems.forEach((item, i) => {
        const timer = setTimeout(() => {
          item.classList.add('visible');
        }, chapDelay + i * 250);
        sceneTimers.push(timer);
      });
    }

    // Ambient glows
    const glows = scene.querySelectorAll('.ambient-glow');
    glows.forEach(g => {
      const timer = setTimeout(() => {
        g.classList.add('visible');
      }, 1000);
      sceneTimers.push(timer);
    });
  }

  // ── Audio Player ──
  function initAudioPlayer() {
    const playBtn = document.getElementById('audio-play-btn');
    const audioEl = document.getElementById('audio-element');
    const progressBar = document.getElementById('audio-progress');
    const progressFillEl = document.getElementById('audio-progress-fill');
    const timeEl = document.getElementById('audio-time');

    if (!playBtn || !audioEl) return;

    let isPlaying = false;

    function formatTime(s) {
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return m + ':' + (sec < 10 ? '0' : '') + sec;
    }

    playBtn.addEventListener('click', () => {
      if (isPlaying) {
        audioEl.pause();
        playBtn.innerHTML = '<svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>';
        isPlaying = false;
      } else {
        audioEl.play().catch(() => {});
        playBtn.innerHTML = '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
        isPlaying = true;
      }
    });

    audioEl.addEventListener('timeupdate', () => {
      if (!audioEl.duration) return;
      const pct = (audioEl.currentTime / audioEl.duration) * 100;
      if (progressFillEl) progressFillEl.style.width = pct + '%';
      if (timeEl) timeEl.textContent = formatTime(audioEl.currentTime) + ' / ' + formatTime(audioEl.duration);
    });

    audioEl.addEventListener('ended', () => {
      isPlaying = false;
      playBtn.innerHTML = '<svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>';
      if (progressFillEl) progressFillEl.style.width = '0%';
    });

    if (progressBar) {
      progressBar.addEventListener('click', (e) => {
        if (!audioEl.duration) return;
        const rect = progressBar.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        audioEl.currentTime = pct * audioEl.duration;
      });
    }
  }

  // ── Toggle Reveal (Lo que todos ven / Lo que nadie ve) ──
  function initToggleReveal() {
    const toggle = document.getElementById('toggle-reveal');
    if (!toggle) return;

    const overlay = toggle.querySelector('.toggle-overlay');
    const hint = document.getElementById('toggle-hint');
    let revealed = false;

    toggle.addEventListener('click', () => {
      revealed = !revealed;
      if (revealed) {
        overlay.classList.add('show');
        if (hint) hint.textContent = 'toca de nuevo para volver';
      } else {
        overlay.classList.remove('show');
        if (hint) hint.textContent = 'toca para ver lo que nadie ve';
      }
    });
  }

  // ── Keyboard Navigation ──
  function initKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        // Find and click the continue button in current scene
        const scene = scenes[currentScene];
        const btn = scene.querySelector('.btn-continue, .btn-start');
        if (btn && btn.classList.contains('visible')) {
          btn.click();
        }
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevScene();
      }
      if (e.key === 'Escape') {
        window.location.href = 'index.html.html';
      }
    });
  }

  // ── Touch Swipe ──
  function initTouch() {
    let startX = 0;
    let startY = 0;

    document.addEventListener('touchstart', (e) => {
      startX = e.changedTouches[0].screenX;
      startY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].screenX - startX;
      const dy = e.changedTouches[0].screenY - startY;

      // Only horizontal swipes with sufficient distance
      if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) {
          // Swipe left = next
          const scene = scenes[currentScene];
          const btn = scene.querySelector('.btn-continue, .btn-start');
          if (btn && btn.classList.contains('visible')) {
            btn.click();
          }
        } else {
          // Swipe right = prev
          prevScene();
        }
      }
    }, { passive: true });
  }

  // ── Init ──
  function init() {
    initParticles();
    initAudioPlayer();
    initToggleReveal();
    initKeyboard();
    initTouch();

    // Start at scene 0
    scenes[0].classList.add('active');
    currentScene = 0;
    updateProgress();
    updateNavBack();
    animateScene(0);

    // Bind all continue buttons
    document.querySelectorAll('[data-action="next"]').forEach(btn => {
      btn.addEventListener('click', nextScene);
    });

    // Bind back button
    if (navBack) {
      navBack.addEventListener('click', prevScene);
    }
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
