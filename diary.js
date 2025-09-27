// TMDB key (exposed as requested)
const apiKey = '330845779e6588abc657b964887317fb';

const speechBubble     = document.getElementById('speech-bubble');
const trailerContainer = document.getElementById('trailer-container');
const bubbleContent    = document.getElementById('bubble-content');
const bubbleClose      = document.getElementById('bubble-close');
const grid             = document.getElementById('movie-grid');

function nowPlayingUrl(page=1){
  return `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=en-US&region=CH&page=${page}`;
}
const isMobile = () => window.matchMedia('(max-width: 720px)').matches;

async function fetchAllPages(pages=3){
  const promises = Array.from({length:pages},(_,i)=> fetch(nowPlayingUrl(i+1)).then(r=>r.json()));
  const results = await Promise.all(promises);
  // Dedup by id
  const map = new Map();
  results.forEach(x => (x.results||[]).forEach(m => map.set(m.id, m)));
  return Array.from(map.values());
}

function renderMovies(movies){
  grid.innerHTML = movies.map(m=>{
    const title=m.title||m.name||'Untitled';
    const poster=m.poster_path?`https://image.tmdb.org/t/p/w342${m.poster_path}`:'';
    const overview=(m.overview||'').trim();
    const short=overview.length>80?overview.slice(0,80)+'…':overview;
    const date=m.release_date||'';
    return `
      <article class="movie glass"
               data-id="${m.id}"
               data-title="${escapeHtml(title)}"
               data-overview="${escapeHtml(overview)}"
               data-poster="${poster}">
        ${poster?`<img class="poster" src="${poster}" alt="${escapeHtml(title)}">`:''}
        <div class="meta">
          <div class="badges">
            ${date?`<span class="badge">${escapeHtml(date)}</span>`:''}
            ${typeof m.vote_average==='number'?`<span class="badge">${m.vote_average.toFixed(1)}/10</span>`:''}
          </div>
          <h3 class="title">${escapeHtml(title)}</h3>
          <p class="desc">${escapeHtml(short)}</p>
        </div>
      </article>
    `;
  }).join('');

  grid.querySelectorAll('.movie').forEach(card=>{
    card.addEventListener('pointerdown',e=>showSpeechBubble(e,card));
  });

  // Close when clicking outside
  document.addEventListener('pointerdown',e=>{
    if(!speechBubble.contains(e.target) && !e.target.closest('.movie')) hideBubble();
  },{capture:true});
  bubbleClose.addEventListener('click',hideBubble);
}

async function showSpeechBubble(event,el){
  event.preventDefault();
  const id=el.getAttribute('data-id');
  const title=el.getAttribute('data-title');
  const overview=el.getAttribute('data-overview');
  const posterUrl=el.getAttribute('data-poster');

  const trailerKey=await fetchTrailerKey(id);
  const trailerUrl=trailerKey?`https://www.youtube.com/embed/${trailerKey}`:'';

  trailerContainer.innerHTML=trailerUrl
    ? `<iframe src="${trailerUrl}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
    : '';

  bubbleContent.innerHTML=`
    <h3 style="margin:.25rem 0 .5rem">${title}</h3>
    ${posterUrl?`<img src="${posterUrl}" alt="${title}" style="width:120px;border-radius:10px;margin:.25rem .5rem .5rem 0;float:left;border:1px solid var(--border)">`:''}
    <p class="muted" style="margin:0 0 .25rem">${overview||'No overview available.'}</p>
    <div style="clear:both"></div>
  `;

  if (isMobile()) {
    // Modal on mobile
    speechBubble.classList.add('mobile');
    document.body.classList.add('no-scroll');
    speechBubble.style.left = '';
    speechBubble.style.top  = '';
  } else {
    // Side tooltip on desktop
    const rect=el.getBoundingClientRect();
    const scrollY=window.scrollY||document.documentElement.scrollTop;
    const bubbleWidth=speechBubble.offsetWidth||560;
    const bubbleHeight=speechBubble.offsetHeight||360;

    let left=rect.right+10;
    let top=rect.top+scrollY-(bubbleHeight/2 - rect.height/2);
    if(left+bubbleWidth>window.innerWidth-12) left=Math.max(12,rect.left-bubbleWidth-10);
    top=Math.max(12, Math.min(top, scrollY + window.innerHeight - bubbleHeight - 12));

    speechBubble.classList.remove('mobile');
    speechBubble.style.left=`${left}px`;
    speechBubble.style.top =`${top}px`;
  }

  speechBubble.classList.remove('hidden');
  speechBubble.classList.add('visible');
}

function hideBubble(){
  trailerContainer.innerHTML=''; // stop video
  speechBubble.classList.add('hidden');
  speechBubble.classList.remove('visible');
  speechBubble.classList.remove('mobile');
  document.body.classList.remove('no-scroll');
}

async function fetchTrailerKey(movieId){
  try{
    const url=`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${apiKey}&language=en-US`;
    const res=await fetch(url);
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data=await res.json();
    const trailer=(data.results||[]).find(v=>v.type==='Trailer' && v.site==='YouTube');
    return trailer?trailer.key:null;
  }catch(e){
    console.error('Trailer fetch failed:',e);
    return null;
  }
}

function escapeHtml(s){
  return (s||"")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

async function init(){
  const movies=await fetchAllPages(3);
  renderMovies(movies);
}
document.addEventListener('DOMContentLoaded',init);
