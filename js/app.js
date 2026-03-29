/* ═══════════════════════════════════════
   Musics of the World — App principal
   ═══════════════════════════════════════ */

'use strict';

// ── ESTADO GLOBAL ──
let map, regionsData = [];
let currentRegion = null;

// ── INIT ──
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  initMap();
  buildRegionList();
});

// ── CARGAR DATOS ──
async function loadData() {
  try {
    const res = await fetch('data/regions.json');
    const data = await res.json();
    regionsData = data.regions;
  } catch(e) {
    console.error('Error cargando datos:', e);
  }
}

// ── MAPA ──
function initMap() {
  map = L.map('map', {
    center: [28.3, -15.5],
    zoom: 3,
    zoomControl: false,
    scrollWheelZoom: true,
    minZoom: 2,
    maxZoom: 16,
    zoomAnimation: true,
    fadeAnimation: true
  });

  // Satélite ESRI — océano real, sin carreteras dominantes
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; Esri, Earthstar Geographics',
    maxZoom: 19
  }).addTo(map);

  // Topónimos suaves
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
    attribution: '',
    maxZoom: 19,
    opacity: 0.42
  }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // Añadir marcadores
  regionsData.forEach((region, idx) => addMarker(region, idx));
}

// SVG del timple para marcadores
function timpleSVG(color) {
  return `<svg viewBox="0 0 44 54" width="44" height="44" style="display:block;filter:drop-shadow(0 3px 10px rgba(0,0,0,.6))">
    <circle cx="22" cy="22" r="20" fill="${color}" stroke="rgba(255,255,255,.85)" stroke-width="1.8"/>
    <g transform="translate(0,-3)">
      <path d="M22 17 Q13 20 13 31 Q13 43 22 45 Q31 43 31 31 Q31 20 22 17Z" fill="#D4903C" stroke="#7A4A18" stroke-width="1"/>
      <ellipse cx="22" cy="31" rx="4.5" ry="5.5" fill="none" stroke="#7A4A18" stroke-width="0.7" opacity="0.6"/>
      <rect x="20.5" y="5" width="3" height="13" rx="1" fill="#A06830" stroke="#7A4A18" stroke-width="0.7"/>
      <rect x="18" y="3" width="8" height="4.5" rx="1" fill="#D4903C" stroke="#7A4A18" stroke-width="0.7"/>
      <line x1="19.5" y1="6.5" x2="19.8" y2="43" stroke="#E8C880" stroke-width="0.4" opacity=".9"/>
      <line x1="21" y1="6.5" x2="21.2" y2="43" stroke="#E8C880" stroke-width="0.4" opacity=".9"/>
      <line x1="22.5" y1="6.5" x2="22.5" y2="43" stroke="#E8C880" stroke-width="0.45" opacity="1"/>
      <line x1="24" y1="6.5" x2="23.8" y2="43" stroke="#E8C880" stroke-width="0.4" opacity=".9"/>
      <line x1="25.5" y1="6.5" x2="25.2" y2="43" stroke="#E8C880" stroke-width="0.4" opacity=".9"/>
      <rect x="19" y="39" width="6.5" height="1.5" rx=".5" fill="#7A4A18"/>
    </g>
  </svg>`;
}

function addMarker(region, idx) {
  const icon = L.divIcon({
    html: `<div class="isle-pin">
      <div class="pin-pulse2"></div>
      <div class="pin-pulse"></div>
      ${timpleSVG(region.color)}
    </div>`,
    className: '',
    iconSize: [44, 54],
    iconAnchor: [22, 22],
    popupAnchor: [0, -28]
  });

  const marker = L.marker([region.lat, region.lng], { icon }).addTo(map);

  marker.bindPopup(`
    <div class="popup-name">${region.name}</div>
    <div class="popup-country">${region.country}</div>
    <div class="popup-tagline">${region.tagline}</div>
    <div class="popup-cta" onclick="openRegion(${idx})">Explorar música →</div>
  `, { maxWidth: 220, closeButton: true });

  marker.on('click', () => {
    map.flyTo([region.lat, region.lng], region.zoom, { duration: 1.5, easeLinearity: 0.2 });
  });
}

// ── LISTA DE REGIONES EN PANEL VACÍO ──
function buildRegionList() {
  const list = document.getElementById('regionList');
  if (!list) return;
  regionsData.forEach((region, idx) => {
    const item = document.createElement('div');
    item.className = 'region-list-item';
    item.innerHTML = `
      <div class="region-dot" style="background:${region.color}"></div>
      <div>
        <div class="region-list-name">${region.name}</div>
        <div class="region-list-country">${region.country} · ${region.tagline}</div>
      </div>`;
    item.onclick = () => openRegion(idx);
    list.appendChild(item);
  });
}

// ── ABRIR REGIÓN ──
window.openRegion = async function(idx) {
  const region = regionsData[idx];
  if (!region) return;
  currentRegion = region;

  map.closePopup();
  map.flyTo([region.lat, region.lng], region.zoom, { duration: 1.5, easeLinearity: 0.2 });

  document.getElementById('pEmpty').style.display = 'none';
  const pc = document.getElementById('pContent');
  pc.className = 'p-content show';
  pc.scrollTop = 0;

  // Hero — foto desde Wikipedia
  const heroImg = document.getElementById('heroImg');
  heroImg.src = '';
  heroImg.style.opacity = '0';
  document.getElementById('heroName').textContent = region.name;
  document.getElementById('heroEye').textContent = `${region.country} · Música tradicional`;
  document.getElementById('heroTagline').textContent = region.tagline;

  loadWikiImage(region.hero_wikipedia, 'es', 900).then(url => {
    if (url) {
      heroImg.src = url;
      heroImg.onload = () => { heroImg.style.opacity = '1'; heroImg.style.transition = 'opacity .5s'; };
    }
  });

  // Descripción
  document.getElementById('regionDesc').innerHTML = region.description;

  // Tip de viaje
  if (region.travel_tip) {
    document.getElementById('travelTip').style.display = 'flex';
    document.getElementById('travelTipText').textContent = region.travel_tip;
  } else {
    document.getElementById('travelTip').style.display = 'none';
  }

  // Instrumentos
  buildInstruments(region);

  // Géneros
  buildGenres(region);
};

// ── IMAGEN WIKIPEDIA ──
async function loadWikiImage(title, lang = 'es', size = 640) {
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=${size}&origin=*`;
    const d = await (await fetch(url)).json();
    const page = Object.values(d.query.pages)[0];
    return page?.thumbnail?.source || null;
  } catch { return null; }
}

// ── INSTRUMENTOS ──
function buildInstruments(region) {
  const row = document.getElementById('instruRow');
  row.innerHTML = '';
  if (!region.instruments || region.instruments.length === 0) {
    document.getElementById('instruSection').style.display = 'none';
    return;
  }
  document.getElementById('instruSection').style.display = 'block';

  region.instruments.forEach(inst => {
    const btn = document.createElement('button');
    btn.className = 'instru-btn';
    btn.innerHTML = `
      <div class="instru-img-wrap" id="thumb_${inst.name}">⏳</div>
      <div>
        <div class="instru-label">${inst.name}</div>
        <div class="instru-sub">Ver y escuchar</div>
      </div>`;
    btn.onclick = () => openInstrumentModal(inst);
    row.appendChild(btn);

    // Cargar thumbnail desde Wikipedia
    loadWikiImage(inst.wikipedia, 'es', 200).then(url => {
      const wrap = document.getElementById(`thumb_${inst.name}`);
      if (wrap && url) {
        wrap.innerHTML = `<img src="${url}" alt="${inst.name}"/>`;
      } else if (wrap) {
        wrap.textContent = '🎵';
      }
    });
  });
}

// ── GÉNEROS ──
function buildGenres(region) {
  const container = document.getElementById('genresContainer');
  container.innerHTML = '';
  if (!region.genres) return;

  const colors = ['#8B4A20', '#1A4A6B', '#3D6B45', '#6B2A5A', '#2A6B5C'];

  region.genres.forEach((genre, i) => {
    const item = document.createElement('div');
    item.className = 'genre-item';
    item.id = `genre_${i}`;
    item.innerHTML = `
      <div class="genre-header" onclick="toggleGenre(${i})">
        <div class="genre-dot" style="background:${colors[i % colors.length]}"></div>
        <div class="genre-title-wrap">
          <div class="genre-title">${genre.name}</div>
          <div class="genre-subtitle">${genre.origin}</div>
        </div>
        <div class="genre-arrow">▶</div>
      </div>
      <div class="genre-body">
        <div class="genre-content">
          <div class="genre-desc">${genre.description}</div>
          <a class="yt-btn" href="https://www.youtube.com/results?search_query=${encodeURIComponent(genre.youtube_search)}" target="_blank">
            <svg class="yt-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.53 3.5 12 3.5 12 3.5s-7.53 0-9.38.55A3.02 3.02 0 00.5 6.19C0 8.05 0 12 0 12s0 3.95.5 5.81a3.02 3.02 0 002.12 2.14C4.47 20.5 12 20.5 12 20.5s7.53 0 9.38-.55a3.02 3.02 0 002.12-2.14C24 15.95 24 12 24 12s0-3.95-.5-5.81zM9.75 15.5v-7l6.5 3.5-6.5 3.5z"/></svg>
            Escuchar en YouTube
          </a>
        </div>
      </div>`;
    container.appendChild(item);
  });
}

window.toggleGenre = function(i) {
  const item = document.getElementById(`genre_${i}`);
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.genre-item').forEach(el => el.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
};

// ── MODAL INSTRUMENTO ──
window.openInstrumentModal = async function(inst) {
  // Imagen
  const imgWrap = document.getElementById('modalImgWrap');
  imgWrap.innerHTML = `<div style="width:100%;height:240px;background:var(--sand);display:flex;align-items:center;justify-content:center;color:#B0A898">Cargando…</div>`;

  loadWikiImage(inst.wikipedia, 'es', 600).then(url => {
    if (url) {
      imgWrap.innerHTML = `<img class="modal-img" src="${url}" alt="${inst.name}"/><div class="modal-img-cap">© Wikipedia · Wikimedia Commons CC BY-SA</div>`;
    } else {
      imgWrap.innerHTML = `<div style="width:100%;height:240px;background:var(--sand);display:flex;align-items:center;justify-content:center;font-size:3rem">🎵</div>`;
    }
  });

  document.getElementById('modalTitle').textContent = inst.name;
  document.getElementById('modalOrigin').textContent = inst.wikipedia || '';
  document.getElementById('modalDesc').innerHTML = inst.description;

  // Audio — búsqueda en YouTube
  document.getElementById('modalAudio').innerHTML = `
    <div class="modal-audio-label">Escuchar el instrumento</div>
    <a class="yt-btn" href="https://www.youtube.com/results?search_query=${encodeURIComponent(inst.name + ' instrumento solo')}" target="_blank">
      <svg class="yt-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.53 3.5 12 3.5 12 3.5s-7.53 0-9.38.55A3.02 3.02 0 00.5 6.19C0 8.05 0 12 0 12s0 3.95.5 5.81a3.02 3.02 0 002.12 2.14C4.47 20.5 12 20.5 12 20.5s7.53 0 9.38-.55a3.02 3.02 0 002.12-2.14C24 15.95 24 12 24 12s0-3.95-.5-5.81zM9.75 15.5v-7l6.5 3.5-6.5 3.5z"/></svg>
      Buscar «${inst.name}» en YouTube
    </a>
    <div class="modal-yt-note" style="margin-top:.5rem">Se abre YouTube con los mejores resultados para este instrumento.</div>`;

  document.getElementById('modalOverlay').classList.add('show');
};

window.closeModal = function() {
  document.getElementById('modalOverlay').classList.remove('show');
};

window.handleOverlayClick = function(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
};

// ── VOLVER AL MAPA ──
window.closePanel = function() {
  document.getElementById('pEmpty').style.display = 'flex';
  document.getElementById('pContent').className = 'p-content';
  currentRegion = null;
  map.flyTo([20, 0], 3, { duration: 1.5 });
};
