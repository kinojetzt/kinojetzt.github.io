const apiToken = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzMzA4NDU3NzllNjU4OGFiYzY1N2I5NjQ4ODczMTdmYiIsIm5iZiI6MTcyMzU4MTY5Ny43MTgyMjksInN1YiI6IjY2YmJiZTU3OWVhOWNlZjdhZDBlNjZlMSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.TdUsr1_GkTbv8BeIDJ0cT7DT850v2miUCLgurFSYha4';
const movieContainer = document.getElementById('movies');

async function fetchMovies() {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/movie/now_playing?language=en-US&page=1`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json;charset=utf-8'
            }
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }

        const data = await response.json();
        if (data.results) {
            displayMovies(data.results);
        } else {
            throw new Error('No movies found or another error occurred.');
        }
    } catch (error) {
        console.error('Fetch error: ', error);
        alert('Failed to fetch movies: ' + error.message);
    }
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

fetchMovies();
