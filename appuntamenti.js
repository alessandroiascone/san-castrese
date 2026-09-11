// Agenda: date locali italiane, prossimi in ordine crescente e cronologia decrescente.
(() => {
  const root = document.getElementById('appuntamenti');
  if (!root) return;
  const upcoming = root.querySelector('#agenda-upcoming');
  const past = root.querySelector('#agenda-past');
  function updateAgenda(){
    const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const value = type => parts.find(p => p.type === type).value;
    const today = `${value('year')}-${value('month')}-${value('day')}`;
    const cards = [...root.querySelectorAll('[data-event-date]')];
    const future = cards.filter(c => c.dataset.eventDate >= today).sort((a,b)=>a.dataset.eventDate.localeCompare(b.dataset.eventDate));
    const history = cards.filter(c => c.dataset.eventDate < today).sort((a,b)=>b.dataset.eventDate.localeCompare(a.dataset.eventDate));
    future.forEach(c => {upcoming.querySelector('.agenda-list').appendChild(c);c.querySelector('.agenda-status').textContent=c.dataset.eventDate===today?'Oggi':'In programma';});
    history.forEach(c => {past.querySelector('.agenda-list').appendChild(c);c.querySelector('.agenda-status').textContent='In cronologia';});
    upcoming.hidden = !future.length;past.hidden = !history.length;
  }
  updateAgenda();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateAgenda();});
  setInterval(updateAgenda,60000);
  const dialog=document.createElement('dialog');dialog.className='agenda-dialog';dialog.setAttribute('aria-label','Locandina dell’appuntamento');
  dialog.innerHTML='<button type="button" aria-label="Chiudi locandina">×</button><img alt="">';document.body.appendChild(dialog);
  const close=()=>dialog.close();dialog.querySelector('button').addEventListener('click',close);
  dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
  root.querySelectorAll('[data-agenda-poster]').forEach(link=>link.addEventListener('click',e=>{
    if(typeof dialog.showModal!=='function'||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
    e.preventDefault();const img=dialog.querySelector('img');img.src=link.href;img.alt=link.closest('article').querySelector('.agenda-poster img').alt;dialog.showModal();
  }));
})();
