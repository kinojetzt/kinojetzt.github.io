// script.js

const apiKey = '330845779e6588abc657b964887317fb';
const movieContainer = document.getElementById('movies');

async function fetchMovies() {
    const response = await fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=en-US&page=1`);
    const data = await response.json();
    displayMovies(data.results);
}

function displayMovies(movies) {
    movieContainer.innerHTML = '';

    movies.forEach(movie => {
        const movieElement = document.createElement('div');
        movieElement.classList.add('movie');
        
        movieElement.innerHTML = `
            <img src="https://image.tmdb.org/t/p/w500/${movie.poster_path}" alt="${movie.title}">
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <p>Rating: ${movie.vote_average}</p>
                <p>${movie.release_date}</p>
            </div>
        `;

        movieContainer.appendChild(movieElement);
    });
}

// Initialize the movie fetch on page load
fetchMovies();
