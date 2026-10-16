'use strict';

/*
 * External API endpoints used:
 *   1. GET /character?page=N&name=Q   -> character catalog (paginated, with name filter)
 *   2. GET /character/{id}            -> character detail
 *   3. GET /episode/{id1,id2,...}     -> episodes the character appears in
 *   4. GET /location/{id}             -> current location detail (type, dimension, residents)
 */
const API_BASE = 'https://rickandmortyapi.com/api';

const catalogView = document.getElementById('catalogView');
const detailView = document.getElementById('detailView');
const detailContent = document.getElementById('detailContent');
const grid = document.getElementById('characterGrid');
const statusText = document.getElementById('status');
const searchInput = document.getElementById('searchInput');
const loadMoreButton = document.getElementById('loadMoreButton');

let characters = [];
let nextPageUrl = null;
let searchTimer = null;
let requestCounter = 0;
let catalogScroll = 0;

// ===== API =====

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The public API rate-limits clients (HTTP 429). Its 429 responses have no CORS
// header, so the browser reports them as a network error: retry with backoff.
async function getJson(url, retries = 4) {
    for (let attempt = 0; ; attempt++) {
        let response;
        try {
            response = await fetch(url);
        } catch (error) {
            if (attempt >= retries) throw new Error('Network error or API rate limit reached, try again later');
            await sleep(1000 * 2 ** attempt);
            continue;
        }
        if (response.status === 404) {
            return null;
        }
        if (response.status === 429 && attempt < retries) {
            await sleep(1000 * 2 ** attempt);
            continue;
        }
        if (!response.ok) {
            throw new Error(`Request failed (${response.status})`);
        }
        return response.json();
    }
}

const api = {
    // Endpoint 1: catalog
    getCharacters: (name = '') => {
        const params = new URLSearchParams({ page: '1' });
        if (name) params.set('name', name);
        return getJson(`${API_BASE}/character/?${params}`);
    },
    // Endpoint 2: character by ID
    getCharacter: (id) => getJson(`${API_BASE}/character/${id}`),
    // Endpoint 3: episodes (several IDs in one request)
    getEpisodes: async (ids) => {
        if (ids.length === 0) return [];
        const data = await getJson(`${API_BASE}/episode/${ids.join(',')}`);
        if (!data) return [];
        return Array.isArray(data) ? data : [data];
    },
    // Endpoint 4: location by ID
    getLocation: (id) => getJson(`${API_BASE}/location/${id}`)
};

const idFromUrl = (url) => (url ? url.split('/').pop() : null);

// ===== Catalog =====

function createCard(character) {
    const card = document.createElement('article');
    card.className = 'card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View details of ${character.name}`);

    const img = document.createElement('img');
    img.className = 'card-img';
    img.src = character.image;
    img.alt = character.name;
    img.loading = 'lazy';
    img.style.aspectRatio = '1 / 1';

    const body = document.createElement('div');
    body.className = 'card-body';

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = character.name;

    body.append(title, createStatusBadge(character));

    const meta = document.createElement('p');
    meta.className = 'card-meta';
    meta.textContent = character.location.name;
    body.append(meta);

    card.append(img, body);
    card.addEventListener('click', () => openDetail(character.id));
    card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openDetail(character.id);
        }
    });
    return card;
}

function createStatusBadge(character) {
    const badge = document.createElement('span');
    badge.className = 'badge';
    const dot = document.createElement('span');
    dot.className = `dot ${character.status.toLowerCase()}`;
    badge.append(dot, `${character.status} · ${character.species}`);
    return badge;
}

// Instant local filter over the cards already loaded
function renderCatalog() {
    const query = searchInput.value.trim().toLowerCase();
    const visible = query
        ? characters.filter((c) => c.name.toLowerCase().includes(query))
        : characters;

    grid.replaceChildren();
    if (visible.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty';
        empty.textContent = query ? `No characters match "${searchInput.value.trim()}".` : 'No characters.';
        grid.append(empty);
    } else {
        visible.forEach((c) => grid.append(createCard(c)));
    }
    loadMoreButton.classList.toggle('hidden', !nextPageUrl);
}

// Loads the first page from the API (optionally filtered by name)
async function loadCharacters(name = '') {
    const requestId = ++requestCounter;
    statusText.classList.remove('error');
    statusText.textContent = name ? `Searching "${name}"...` : 'Loading characters...';
    try {
        const data = await api.getCharacters(name);
        if (requestId !== requestCounter) return; // A newer search already started
        characters = data ? data.results : [];
        nextPageUrl = data ? data.info.next : null;
        statusText.textContent = data
            ? `${data.info.count} characters found`
            : 'No characters found';
        renderCatalog();
    } catch (error) {
        if (requestId !== requestCounter) return;
        statusText.classList.add('error');
        statusText.textContent = `Could not load characters: ${error.message}`;
    }
}

loadMoreButton.addEventListener('click', async () => {
    if (!nextPageUrl) return;
    loadMoreButton.disabled = true;
    try {
        const data = await getJson(nextPageUrl);
        characters = characters.concat(data.results);
        nextPageUrl = data.info.next;
        renderCatalog();
    } catch (error) {
        statusText.classList.add('error');
        statusText.textContent = `Could not load more: ${error.message}`;
    } finally {
        loadMoreButton.disabled = false;
    }
});

// Real-time search: filters instantly and then asks the API for every match
searchInput.addEventListener('input', () => {
    renderCatalog();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => loadCharacters(searchInput.value.trim()), 350);
});

// ===== Detail view =====

function addRow(list, label, value) {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value || '—';
    list.append(dt, dd);
}

function showView(view) {
    const showDetail = view === 'detail';
    catalogView.classList.toggle('hidden', showDetail);
    detailView.classList.toggle('hidden', !showDetail);
}

function openDetail(id) {
    catalogScroll = window.scrollY;
    location.hash = `character/${id}`;
}

async function renderDetail(id) {
    showView('detail');
    window.scrollTo(0, 0);
    detailContent.textContent = 'Loading character...';

    try {
        const character = await api.getCharacter(id);
        if (!character) {
            detailContent.textContent = 'Character not found.';
            return;
        }

        const locationId = idFromUrl(character.location.url);
        const episodeIds = character.episode.map(idFromUrl);
        const [location, episodes] = await Promise.all([
            locationId ? api.getLocation(locationId) : Promise.resolve(null),
            api.getEpisodes(episodeIds)
        ]);

        detailContent.replaceChildren(buildDetail(character, location, episodes));
    } catch (error) {
        detailContent.textContent = `Could not load character: ${error.message}`;
    }
}

function buildDetail(character, location, episodes) {
    const fragment = document.createDocumentFragment();

    const header = document.createElement('div');
    header.className = 'detail-header';
    header.style.marginTop = '0';

    const img = document.createElement('img');
    img.src = character.image;
    img.alt = character.name;

    const info = document.createElement('div');
    info.className = 'info';
    const name = document.createElement('h2');
    name.textContent = character.name;

    const list = document.createElement('dl');
    list.className = 'detail-list';
    addRow(list, 'ID', String(character.id));
    addRow(list, 'Status', character.status);
    addRow(list, 'Species', character.species);
    addRow(list, 'Type', character.type);
    addRow(list, 'Gender', character.gender);
    addRow(list, 'Origin', character.origin.name);
    addRow(list, 'Created', new Date(character.created).toLocaleDateString());
    info.append(name, list);
    header.append(img, info);
    fragment.append(header);

    // Location (endpoint 4)
    const locationTitle = document.createElement('h3');
    locationTitle.className = 'section-title';
    locationTitle.textContent = 'Current location';
    const locationList = document.createElement('dl');
    locationList.className = 'detail-list';
    if (location) {
        addRow(locationList, 'Name', location.name);
        addRow(locationList, 'Type', location.type);
        addRow(locationList, 'Dimension', location.dimension);
        addRow(locationList, 'Residents', String(location.residents.length));
    } else {
        addRow(locationList, 'Name', character.location.name);
    }
    fragment.append(locationTitle, locationList);

    // Episodes (endpoint 3)
    const episodesTitle = document.createElement('h3');
    episodesTitle.className = 'section-title';
    episodesTitle.textContent = `Episodes (${episodes.length})`;
    const episodeList = document.createElement('ul');
    episodeList.className = 'episode-list';
    episodes.forEach((ep) => {
        const li = document.createElement('li');
        const code = document.createElement('span');
        code.className = 'code';
        code.textContent = ep.episode;
        const air = document.createElement('span');
        air.className = 'air';
        air.textContent = ep.air_date;
        li.append(code, ep.name, air);
        episodeList.append(li);
    });
    fragment.append(episodesTitle, episodeList);

    return fragment;
}

// Back button returns to the catalog
document.getElementById('backButton').addEventListener('click', () => {
    if (location.hash) {
        location.hash = ''; // triggers route() -> showCatalog()
    } else {
        showCatalog();
    }
});

function showCatalog() {
    showView('catalog');
    window.scrollTo(0, catalogScroll);
}

// ===== Routing with the URL hash (browser back button also works) =====

function route() {
    const match = location.hash.match(/^#character\/(\d+)$/);
    if (match) {
        renderDetail(match[1]);
    } else {
        showCatalog();
    }
}

window.addEventListener('hashchange', route);

loadCharacters().then(route);
