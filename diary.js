// ⚠️ Optional TMDB search for posters uses your exposed key. Paste below.
// If you don't want TMDB here, leave it empty string "" and the poster finder will be disabled.
const apiKey = '330845779e6588abc657b964887317fb';

const LS_KEY = 'movieDiary_v1';

const form = document.getElementById('entry-form');
const titleEl = document.getElementById('title');
const dateEl = document.getElementById('date');
const ratingEl = document.getElementById('rating');
const ratingOut = document.getElementById('rating-out');
const notesEl = document.getElementById('notes');
const posterUrlEl = document.getElementById('poster-url');
const watchTypeEl = document.getElementById('watch-type');

const qEl = document.getElementById('q');
const filterTypeEl = document.getElementById('filter-type');
const sortEl = document.getElementById('sort');

const exportBtn = document.getElementById('export-btn');
const importFile = document.getElementById('import-file');
const clearFormBtn = document.getElementById('clear-form-btn');

const list = document.getElementById('diary-list');
const pickerTpl = document.getElementById('poster-picker-template');

let editingId = null; // when editing an existing entry

/* ====== Helpers ====== */
function todayISO(){
  const d = new Date();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${d.getFullYear()}-${m}-${day}`;
}
function uid(){ return Math.random().toString(36).slice(2,9); }
function load(){
  try{ return JSON.parse(localStorage.getItem(LS_KEY)||'[]'); }
  catch{ return []; }
}
function save(entries){ localStorage.setItem(LS_KEY, JSON.stringify(entries)); }
function escapeHtml(s){
  return (s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

/* ====== Rendering ====== */
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
    case 'date-asc': filtered.sort((a,b)=> a.date.localeCompare(b.date)); break;
    case 'rating-desc': filtered.sort((a,b)=> (b.rating ?? -1) - (a.rating ?? -1)); break;
    case 'rating-asc': filtered.sort((a,b)=> (a.rating ?? -1) - (b.rating ?? -1)); break;
    case 'title-asc': filtered.sort((a,b)=> a.title.localeCompare(b.title)); break;
    case 'title-desc': filtered.sort((a,b)=> b.title.localeCompare(a.title)); break;
  }

  list.innerHTML = filtered.map(e => entryCardHTML(e)).join('');

  list.querySelectorAll('[data-action="edit"]').forEach(btn=>{
    btn.addEventListener('click', ()=> startEdit(btn.dataset.id));
  });
  list.querySelectorAll('[data-action="delete"]').forEach(btn=>{
    btn.addEventListener('click', ()=> removeEntry(btn.dataset.id));
  });
}

function entryCardHTML(e){
  const poster = e.posterUrl ? `<img class="poster" src="${escapeHtml(e.posterUrl)}" alt="${escapeHtml(e.title)}">` : `<div class="poster" style="display:grid;place-items:center;color:var(--muted)">No image</div>`;
  const typePill = e.watchType==='first' ? `<span class="pill">First watch</span>` : `<span class="pill">Rewatch</span>`;
  const ratingPill = typeof e.rating === 'number' ? `<span class="pill">Rating ${e.rating.toFixed(1)}/10</span>` : '';
  const datePill = e.date ? `<span class="pill">${e.date}</span>` : '';
  return `
    <article class="entry glass card" data-id="${e.id}">
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

/* ====== CRUD ====== */
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

/* ====== Form handling ====== */
function resetForm(){
  form.reset();
  dateEl.value = todayISO();
  ratingEl.value = 7; ratingOut.textContent = '7';
  watchTypeEl.value = 'first';
  editingId = null;
}
function startEdit(id){
  const entries = load();
  const e = entries.find(x=>x.id===id);
  if (!e) return;
  titleEl.value = e.title;
  dateEl.value = e.date;
  ratingEl.value = e.rating ?? 7; ratingOut.textContent = (e.rating ?? 7);
  notesEl.value = e.notes || '';
  posterUrlEl.value = e.posterUrl || '';
  watchTypeEl.value = e.watchType || 'first';
  editingId = id;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
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
  if (!data.title){ titleEl.focus(); return; }
  if (editingId){ updateEntry(editingId, data); }
  else { addEntry(data); }
  resetForm();
});
clearFormBtn.addEventListener('click', resetForm);
ratingEl.addEventListener('input', ()=> ratingOut.textContent = ratingEl.value);

/* ====== Filters & Import/Export ====== */
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
  if (!file) return;
  try{
    const text = await file.text();
    const json = JSON.parse(text);
    if (!Array.isArray(json)) throw new Error('Invalid diary file');
    save(json);
    render();
  }catch(err){
    alert('Import failed: ' + err.message);
  }finally{
    importFile.value = '';
  }
});

/* ====== Poster Finder (TMDB) ====== */
const findPosterBtn = document.getElementById('find-poster-btn');
findPosterBtn.addEventListener('click', async ()=>{
  const q = titleEl.value.trim();
  if (!apiKey){
    alert('TMDB key is not set in diary.js, poster finder disabled.');
    return;
  }
  if (!q){ titleEl.focus(); return; }

  const lang = 'en-US';
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=${encodeURIComponent(lang)}&query=${encodeURIComponent(q)}&page=1&include_adult=false`;
  try{
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const results = data.results || [];
    showPosterPicker(results);
  }catch(err){
    console.error(err);
    alert('Poster search failed');
  }
});

function showPosterPicker(results){
  const tpl = pickerTpl.content.cloneNode(true);
  const dlg = tpl.querySelector('dialog');
  const grid = tpl.querySelector('#picker-grid');

  grid.innerHTML = results.length ? results.map(r=>{
    const poster = r.poster_path ? `https://image.tmdb.org/t/p/w300${r.poster_path}` : '';
    const title = r.title || r.name || 'Untitled';
    const year = (r.release_date || '').slice(0,4);
    return `
      <div class="picker-card" data-poster="${poster}">
        ${poster ? `<img src="${poster}" alt="${escapeHtml(title)}">` : `<div style="height:180px;display:grid;place-items:center;color:var(--muted)">No image</div>`}
        <div style="font-size:.85rem">${escapeHtml(title)} ${year ? `(${year})` : ''}</div>
      </div>
    `;
  }).join('') : `<div class="muted" style="padding:.5rem">No results.</div>`;

  document.body.appendChild(dlg);
  dlg.showModal();

  grid.querySelectorAll('.picker-card').forEach(card=>{
    card.addEventListener('click', ()=>{
      const url = card.getAttribute('data-poster') || '';
      posterUrlEl.value = url;
      dlg.close();
      dlg.remove();
    });
  });

  dlg.addEventListener('close', ()=> dlg.remove());
}

/* ====== Init ====== */
document.addEventListener('DOMContentLoaded', ()=>{
  dateEl.value = todayISO();
  render();
});
