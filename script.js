const apiKey = '330845779e6588abc657b964887317fb'; // Replace with your TMDb API key
const trendingApiUrl = `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}`;
const searchApiUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=en-US&query=`;
const speechBubble = document.getElementById('speech-bubble');
const trailerContainer = document.getElementById('trailer-container');
const bubbleContent = document.getElementById('bubble-content');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

async function fetchMovies(apiUrl) {
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const movies = data.results;
        displayMovies(movies);
    } catch (error) {
        console.error('Error fetching movies:', error);
    }
}

function displayMovies(movies) {
    const movieList = document.getElementById('movie-list');
    movieList.innerHTML = movies.map(movie => `
        <div class="movie-item" 
             data-id="${movie.id}"
             data-title="${movie.title}"
             data-overview="${movie.overview}"
             data-poster="https://image.tmdb.org/t/p/w200${movie.poster_path}">
            <img src="https://image.tmdb.org/t/p/w200${movie.poster_path}" alt="${movie.title}">
            <h3>${movie.title}</h3>
            <p>${movie.overview.substring(0, 100)}...</p>
        </div>
    `).join('');

    document.querySelectorAll('.movie-item').forEach(item => {
        item.addEventListener('mousedown', (event) => showSpeechBubble(event, item));
        item.addEventListener('touchstart', (event) => showSpeechBubble(event, item));
    });

    document.addEventListener('mousedown', (event) => {
        if (!speechBubble.contains(event.target) && !event.target.closest('.movie-item')) {
            hideSpeechBubble();
        }
    });
}

async function showSpeechBubble(event, element) {
    event.preventDefault();

    const movieId = element.getAttribute('data-id');
    const movieTitle = element.getAttribute('data-title');
    const movieOverview = element.getAttribute('data-overview');
    const posterUrl = element.getAttribute('data-poster');

    const trailerKey = await fetchTrailerKey(movieId);
    const trailerUrl = trailerKey ? `https://www.youtube.com/embed/${trailerKey}` : '';

    // Update speech bubble content
    trailerContainer.innerHTML = trailerUrl ? `<iframe src="${trailerUrl}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` : '';
    bubbleContent.innerHTML = `
        <h3>${movieTitle}</h3>
        <p>${movieOverview}</p>
    `;

    // Position the speech bubble
    const rect = element.getBoundingClientRect();
    const bubbleWidth = speechBubble.offsetWidth;
    const bubbleHeight = speechBubble.offsetHeight;

    speechBubble.style.left = `${rect.right + 10}px`;
    speechBubble.style.top = `${rect.top + window.scrollY - (bubbleHeight / 2 - rect.height / 2)}px`;
    speechBubble.classList.remove('hidden');
    speechBubble.classList.add('visible');
}

function hideSpeechBubble() {
    speechBubble.classList.add('hidden');
    speechBubble.classList.remove('visible');
}

async function fetchTrailerKey(movieId) {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${apiKey}&language=en-US`);
    const data = await response.json();
    const trailer = data.results.find(video => video.type === 'Trailer');
    return trailer ? trailer.key : null;
}

document.addEventListener('DOMContentLoaded', () => {
    fetchMovies(trendingApiUrl); // Fetch trending movies on page load
});

searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        fetchMovies(`${searchApiUrl}${encodeURIComponent(query)}`);
    }
});
