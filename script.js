const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');

function syncHeader(){ header.classList.toggle('scrolled', window.scrollY > 28); }
syncHeader();
window.addEventListener('scroll', syncHeader, { passive:true });

menuToggle?.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!open));
  mainNav.classList.toggle('open', !open);
  document.body.style.overflow = !open ? 'hidden' : '';
});
mainNav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  menuToggle?.setAttribute('aria-expanded','false');
  mainNav.classList.remove('open');
  document.body.style.overflow = '';
}));

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
document.querySelector('#year').textContent = new Date().getFullYear();
