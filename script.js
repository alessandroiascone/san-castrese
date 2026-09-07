// Associazione San Castrese · V4 multipagina
const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');

function syncHeader(){ header.classList.toggle('scrolled', window.scrollY > 28); }
syncHeader();
window.addEventListener('scroll', syncHeader, { passive:true });

function closeMenu({ restoreFocus = false } = {}){
  menuToggle?.setAttribute('aria-expanded','false');
  mainNav?.classList.remove('open');
  document.body.style.overflow = '';
  if(restoreFocus) menuToggle?.focus();
}

menuToggle?.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') === 'true';
  if(open){
    closeMenu();
  }else{
    menuToggle.setAttribute('aria-expanded','true');
    mainNav?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
});
mainNav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => closeMenu()));
window.addEventListener('resize', () => { if(window.innerWidth > 980) closeMenu(); }, { passive:true });
document.addEventListener('keydown', e => {
  if(e.key === 'Escape' && mainNav?.classList.contains('open')) closeMenu({ restoreFocus:true });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if(entry.isIntersecting){ entry.target.classList.add('visible'); observer.unobserve(entry.target); } });
}, { threshold:.12, rootMargin:'0px 0px -40px' });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Background images: remote archive photo with graceful visual fallback.
document.querySelectorAll('.remote-photo').forEach(el => {
  const url = el.dataset.bg;
  if(!url) return;
  const img = new Image();
  img.onload = () => { el.style.backgroundImage = `url("${url}")`; };
  img.onerror = () => {
    el.style.backgroundImage = 'radial-gradient(circle at 65% 30%, rgba(225,201,159,.65), transparent 20%), linear-gradient(145deg,#9b715e,#51202a 62%,#321116)';
  };
  img.src = url;
});

// Archive filter.
const filterButtons = document.querySelectorAll('.filter-pills button');
const galleryItems = document.querySelectorAll('.gallery-item');
filterButtons.forEach(btn => btn.addEventListener('click', () => {
  filterButtons.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filter = btn.dataset.filter;
  galleryItems.forEach(item => {
    const match = filter === 'all' || item.dataset.category === filter;
    item.style.display = match ? '' : 'none';
  });
}));

// Lightbox.
const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const lightboxTitle = document.querySelector('#lightbox-title');
const lightboxYear = document.querySelector('#lightbox-year');
const lightboxClose = document.querySelector('.lightbox-close');
document.querySelectorAll('button.gallery-item[data-image]').forEach(item => item.addEventListener('click', () => {
  lightboxImage.style.backgroundImage = `url("${item.dataset.image}")`;
  lightboxTitle.textContent = item.dataset.title || 'Archivio San Castrese';
  lightboxYear.textContent = item.dataset.year || '';
  if(typeof lightbox.showModal === 'function') lightbox.showModal();
}));
lightboxClose?.addEventListener('click', () => lightbox.close());
lightbox?.addEventListener('click', e => { if(e.target === lightbox) lightbox.close(); });

// Interactive territory pins.
const placeButtons = document.querySelectorAll('.place-list button');
const pins = document.querySelectorAll('.pin');
placeButtons.forEach(btn => btn.addEventListener('click', () => {
  placeButtons.forEach(b => b.classList.remove('active'));
  pins.forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.querySelector(`.pin-${btn.dataset.place}`)?.classList.add('active');
}));

// Set current year.
const yearEl = document.querySelector('#year');
if(yearEl) yearEl.textContent = new Date().getFullYear();


// V2: close menu on orientation changes and keep touch behavior stable.
window.addEventListener('orientationchange', () => {
  menuToggle?.setAttribute('aria-expanded','false');
  mainNav?.classList.remove('open');
  document.body.style.overflow = '';
});


// V5.7 · Musica di sottofondo del sito.
// Nota: i browser moderni possono bloccare l'autoplay con audio finché l'utente non interagisce con la pagina.
(() => {
  const AUDIO_SRC = 'assets/musica-san-castrese.mp3';
  const STORAGE_KEY = 'sanCastreseMusicState';
  const TARGET_VOLUME = 0.20;
  const isHome = /(?:\/|\/index\.html)$/.test(window.location.pathname);

  const audio = document.createElement('audio');
  audio.id = 'site-audio';
  audio.src = AUDIO_SRC;
  audio.preload = 'auto';
  audio.loop = true;
  audio.playsInline = true;
  audio.setAttribute('aria-hidden', 'true');
  document.body.appendChild(audio);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.id = 'music-toggle';
  toggle.className = 'music-toggle';
  toggle.setAttribute('aria-label', 'Attiva musica di sottofondo');
  toggle.setAttribute('aria-pressed', 'false');
  toggle.innerHTML = '<span class="music-toggle-icon" aria-hidden="true">♫</span><span class="music-toggle-label">Musica</span>';
  document.body.appendChild(toggle);

  const entry = document.getElementById('audio-entry');
  const entryButton = document.getElementById('audio-entry-button');
  const ENTRY_KEY = 'sanCastreseEntrySeen';


  let state = { playing: false, time: 0, explicitPause: false };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) state = { ...state, ...JSON.parse(raw) };
  } catch (_) {}

  const saveState = (patch = {}) => {
    state = { ...state, ...patch };
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  };

  const syncToggle = () => {
    const playing = !audio.paused;
    toggle.classList.toggle('is-playing', playing);
    toggle.classList.toggle('needs-gesture', audio.paused && !state.explicitPause && (isHome || state.playing));
    toggle.setAttribute('aria-pressed', playing ? 'true' : 'false');
    toggle.setAttribute('aria-label', playing ? 'Disattiva musica di sottofondo' : 'Attiva musica di sottofondo');
    const label = toggle.querySelector('.music-toggle-label');
    if (label) label.textContent = playing ? 'Musica on' : 'Musica';
  };

  const fadeTo = (target, duration = 900) => {
    const start = audio.volume;
    const diff = target - start;
    const started = performance.now();
    const step = now => {
      const t = Math.min(1, (now - started) / duration);
      audio.volume = Math.max(0, Math.min(1, start + diff * t));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const tryPlay = async ({ fromGesture = false } = {}) => {
    if (state.explicitPause && !fromGesture) {
      syncToggle();
      return false;
    }
    try {
      if (Number.isFinite(state.time) && state.time > 0 && Math.abs((audio.currentTime || 0) - state.time) > 2) {
        try { audio.currentTime = state.time; } catch (_) {}
      }
      audio.volume = 0.01;
      await audio.play();
      fadeTo(TARGET_VOLUME, 1200);
      saveState({ playing: true, explicitPause: false });
      syncToggle();
      return true;
    } catch (_) {
      audio.volume = TARGET_VOLUME;
      syncToggle();
      return false;
    }
  };

  const pauseMusic = () => {
    fadeTo(0, 220);
    window.setTimeout(() => {
      audio.pause();
      audio.volume = TARGET_VOLUME;
      saveState({ playing: false, explicitPause: true, time: audio.currentTime || 0 });
      syncToggle();
    }, 240);
  };

  toggle.addEventListener('click', async () => {
    if (audio.paused) {
      saveState({ explicitPause: false });
      await tryPlay({ fromGesture: true });
    } else {
      pauseMusic();
    }
  });

  audio.addEventListener('play', syncToggle);
  audio.addEventListener('pause', syncToggle);
  audio.addEventListener('timeupdate', () => {
    if (Math.floor(audio.currentTime) % 3 === 0) saveState({ time: audio.currentTime, playing: !audio.paused });
  });

  const persist = () => saveState({ time: audio.currentTime || 0, playing: !audio.paused });
  window.addEventListener('pagehide', persist);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') persist(); });

  // Ingresso audio: sui browser mobile il gesto dell'utente sblocca l'audio in modo affidabile.
  let entrySeen = false;
  try { entrySeen = sessionStorage.getItem(ENTRY_KEY) === '1'; } catch (_) {}

  if (isHome && entry && !entrySeen) {
    document.documentElement.classList.add('audio-entry-open');
    entryButton?.addEventListener('click', async () => {
      saveState({ explicitPause: false });
      await tryPlay({ fromGesture: true });
      try { sessionStorage.setItem(ENTRY_KEY, '1'); } catch (_) {}
      entry.classList.add('is-closing');
      document.documentElement.classList.remove('audio-entry-open');
      window.setTimeout(() => entry.remove(), 520);
    }, { once: true });
  } else if (entry) {
    entry.remove();
  }

  // Se l'ingresso è già stato superato, prova l'avvio immediato; nelle pagine interne riprende se era già in riproduzione.
  const shouldStart = ((isHome && entrySeen) || state.playing) && !state.explicitPause;
  if (shouldStart) {
    tryPlay();

    // Fallback previsto dai browser mobile: al primo gesto dell'utente parte, se l'autoplay era stato bloccato.
    const unlock = async () => {
      if (audio.paused && !state.explicitPause) await tryPlay({ fromGesture: true });
      if (!audio.paused) {
        document.removeEventListener('pointerdown', unlock, true);
        document.removeEventListener('touchstart', unlock, true);
        document.removeEventListener('keydown', unlock, true);
      }
    };
    document.addEventListener('pointerdown', unlock, true);
    document.addEventListener('touchstart', unlock, { capture: true, passive: true });
    document.addEventListener('keydown', unlock, true);
  }

  syncToggle();
})();
