const movies = [
    { title: "Inception", year: 2010, genre: "Sci-Fi", rating: 8.8, emoji: "🌀" },
    { title: "The Godfather", year: 1972, genre: "Crime", rating: 9.2, emoji: "🌹" },
    { title: "Interstellar", year: 2014, genre: "Sci-Fi", rating: 8.6, emoji: "🪐" },
    { title: "Parasite", year: 2019, genre: "Thriller", rating: 8.5, emoji: "🏠" },
    { title: "The Dark Knight", year: 2008, genre: "Action", rating: 9.0, emoji: "🦇" },
    { title: "Pulp Fiction", year: 1994, genre: "Crime", rating: 8.9, emoji: "💼" },
    { title: "Spirited Away", year: 2001, genre: "Animation", rating: 8.6, emoji: "🐉" },
    { title: "The Matrix", year: 1999, genre: "Sci-Fi", rating: 8.7, emoji: "💊" },
    { title: "Goodfellas", year: 1990, genre: "Crime", rating: 8.7, emoji: "🔫" },
    { title: "Whiplash", year: 2014, genre: "Drama", rating: 8.5, emoji: "🥁" },
    { title: "Get Out", year: 2017, genre: "Thriller", rating: 7.7, emoji: "👁️" },
    { title: "Coco", year: 2017, genre: "Animation", rating: 8.4, emoji: "💀" },
    { title: "Mad Max: Fury Road", year: 2015, genre: "Action", rating: 8.1, emoji: "🚗" },
    { title: "Her", year: 2013, genre: "Drama", rating: 8.0, emoji: "❤️" },
    { title: "La La Land", year: 2016, genre: "Romance", rating: 8.0, emoji: "🎺" },
    { title: "Everything Everywhere", year: 2022, genre: "Sci-Fi", rating: 7.8, emoji: "🥯" },
    { title: "The Shawshank Redemption", year: 1994, genre: "Drama", rating: 9.3, emoji: "🔒" },
    { title: "Oppenheimer", year: 2023, genre: "Drama", rating: 8.3, emoji: "💥" },
    { title: "Dune", year: 2021, genre: "Sci-Fi", rating: 8.0, emoji: "🏜️" },
    { title: "No Country for Old Men", year: 2007, genre: "Thriller", rating: 8.2, emoji: "🪙" },
    { title: "WALL-E", year: 2008, genre: "Animation", rating: 8.4, emoji: "🤖" },
    { title: "Oldboy", year: 2003, genre: "Thriller", rating: 8.4, emoji: "🔑" },
    { title: "Amélie", year: 2001, genre: "Romance", rating: 8.3, emoji: "🎠" },
    { title: "Blade Runner 2049", year: 2017, genre: "Sci-Fi", rating: 8.0, emoji: "🌧️" },
    { title: "The Prestige", year: 2006, genre: "Drama", rating: 8.5, emoji: "🎩" },
    { title: "Arrival", year: 2016, genre: "Sci-Fi", rating: 7.9, emoji: "🛸" },
    { title: "The Social Network", year: 2010, genre: "Drama", rating: 7.8, emoji: "💻" },
    { title: "Prisoners", year: 2013, genre: "Thriller", rating: 8.1, emoji: "🕳️" },
    { title: "The Grand Budapest Hotel", year: 2014, genre: "Comedy", rating: 8.1, emoji: "🏨" },
    { title: "The Departed", year: 2006, genre: "Crime", rating: 8.5, emoji: "🚔" },
    { title: "Drive", year: 2011, genre: "Crime", rating: 7.8, emoji: "🦂" },
    { title: "The Lion King", year: 1994, genre: "Animation", rating: 8.5, emoji: "🦁" },
    { title: "Gladiator", year: 2000, genre: "Action", rating: 8.5, emoji: "⚔️" },
    { title: "The Truman Show", year: 1998, genre: "Drama", rating: 8.2, emoji: "📺" },
    { title: "The Silence of the Lambs", year: 1991, genre: "Thriller", rating: 8.6, emoji: "🦋" },
    { title: "Forrest Gump", year: 1994, genre: "Drama", rating: 8.8, emoji: "🏃" },
    { title: "Alien", year: 1979, genre: "Sci-Fi", rating: 8.5, emoji: "👾" },
    { title: "Back to the Future", year: 1985, genre: "Sci-Fi", rating: 8.5, emoji: "⏱️" },
    { title: "The Thing", year: 1982, genre: "Thriller", rating: 8.2, emoji: "🧊" },
    { title: "Top Gun: Maverick", year: 2022, genre: "Action", rating: 8.2, emoji: "✈️" },
    { title: "Spider-Man: Into the Spider-Verse", year: 2018, genre: "Animation", rating: 8.4, emoji: "🕸️" },
    { title: "Past Lives", year: 2023, genre: "Romance", rating: 7.8, emoji: "📝" },
    { title: "The Batman", year: 2022, genre: "Action", rating: 7.8, emoji: "🕵️" },
    { title: "Knives Out", year: 2019, genre: "Comedy", rating: 7.9, emoji: "🔍" },
];

const palettes = ['p-0', 'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-7'];

const elements = {
    search: document.getElementById('search'),
    genreFilter: document.getElementById('genre-filter'),
    sortBy: document.getElementById('sort-by'),
    decadeFilter: document.getElementById('decade-filter'),
    statCount: document.getElementById('stat-count'),
    statAvg: document.getElementById('stat-avg'),
    statGenre: document.getElementById('stat-genre'),
    statYear: document.getElementById('stat-year'),
    headerStats: document.getElementById('header-stats'),
    grid: document.getElementById('grid'),
};

function debounce(fn, wait = 150) {
    let timeoutId;

    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), wait);
    };
}

// Populate genre dropdown from unique genres in the dataset.
const genres = [...new Set(movies.map(m => m.genre))].sort();
genres.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g;
    opt.textContent = g;
    elements.genreFilter.appendChild(opt);
});

function compareMovies(a, b, sortBy) {
    if (sortBy === 'year-desc') return b.year - a.year;
    if (sortBy === 'year-asc') return a.year - b.year;
    if (sortBy === 'rating-desc') return b.rating - a.rating;
    if (sortBy === 'rating-asc') return a.rating - b.rating;
    return a.title.localeCompare(b.title);
}

function getTopGenre(result) {
    if (!result.length) return '—';

    const genreCount = result.reduce((acc, movie) => {
        acc[movie.genre] = (acc[movie.genre] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0][0];
}

function updateStats(result) {
    const avgRating = result.length
        ? (result.reduce((sum, movie) => sum + movie.rating, 0) / result.length).toFixed(1)
        : '—';

    const avgYear = result.length
        ? Math.round(result.reduce((sum, movie) => sum + movie.year, 0) / result.length)
        : '—';

    if (elements.statCount) elements.statCount.textContent = result.length;
    if (elements.statAvg) elements.statAvg.textContent = avgRating === '—' ? '—' : '★ ' + avgRating;
    if (elements.statGenre) elements.statGenre.textContent = getTopGenre(result);
    if (elements.statYear) elements.statYear.textContent = avgYear;

    if (elements.headerStats) {
        elements.headerStats.innerHTML = `<strong>${result.length}</strong> of ${movies.length} films`;
    }
}

function createMovieCard(movie, index) {
    const palette = palettes[movies.indexOf(movie) % palettes.length];
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.style.animationDelay = `${index * 30}ms`;
    card.innerHTML = `
    <div class="poster ${palette}">
        <div class="poster-inner">${movie.emoji}</div>
        <div class="poster-overlay"></div>
        <div class="rating-badge">★ ${movie.rating}</div>
    </div>
    <div class="card-body">
        <div class="card-title">${movie.title}</div>
        <div class="card-meta">${movie.year}</div>
        <span class="genre-tag">${movie.genre}</span>
    </div>
    `;
    return card;
}

function renderResults(result) {
    elements.grid.innerHTML = '';

    if (result.length === 0) {
        elements.grid.innerHTML = '<div class="no-results"><p>🎬</p><div>No movies found</div></div>';
        return;
    }

    result.forEach((movie, index) => {
        elements.grid.appendChild(createMovieCard(movie, index));
    });
}

function render() {
    const query = elements.search.value.toLowerCase();
    const genre = elements.genreFilter.value;
    const sortBy = elements.sortBy.value;
    const decade = elements.decadeFilter.value;

    // Filter by query + genre + decade.
    let result = movies.filter(m => {
        const matchSearch = m.title.toLowerCase().includes(query);
        const matchGenre = genre === 'all' || m.genre === genre;
        const matchDecade = decade === 'all' || (m.year >= +decade && m.year < +decade + 10);
        return matchSearch && matchGenre && matchDecade;
    });

    result = result.sort((a, b) => compareMovies(a, b, sortBy));

    updateStats(result);
    renderResults(result);
}

elements.search.addEventListener('input', debounce(render));
elements.genreFilter.addEventListener('change', render);
elements.sortBy.addEventListener('change', render);
elements.decadeFilter.addEventListener('change', render);

render();
