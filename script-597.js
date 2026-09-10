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


// V5.9.7 · Audio robusto + ingresso sugli accessi esterni.
(() => {
  const AUDIO_SRC = '/assets/musica-san-castrese.mp3?v=597';
  const STORAGE_KEY = 'sanCastreseMusicState';
  const TARGET_VOLUME = 0.20;
  const path = window.location.pathname || '/';
  const isHome = path === '/' || path.endsWith('/index.html');

  const audio = document.createElement('audio');
  audio.id = 'site-audio';
  audio.src = AUDIO_SRC;
  audio.preload = 'auto';
  audio.loop = true;
  audio.playsInline = true;
  audio.setAttribute('playsinline','');
  audio.setAttribute('webkit-playsinline','');
  audio.setAttribute('aria-hidden','true');
  document.body.appendChild(audio);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.id = 'music-toggle';
  toggle.className = 'music-toggle';
  toggle.setAttribute('aria-label','Attiva musica di sottofondo');
  toggle.setAttribute('aria-pressed','false');
  toggle.innerHTML = '<span class="music-toggle-icon" aria-hidden="true">♫</span><span class="music-toggle-label">Musica</span>';
  document.body.appendChild(toggle);

  const entry = document.getElementById('audio-entry');
  const entryButton = document.getElementById('audio-entry-button');

  let state = { playing:false, time:0, explicitPause:false };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) state = { ...state, ...JSON.parse(raw) };
  } catch (_) {}

  const saveState = (patch={}) => {
    state = { ...state, ...patch };
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  };

  const syncToggle = () => {
    const playing = !audio.paused;
    toggle.classList.toggle('is-playing', playing);
    toggle.classList.toggle('needs-gesture', audio.paused && !state.explicitPause);
    toggle.setAttribute('aria-pressed', playing ? 'true' : 'false');
    toggle.setAttribute('aria-label', playing ? 'Disattiva musica di sottofondo' : 'Attiva musica di sottofondo');
    const label = toggle.querySelector('.music-toggle-label');
    if (label) label.textContent = playing ? 'Musica on' : 'Musica';
  };

  const fadeTo = (target, duration=900) => {
    const from = Number.isFinite(audio.volume) ? audio.volume : 0;
    const started = performance.now();
    const step = now => {
      const t = Math.min(1,(now-started)/duration);
      audio.volume = Math.max(0,Math.min(1,from + (target-from)*t));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const startAudio = async ({gesture=false}={}) => {
    if (state.explicitPause && !gesture) return false;
    try {
      audio.volume = 0.01;
      const p = audio.play();
      if (p && typeof p.then === 'function') await p;
      if (Number.isFinite(state.time) && state.time > 0 && Number.isFinite(audio.duration) && state.time < audio.duration - 2) {
        try { audio.currentTime = state.time; } catch (_) {}
      }
      fadeTo(TARGET_VOLUME,1000);
      saveState({playing:true,explicitPause:false});
      syncToggle();
      return true;
    } catch (_) {
      audio.volume = TARGET_VOLUME;
      syncToggle();
      return false;
    }
  };

  const pauseAudio = () => {
    fadeTo(0,180);
    setTimeout(() => {
      audio.pause();
      audio.volume = TARGET_VOLUME;
      saveState({playing:false,explicitPause:true,time:audio.currentTime || 0});
      syncToggle();
    },210);
  };

  toggle.addEventListener('click', async () => {
    if (audio.paused) {
      saveState({explicitPause:false});
      await startAudio({gesture:true});
    } else {
      pauseAudio();
    }
  });

  audio.addEventListener('play',syncToggle);
  audio.addEventListener('pause',syncToggle);
  audio.addEventListener('error',syncToggle);
  audio.addEventListener('timeupdate',() => {
    const sec = Math.floor(audio.currentTime || 0);
    if (sec % 4 === 0) saveState({time:audio.currentTime || 0,playing:!audio.paused});
  });

  const persist = () => saveState({time:audio.currentTime || 0,playing:!audio.paused});
  window.addEventListener('pagehide',persist);
  document.addEventListener('visibilitychange',() => {
    if (document.visibilityState === 'hidden') persist();
  });

  let sameOriginReferrer = false;
  try {
    sameOriginReferrer = !!document.referrer && new URL(document.referrer).origin === location.origin;
  } catch (_) {}

  let navType = '';
  try { navType = performance.getEntriesByType('navigation')[0]?.type || ''; } catch (_) {}

  // Accesso diretto, WhatsApp/social, nuova scheda o refresh:
  // mostra sempre l'ingresso per ottenere un gesto utente valido e far partire la musica.
  const showEntry = isHome && entry && (!sameOriginReferrer || navType === 'reload');

  if (showEntry) {
    document.documentElement.classList.add('audio-entry-open');
    entryButton?.addEventListener('click', async () => {
      entryButton.disabled = true;
      const main = entryButton.querySelector('span');
      const sub = entryButton.querySelector('small');
      if (main) main.textContent = 'Apertura…';
      if (sub) sub.textContent = 'Sonus';

      saveState({explicitPause:false});
      const ok = await startAudio({gesture:true});

      if (ok) {
        entry.classList.add('is-closing');
        document.documentElement.classList.remove('audio-entry-open');
        setTimeout(() => entry.remove(),520);
      } else {
        entryButton.disabled = false;
        if (main) main.textContent = 'Riprova';
        if (sub) sub.textContent = 'Ingredere';
      }
    });
  } else {
    if (entry) entry.remove();

    if (state.playing && !state.explicitPause) {
      startAudio();
      const unlock = async () => {
        if (audio.paused && !state.explicitPause) await startAudio({gesture:true});
        if (!audio.paused) {
          document.removeEventListener('pointerdown',unlock,true);
          document.removeEventListener('touchstart',unlock,true);
          document.removeEventListener('keydown',unlock,true);
        }
      };
      document.addEventListener('pointerdown',unlock,true);
      document.addEventListener('touchstart',unlock,{capture:true,passive:true});
      document.addEventListener('keydown',unlock,true);
    }
  }

  syncToggle();
})();


/* =========================
   V5.9.7 · PWA installabile
   ========================= */
(() => {
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (isStandalone) {
    document.documentElement.classList.add('is-installed-app');
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js?v=5.9.7').catch(() => {});
    });
  }

  if (isStandalone) return;

  const installButton = document.createElement('button');
  installButton.type = 'button';
  installButton.className = 'install-app-button';
  installButton.setAttribute('aria-label', "Installa l'app San Castrese");
  installButton.innerHTML =
    '<span class="install-app-icon" aria-hidden="true">↓</span>' +
    '<span class="install-app-label">Installa l’app</span>';
  document.body.appendChild(installButton);

  let deferredPrompt = null;
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;

  const showButton = () => installButton.classList.add('is-visible');
  const hideButton = () => installButton.classList.remove('is-visible');

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    showButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideButton();
  });

  if (isIOS) {
    window.setTimeout(showButton, 900);
  }

  const openIOSHelp = () => {
    let dialog = document.getElementById('ios-install-help');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'ios-install-help';
      dialog.className = 'install-help';
      dialog.innerHTML = `
        <div class="install-help-card">
          <button class="install-help-close" type="button" aria-label="Chiudi">×</button>
          <small>San Castrese · App</small>
          <h2>Installa sulla schermata Home</h2>
          <p>Su iPhone/iPad apri il menu <strong>Condividi</strong> di Safari e scegli <strong>Aggiungi alla schermata Home</strong>.</p>
          <button class="install-help-ok" type="button">Ho capito</button>
        </div>`;
      document.body.appendChild(dialog);
      const close = () => dialog.close();
      dialog.querySelector('.install-help-close')?.addEventListener('click', close);
      dialog.querySelector('.install-help-ok')?.addEventListener('click', close);
      dialog.addEventListener('click', e => { if (e.target === dialog) close(); });
    }
    dialog.showModal();
  };

  installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try {
        const choice = await deferredPrompt.userChoice;
        if (choice?.outcome === 'accepted') hideButton();
      } catch (_) {}
      deferredPrompt = null;
    } else if (isIOS) {
      openIOSHelp();
    }
  });
})();
