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

/* ── MAPA ── */
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

/* Marcador — círculo con nota musical SVG */
function markerSVG(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">
    <circle cx="18" cy="18" r="16" fill="${color}" stroke="white" stroke-width="2.5"
      filter="drop-shadow(0 2px 6px rgba(0,0,0,0.5))"/>
    <!-- Nota musical: corchea blanca -->
    <g transform="translate(10,7)" fill="white">
      <!-- Plica vertical -->
      <rect x="11" y="2" width="1.8" height="14" rx="0.9"/>
      <!-- Cabeza ovalada -->
      <ellipse cx="8" cy="18" rx="4.5" ry="3.2" transform="rotate(-20,8,18)"/>
      <!-- Corchea (gancho) -->
      <path d="M12.8 2 Q18 5 15 10 Q13 13 12.8 16" stroke="white" stroke-width="1.8"
        fill="none" stroke-linecap="round"/>
    </g>
  </svg>`;
}

function addMarker(region, idx) {
  const icon = L.divIcon({
    html: `<div style="position:relative;cursor:pointer">
             <div style="position:absolute;inset:-6px;border-radius:50%;
               border:1.5px solid rgba(255,255,255,0.3);
               animation:mpulse 2.8s ease-out infinite;pointer-events:none"></div>
             ${markerSVG(region.color)}
           </div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -22]
  });
  const marker = L.marker([region.lat, region.lng], { icon }).addTo(map);
  marker.bindPopup(`
    <div style="font-family:'Cormorant Garamond',serif;font-size:1.1rem;color:#fff">${region.name}</div>
    <div style="font-size:0.75rem;color:rgba(255,255,255,0.4);margin-top:2px">${region.country}</div>
    <div style="font-size:0.75rem;color:#E8924A;margin-top:4px;font-style:italic">${region.tagline}</div>
    <div onclick="openRegion(${idx})"
      style="display:block;margin-top:12px;background:rgba(232,146,74,0.12);
        border:0.5px solid rgba(232,146,74,0.35);color:#E8924A;
        font-size:0.75rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;
        padding:9px 13px;border-radius:8px;cursor:pointer;text-align:center">
      Explorar música →
    </div>`, { maxWidth: 220, closeButton: true });
  marker.on('click', () =>
    map.flyTo([region.lat, region.lng], region.zoom, { duration: 1.5, easeLinearity: 0.2 }));
}

/* ── LISTA PANEL VACÍO ── */
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

/* ── ABRIR REGIÓN ── */
window.openRegion = function(idx) {
  const region = regionsData[idx];
  if (!region) return;
  map.closePopup();
  map.flyTo([region.lat, region.lng], region.zoom, { duration: 1.5, easeLinearity: 0.2 });

  document.getElementById('pEmpty').style.display = 'none';
  const pc = document.getElementById('pContent');
  pc.className = 'p-content show';
  pc.scrollTop = 0;

  /* Hero — URL directa */
  const heroImg = document.getElementById('heroImg');
  heroImg.style.opacity = '0';
  if (region.hero_url) {
    heroImg.src = region.hero_url;
    heroImg.onload = () => { heroImg.style.opacity='1'; heroImg.style.transition='opacity .6s'; };
    heroImg.onerror = () => { heroImg.style.opacity='0'; };
  }
  document.getElementById('heroName').textContent = region.name;
  document.getElementById('heroEye').textContent = `${region.country} · Música tradicional`;
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

/* ── INSTRUMENTOS ── */
function buildInstruments(region) {
  const row = document.getElementById('instruRow');
  row.innerHTML = '';
  if (!region.instruments?.length) {
    document.getElementById('instruSection').style.display = 'none'; return;
  }
  document.getElementById('instruSection').style.display = 'block';

  region.instruments.forEach(inst => {
    const thumbId = `thumb_${inst.name.replace(/\s/g,'_')}`;
    const btn = document.createElement('button');
    btn.className = 'instru-btn';
    btn.innerHTML = `
      <div class="instru-img-wrap" id="${thumbId}">
        ${inst.image_url
          ? `<img src="${inst.image_url}" alt="${inst.name}"
               onerror="this.parentElement.innerHTML='🎵'"/>`
          : '🎵'}
      </div>
      <div>
        <div class="instru-label">${inst.name}</div>
        <div class="instru-sub">Ver y escuchar</div>
      </div>`;
    btn.onclick = () => openInstrumentModal(inst);
    row.appendChild(btn);
  });
}

/* ── GÉNEROS ── */
function buildGenres(region) {
  const container = document.getElementById('genresContainer');
  container.innerHTML = '';
  if (!region.genres) return;
  const colors = ['#8B4A20','#1A4A6B','#3D6B45','#6B2A5A','#2A6B5C'];

  region.genres.forEach((genre, i) => {
    const item = document.createElement('div');
    item.className = 'genre-item';
    item.id = `genre_${i}`;

    /* Botón de audio */
    let audioBtn = '';
    if (genre.audio_url) {
      audioBtn = `
        <div class="audio-player" id="aplayer_${i}">
          <button class="play-btn" onclick="toggleAudio(${i}, '${genre.audio_url}', '${genre.audio_fallback || ''}')">
            <svg id="play-icon-${i}" viewBox="0 0 24 24" fill="white" width="14" height="14">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          </button>
          <div class="audio-info">
            <div class="audio-label">${genre.audio_label}</div>
            <div class="audio-progress"><div class="audio-bar" id="abar_${i}"></div></div>
          </div>
        </div>`;
    }

    item.innerHTML = `
      <div class="genre-header" onclick="toggleGenre(${i})">
        <div class="genre-dot" style="background:${colors[i%colors.length]}"></div>
        <div class="genre-title-wrap">
          <div class="genre-title">${genre.name}</div>
          <div class="genre-subtitle">${genre.origin}</div>
        </div>
        <div class="genre-arrow">▶</div>
      </div>
      <div class="genre-body">
        <div class="genre-content">
          <div class="genre-desc">${genre.description}</div>
          ${audioBtn}
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

/* ── REPRODUCTOR DE AUDIO ── */
let currentAudio = null;
let currentIdx = null;

window.toggleAudio = function(i, url, fallback) {
  const icon = document.getElementById(`play-icon-${i}`);
  const bar = document.getElementById(`abar_${i}`);

  /* Si hay otro reproduciéndose, pararlo */
  if (currentAudio && currentIdx !== i) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    resetPlayerUI(currentIdx);
    currentAudio = null;
  }

  /* Si ya está reproduciéndose este, pausar */
  if (currentAudio && currentIdx === i && !currentAudio.paused) {
    currentAudio.pause();
    icon.innerHTML = '<polygon points="5,3 19,12 5,21"/>';
    return;
  }

  /* Crear o reanudar */
  if (!currentAudio || currentIdx !== i) {
    currentAudio = new Audio(url);
    currentIdx = i;

    currentAudio.addEventListener('timeupdate', () => {
      const pct = (currentAudio.currentTime / currentAudio.duration) * 100;
      if (bar) bar.style.width = pct + '%';
    });

    currentAudio.addEventListener('ended', () => {
      resetPlayerUI(i);
      currentAudio = null; currentIdx = null;
    });

    currentAudio.addEventListener('error', () => {
      /* Audio no disponible — abrir búsqueda de YouTube */
      resetPlayerUI(i);
      currentAudio = null; currentIdx = null;
      if (fallback) window.open(fallback, '_blank');
    });
  }

  currentAudio.play().catch(() => {
    if (fallback) window.open(fallback, '_blank');
  });

  icon.innerHTML = '<rect x="5" y="3" width="4" height="18"/><rect x="15" y="3" width="4" height="18"/>';
};

function resetPlayerUI(i) {
  const icon = document.getElementById(`play-icon-${i}`);
  const bar = document.getElementById(`abar_${i}`);
  if (icon) icon.innerHTML = '<polygon points="5,3 19,12 5,21"/>';
  if (bar) { bar.style.transition='width 0.4s'; bar.style.width='0%'; }
}

/* ── MODAL INSTRUMENTO ── */
window.openInstrumentModal = function(inst) {
  /* Imagen directa desde URL del JSON */
  const imgWrap = document.getElementById('modalImgWrap');
  if (inst.image_url) {
    imgWrap.innerHTML = `
      <img class="modal-img" src="${inst.image_url}" alt="${inst.name}"
        onerror="this.parentElement.innerHTML='<div style=width:100%;height:260px;background:var(--sand);display:flex;align-items:center;justify-content:center;font-size:3rem>🎵</div>'"/>
      <div class="modal-img-cap">© Wikimedia Commons CC BY-SA</div>`;
  } else {
    imgWrap.innerHTML = `<div style="width:100%;height:260px;background:var(--sand);display:flex;align-items:center;justify-content:center;font-size:3.5rem">🎵</div>`;
  }

  document.getElementById('modalTitle').textContent = inst.name;
  document.getElementById('modalOrigin').textContent = inst.origin;
  document.getElementById('modalDesc').innerHTML = inst.description;

  /* Audio del instrumento */
  let audioHTML = '';
  if (inst.audio_url) {
    audioHTML = `
      <div class="modal-audio-label">Escuchar el instrumento</div>
      <div class="audio-player" style="margin-top:0">
        <button class="play-btn" onclick="toggleModalAudio('${inst.audio_url}', this)">
          <svg viewBox="0 0 24 24" fill="white" width="14" height="14">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
        </button>
        <div class="audio-info">
          <div class="audio-label">${inst.audio_label}</div>
          <div class="audio-progress"><div class="audio-bar" id="modal-abar"></div></div>
        </div>
      </div>`;
  }
  document.getElementById('modalAudio').innerHTML = audioHTML;
  document.getElementById('modalOverlay').classList.add('show');
};

let modalAudio = null;
window.toggleModalAudio = function(url, btn) {
  if (modalAudio && !modalAudio.paused) {
    modalAudio.pause();
    btn.querySelector('svg').innerHTML = '<polygon points="5,3 19,12 5,21"/>';
    return;
  }
  if (!modalAudio) {
    modalAudio = new Audio(url);
    const bar = document.getElementById('modal-abar');
    modalAudio.addEventListener('timeupdate', () => {
      if (bar && modalAudio.duration) bar.style.width = (modalAudio.currentTime/modalAudio.duration*100)+'%';
    });
    modalAudio.addEventListener('ended', () => {
      btn.querySelector('svg').innerHTML = '<polygon points="5,3 19,12 5,21"/>';
      if (bar) bar.style.width='0%';
      modalAudio = null;
    });
  }
  modalAudio.play().catch(() => {});
  btn.querySelector('svg').innerHTML = '<rect x="5" y="3" width="4" height="18"/><rect x="15" y="3" width="4" height="18"/>';
};

window.closeModal = function() {
  if (modalAudio) { modalAudio.pause(); modalAudio = null; }
  document.getElementById('modalOverlay').classList.remove('show');
};
window.handleOverlayClick = function(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
};
window.closePanel = function() {
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  document.getElementById('pEmpty').style.display = 'flex';
  document.getElementById('pContent').className = 'p-content';
  map.flyTo([20, 0], 3, { duration: 1.5 });
};
