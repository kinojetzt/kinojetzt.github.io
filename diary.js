// TMDB key (exposed in frontend for search suggestions, per your request)
const apiKey = '330845779e6588abc657b964887317fb';

const LS_KEY = 'movieDiary_v1';

// ------- Form & UI -------
const form = document.getElementById('entry-form');
const showFormBtn = document.getElementById('show-form-btn');
const formSection = document.querySelector('.form-card');
const clearFormBtn = document.getElementById('clear-form-btn');

const titleEl = document.getElementById('title');
const suggestions = document.getElementById('search-suggestions');
const dateEl = document.getElementById('date');
const ratingEl = document.getElementById('rating');
const ratingOut = document.getElementById('rating-out');
const watchTypeEl = document.getElementById('watch-type');
const notesEl = document.getElementById('notes');
const posterUrlEl = document.getElementById('poster-url');

const qEl = document.getElementById('q');
const filterTypeEl = document.getElementById('filter-type');
const sortEl = document.getElementById('sort');

const exportBtn = document.getElementById('export-btn');
const importFile = document.getElementById('import-file');

const list = document.getElementById('diary-list');

let editingId = null;

// ------- Helpers -------
function todayISO(){
  const d = new Date();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${d.getFullYear()}-${m}-${day}`;
}
function uid(){ return Math.random().toString(36).slice(2,9); }
function load(){
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
}
function save(entries){
  localStorage.setItem(LS_KEY, JSON.stringify(entries));
}
function escapeHtml(s){
  return (s||"")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

// ------- Render list -------
function render(){
  const entries = load();
  const query = (qEl.value||'').toLowerCase().trim();
  const typeFilter = filterTypeEl.value;

  let filtered = entries.filter(e => {
    const matchesText = !query || e.title.toLowerCase().includes(query) || (e.notes||'').toLowerCase().includes(query);
    const matchesType = typeFilter === 'all' ? true : e.watchType === typeFilter;
    return matchesText && matchesType;
  });

  switch (sortEl.value){
    case 'date-desc': filtered.sort((a,b)=> b.date.localeCompare(a.date)); break;
    case 'date-asc':  filtered.sort((a,b)=> a.date.localeCompare(b.date)); break;
    case 'rating-desc': filtered.sort((a,b)=> (b.rating ?? -1) - (a.rating ?? -1)); break;
    case 'rating-asc':  filtered.sort((a,b)=> (a.rating ?? -1) - (b.rating ?? -1)); break;
    case 'title-asc': filtered.sort((a,b)=> a.title.localeCompare(b.title)); break;
    case 'title-desc': filtered.sort((a,b)=> b.title.localeCompare(a.title)); break;
    default: filtered.sort((a,b)=> b.date.localeCompare(a.date));
  }

  list.innerHTML = filtered.map((e,i)=> entryCardHTML(e,i)).join('');

  list.querySelectorAll('[data-action="edit"]').forEach(btn=>{
    btn.addEventListener('click', ()=> startEdit(btn.dataset.id));
  });
  list.querySelectorAll('[data-action="delete"]').forEach(btn=>{
    btn.addEventListener('click', ()=> removeEntry(btn.dataset.id));
  });
}

function entryCardHTML(e,i){
  const poster = e.posterUrl
    ? `<img class="poster" src="${escapeHtml(e.posterUrl)}" alt="${escapeHtml(e.title)}">`
    : `<div class="poster" style="display:grid;place-items:center;color:var(--muted)">No image</div>`;
  const typePill = e.watchType==='first' ? `<span class="pill">First watch</span>` : `<span class="pill">Rewatch</span>`;
  const ratingPill = typeof e.rating === 'number' ? `<span class="pill">${e.rating.toFixed(1)}/10</span>` : '';
  const datePill = e.date ? `<span class="pill">${e.date}</span>` : '';

  return `
    <article class="entry glass card" data-id="${e.id}">
      <div class="entry-number">${i+1}</div>
      ${poster}
      <div>
        <h3 class="title">${escapeHtml(e.title)}</h3>
        <div class="tags">${typePill}${ratingPill}${datePill}</div>
        ${e.notes ? `<p class="notes">${escapeHtml(e.notes)}</p>` : ''}
      </div>
      <div class="actions">
        <button class="btn" data-action="edit" data-id="${e.id}">Edit</button>
        <button class="btn" data-action="delete" data-id="${e.id}">Delete</button>
      </div>
    </article>
  `;
}

// ------- CRUD -------
function addEntry(entry){
  const entries = load();
  entries.push(entry);
  save(entries);
  render();
}
function updateEntry(id, patch){
  const entries = load();
  const idx = entries.findIndex(e=>e.id===id);
  if (idx>=0){
    entries[idx] = {...entries[idx], ...patch};
    save(entries);
    render();
  }
}
function removeEntry(id){
  const entries = load().filter(e => e.id !== id);
  save(entries);
  render();
}

// ------- Form handling -------
function resetForm(){
  form.reset();
  dateEl.value = todayISO();
  ratingEl.value = 7; ratingOut.textContent = '7';
  watchTypeEl.value = 'first';
  editingId = null;
}
function startEdit(id){
  const e = load().find(x=>x.id===id);
  if(!e) return;
  if(formSection.classList.contains('hidden')) formSection.classList.remove('hidden');
  titleEl.value = e.title;
  dateEl.value = e.date;
  ratingEl.value = e.rating ?? 7; ratingOut.textContent = String(e.rating ?? 7);
  watchTypeEl.value = e.watchType || 'first';
  notesEl.value = e.notes || '';
  posterUrlEl.value = e.posterUrl || '';
  editingId = id;
  window.scrollTo({top:0, behavior:'smooth'});
}

showFormBtn.addEventListener('click', ()=> formSection.classList.toggle('hidden'));
clearFormBtn.addEventListener('click', ()=> { formSection.classList.add('hidden'); resetForm(); });

form.addEventListener('submit', (ev)=>{
  ev.preventDefault();
  const data = {
    id: editingId || uid(),
    title: titleEl.value.trim(),
    date: dateEl.value || todayISO(),
    rating: Number(ratingEl.value),
    watchType: watchTypeEl.value,
    notes: notesEl.value.trim(),
    posterUrl: posterUrlEl.value.trim() || ''
  };
  if(!data.title){ titleEl.focus(); return; }
  if(editingId) updateEntry(editingId, data);
  else addEntry(data);
  resetForm();
  formSection.classList.add('hidden');
});
ratingEl.addEventListener('input', ()=> ratingOut.textContent = ratingEl.value);

// ------- Filters & Import/Export -------
[qEl, filterTypeEl, sortEl].forEach(el => el.addEventListener('input', render));

exportBtn.addEventListener('click', ()=>{
  const blob = new Blob([localStorage.getItem(LS_KEY) || '[]'], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'movie-diary.json'; a.click();
  URL.revokeObjectURL(url);
});
importFile.addEventListener('change', async ()=>{
  const file = importFile.files?.[0];
  if(!file) return;
  try{
    const text = await file.text();
    const json = JSON.parse(text);
    if(!Array.isArray(json)) throw new Error('Invalid diary file');
    save(json); render();
  }catch(err){
    alert('Import failed: ' + err.message);
  }finally{
    importFile.value='';
  }
});

// ------- TMDB Search Suggestions -------
let suggestAbort = null;

titleEl.addEventListener('input', async ()=>{
  const q = titleEl.value.trim();
  if (suggestAbort) suggestAbort.abort();
  suggestions.innerHTML = '';
  if (q.length < 2 || !apiKey) return;

  const ctrl = new AbortController();
  suggestAbort = ctrl;
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=en-US&query=${encodeURIComponent(q)}&page=1&include_adult=false`;
  try{
    const res = await fetch(url, {signal: ctrl.signal});
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data = await res.json();
    const results = (data.results||[]).slice(0,8);
    if(!results.length) return;
    suggestions.innerHTML = results.map(r=>{
      const poster = r.poster_path ? `https://image.tmdb.org/t/p/w92${r.poster_path}` : '';
      const year = (r.release_date||'').slice(0,4);
      const title = r.title || r.name || 'Untitled';
      return `<li data-title="${escapeHtml(title)}" data-poster="${poster}">
        ${poster?`<img src="${poster}" alt="">`:''}
        <span>${escapeHtml(title)} ${year?`(${year})`:''}</span>
      </li>`;
    }).join('');
  }catch(_e){ /* ignore abort or network errors */ }
});

suggestions.addEventListener('click', e=>{
  const li = e.target.closest('li'); if(!li) return;
  titleEl.value = li.dataset.title || '';
  posterUrlEl.value = li.dataset.poster || '';
  suggestions.innerHTML = '';
});

// Hide suggestions when clicking elsewhere
document.addEventListener('pointerdown', e=>{
  if(!e.target.closest('#search-suggestions') && e.target !== titleEl){
    suggestions.innerHTML = '';
  }
},{capture:true});

// ------- Init -------
document.addEventListener('DOMContentLoaded', ()=>{
  dateEl.value = todayISO();
  render();
});
