// No API key in the browser — all data is pre-fetched by GitHub Actions.
const speechBubble = document.getElementById('speech-bubble');
const trailerContainer = document.getElementById('trailer-container');
const bubbleContent = document.getElementById('bubble-content');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const bubbleClose = document.getElementById('bubble-close');

let trailersMap = {};   // { [movieId]: "YouTubeKey" }
let trending = [];      // trending list for default view
let allMovies = [];     // union of trending + popular + top_rated

async function loadData() {
  const [trendingRes, allRes, trailersRes] = await Promise.all([
    fetch('./data/trending.json'),
    fetch('./data/all_movies.json'),
    fetch('./data/trailers.json')
  ]);

  const trendingJson = await trendingRes.json();
  const allJson = await allRes.json();
  const trailersJson = await trailersRes.json();

  trending = trendingJson.results || [];
  allMovies = allJson.results || [];
  trailersMap = (trailersJson && trailersJson.trailers) || {};

  displayMovies(trending);
}

function displayMovies(movies) {
  const movieList = document.getElementById('movie-list');
  movieList.innerHTML = (movies || []).map(movie => {
    const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : '';
    const overview = (movie.overview || '').trim();
    const safeOverview = overview.length > 100 ? overview.slice(0, 100) + '…' : overview;
    return `
      <div class="movie-item"
           data-id="${movie.id}"
           data-title="${escapeHtml(movie.title || movie.name || 'Untitled')}"
           data-overview="${escapeHtml(overview)}"
           data-poster="${poster}">
        ${poster ? `<img src="${poster}" alt="${escapeHtml(movie.title || movie.name || 'Poster')}">` : ''}
        <h3>${escapeHtml(movie.title || movie.name || 'Untitled')}</h3>
        <p>${escapeHtml(safeOverview)}</p>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.movie-item').forEach(item => {
    // Use pointerdown for both mouse & touch responsiveness
    item.addEventListener('pointerdown', (event) => showSpeechBubble(event, item));
  });

  // Close bubble when clicking outside
  document.addEventListener('pointerdown', (event) => {
    if (!speechBubble.contains(event.target) && !event.target.closest('.movie-item')) {
      hideSpeechBubble();
    }
  }, { capture: true });

  bubbleClose.addEventListener('click', hideSpeechBubble);
}

async function showSpeechBubble(event, element) {
  event.preventDefault();

  const movieId = element.getAttribute('data-id');
  const movieTitle = element.getAttribute('data-title');
  const movieOverview = element.getAttribute('data-overview');
  const posterUrl = element.getAttribute('data-poster');

  // Use pre-fetched trailer key map
  const trailerKey = trailersMap[movieId];
  const trailerUrl = trailerKey ? `https://www.youtube.com/embed/${trailerKey}` : '';

  trailerContainer.innerHTML = trailerUrl
    ? `<iframe src="${trailerUrl}" frameborder="0"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>`
    : '';

  bubbleContent.innerHTML = `
    <h3>${movieTitle}</h3>
    ${posterUrl ? `<img src="${posterUrl}" alt="${movieTitle}" style="width:120px;border-radius:8px;margin:.25rem .5rem .5rem 0;float:left">` : ''}
    <p>${movieOverview || 'No overview available.'}</p>
    <div style="clear:both"></div>
  `;

  // Position the bubble near the card
  const rect = element.getBoundingClientRect();
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  const bubbleWidth = speechBubble.offsetWidth || 520;
  const bubbleHeight = speechBubble.offsetHeight || 400;

  let left = rect.right + 10;
  let top = rect.top + scrollY - (bubbleHeight / 2 - rect.height / 2);

  // keep in viewport horizontally
  if (left + bubbleWidth > window.innerWidth - 12) {
    left = Math.max(12, rect.left - bubbleWidth - 10);
  }
  // and vertically
  top = Math.max(12, Math.min(top, scrollY + window.innerHeight - bubbleHeight - 12));

  speechBubble.style.left = `${left}px`;
  speechBubble.style.top = `${top}px`;
  speechBubble.classList.remove('hidden');
  speechBubble.classList.add('visible');
}

function hideSpeechBubble() {
  speechBubble.classList.add('hidden');
  speechBubble.classList.remove('visible');
}

function localSearch(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return trending; // empty query → show trending again

  return allMovies.filter(m => {
    const title = (m.title || m.name || '').toLowerCase();
    const overview = (m.overview || '').toLowerCase();
    return title.includes(q) || overview.includes(q);
  });
}

document.addEventListener('DOMContentLoaded', loadData);

searchButton.addEventListener('click', () => {
  const query = searchInput.value;
  const results = localSearch(query);
  displayMovies(results);
});

// Enable Enter key on the input
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const results = localSearch(searchInput.value);
    displayMovies(results);
  }
});

function escapeHtml(s) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
