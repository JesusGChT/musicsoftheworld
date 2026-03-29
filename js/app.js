'use strict';

let map, regionsData = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  initMap();
  buildRegionList();
});

async function loadData() {
  try {
    const res = await fetch('data/regions.json');
    const data = await res.json();
    regionsData = data.regions;
  } catch(e) { console.error('Error cargando datos:', e); }
}

function initMap() {
  map = L.map('map', {
    center: [20, 0], zoom: 3,
    zoomControl: false, scrollWheelZoom: true,
    minZoom: 2, maxZoom: 16
  });
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; Esri', maxZoom: 19
  }).addTo(map);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
    attribution: '', maxZoom: 19, opacity: 0.42
  }).addTo(map);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  regionsData.forEach((region, idx) => addMarker(region, idx));
}

function addMarker(region, idx) {
  const icon = L.divIcon({
    html: `<div class="map-marker" style="background:${region.color}">
             <div class="marker-pulse"></div>
           </div>`,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -16]
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

window.openRegion = function(idx) {
  const region = regionsData[idx];
  if (!region) return;
  map.closePopup();
  map.flyTo([region.lat, region.lng], region.zoom, { duration: 1.5, easeLinearity: 0.2 });

  document.getElementById('pEmpty').style.display = 'none';
  const pc = document.getElementById('pContent');
  pc.className = 'p-content show';
  pc.scrollTop = 0;

  // Hero — imagen local, siempre funciona
  const heroImg = document.getElementById('heroImg');
  heroImg.src = region.hero_image;
  heroImg.style.opacity = '0';
  heroImg.onload = () => {
    heroImg.style.opacity = '1';
    heroImg.style.transition = 'opacity .5s';
  };

  document.getElementById('heroName').textContent = region.name;
  document.getElementById('heroEye').textContent = region.country + ' · Música tradicional';
  document.getElementById('heroTagline').textContent = region.tagline;
  document.getElementById('regionDesc').innerHTML = region.description;

  if (region.travel_tip) {
    document.getElementById('travelTip').style.display = 'flex';
    document.getElementById('travelTipText').textContent = region.travel_tip;
  } else {
    document.getElementById('travelTip').style.display = 'none';
  }

  buildInstruments(region);
  buildGenres(region);
};

function buildInstruments(region) {
  const row = document.getElementById('instruRow');
  row.innerHTML = '';
  if (!region.instruments || !region.instruments.length) {
    document.getElementById('instruSection').style.display = 'none';
    return;
  }
  document.getElementById('instruSection').style.display = 'block';

  region.instruments.forEach(inst => {
    const btn = document.createElement('button');
    btn.className = 'instru-btn';
    btn.innerHTML = `
      <div class="instru-img-wrap">
        <img src="${inst.image}" alt="${inst.name}" onerror="this.parentElement.textContent='🎵'"/>
      </div>
      <div>
        <div class="instru-label">${inst.name}</div>
        <div class="instru-sub">Ver y escuchar</div>
      </div>`;
    btn.onclick = () => openInstrumentModal(inst);
    row.appendChild(btn);
  });
}

function buildGenres(region) {
  const container = document.getElementById('genresContainer');
  container.innerHTML = '';
  if (!region.genres) return;
  const colors = ['#8B4A20','#1A4A6B','#3D6B45','#6B2A5A','#2A6B5C'];
  region.genres.forEach((genre, i) => {
    const item = document.createElement('div');
    item.className = 'genre-item';
    item.id = 'genre_' + i;
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
  const item = document.getElementById('genre_' + i);
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.genre-item').forEach(el => el.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
};

// Variable global para el audio activo
let activeAudio = null;

window.openInstrumentModal = function(inst) {
  // Parar audio anterior si hay uno
  if (activeAudio) { activeAudio.pause(); activeAudio.currentTime = 0; activeAudio = null; }

  // Imagen local — siempre funciona
  document.getElementById('modalImgWrap').innerHTML = `
    <img class="modal-img" src="${inst.image}" alt="${inst.name}"
      onerror="this.parentElement.innerHTML='<div style=width:100%;height:260px;background:var(--sand);display:flex;align-items:center;justify-content:center;font-size:3.5rem>🎵</div>'"/>
    <div class="modal-img-cap">© Wikipedia · Wikimedia Commons CC BY-SA</div>`;

  document.getElementById('modalTitle').textContent = inst.name;
  document.getElementById('modalOrigin').textContent = inst.origin;
  document.getElementById('modalDesc').innerHTML = inst.description;

  // Reproductor de audio real — archivo local
  document.getElementById('modalAudio').innerHTML = `
    <div class="modal-audio-label">Escuchar el instrumento</div>
    <div style="background:var(--sand);border-radius:12px;padding:1rem">
      <audio id="audioPlayer" controls style="width:100%;accent-color:var(--terra)">
        <source src="${inst.audio}" type="audio/mpeg">
      </audio>
      <div style="font-size:10px;color:#B0A898;margin-top:.5rem;font-style:italic">${inst.audio_credit}</div>
    </div>`;

  document.getElementById('modalOverlay').classList.add('show');

  // Guardar referencia al audio
  activeAudio = document.getElementById('audioPlayer');
};

window.closeModal = function() {
  if (activeAudio) { activeAudio.pause(); activeAudio.currentTime = 0; activeAudio = null; }
  document.getElementById('modalOverlay').classList.remove('show');
};

window.handleOverlayClick = function(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
};

window.closePanel = function() {
  if (activeAudio) { activeAudio.pause(); activeAudio.currentTime = 0; activeAudio = null; }
  document.getElementById('pEmpty').style.display = 'flex';
  document.getElementById('pContent').className = 'p-content';
  map.flyTo([20, 0], 3, { duration: 1.5 });
};
