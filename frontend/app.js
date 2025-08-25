// PlayAlong — app.js (final com barra de progresso e waveform dinâmica)
const API_BASE = "http://localhost:3000";

const qs = (sel, el = document) => el.querySelector(sel);

const state = {
  context: null,
  masterGain: null,
  isPlaying: false,
  loop: false,
  startTime: 0,
  pauseTime: 0,
  duration: 0,
  stems: {},
  masterVolume: 0.9,
  playbackRate: 1,
  animationId: null,
  originalUrl: null,
  waveformData: null,
};

const elements = {
  fileInput: qs("#fileInput"),
  dropzone: qs("#dropzone"),
  browseBtn: qs("#browseBtn"),
  progressBar: qs("#progressBar"),
  loadingLabel: qs("#loadingLabel"),
  player: qs("#playerSection"),
  playBtn: qs("#playBtn"),
  stopBtn: qs("#stopBtn"),
  masterVolume: qs("#masterVolume"),
  playbackRate: qs("#playbackRate"),
  waveform: qs("#waveform"),
  trackTitle: qs("#trackTitle"),
  currentTime: qs("#currentTime"),
  totalTime: qs("#totalTime"),
  stemsList: qs("#stemsList"),
  playOriginalBtn: qs("#playOriginalBtn"),
  tracksSection: qs("#tracksSection"),
  tracksList: qs("#tracksList"),
};

let originalAudio = null;

// --- Drag & Drop ---
["dragenter", "dragover"].forEach(ev => elements.dropzone.addEventListener(ev, (e) => {
  e.preventDefault(); e.stopPropagation(); elements.dropzone.classList.add("dragover");
}));
["dragleave", "drop"].forEach(ev => elements.dropzone.addEventListener(ev, (e) => {
  e.preventDefault(); e.stopPropagation(); elements.dropzone.classList.remove("dragover");
}));
elements.dropzone.addEventListener("click", () => elements.fileInput.click());
elements.browseBtn.addEventListener("click", (e) => { e.stopPropagation(); elements.fileInput.click(); });
elements.fileInput.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (file) handleFile(file);
});
elements.dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files?.[0];
  if (file) handleFile(file);
});

// Chamar ao carregar a página
async function loadPreviousTracks() {
  try {
    const res = await fetch(`${API_BASE}/tracks`);
    if (!res.ok) throw new Error("Falha ao buscar tracks");
    const tracks = await res.json();
    if (tracks.length === 0) return;

    elements.tracksSection.classList.remove("hidden");
    elements.tracksList.innerHTML = "";

    tracks.forEach(track => {
      const item = document.createElement("div");
      item.className = "track-item";
      item.textContent = track.name;
      item.style.cursor = "pointer";

      item.addEventListener("click", () => loadTrack(track));
      elements.tracksList.appendChild(item);
    });
  } catch (err) {
    console.error(err);
  }
}
// --- Toggle da lista de músicas enviadas ---
const tracksHeader = elements.tracksSection.querySelector("h3");
let tracksCollapsed = false;

// Adiciona setinha
const arrow = document.createElement("span");
arrow.textContent = " ▼"; // inicialmente aberta
arrow.style.transition = "transform 0.5s";
tracksHeader.appendChild(arrow);

tracksHeader.style.cursor = "pointer"; // indica que é clicável
tracksHeader.addEventListener("click", () => {
  tracksCollapsed = !tracksCollapsed;
  elements.tracksList.style.display = tracksCollapsed ? "none" : "block";

  // gira a seta
  arrow.style.transform = tracksCollapsed ? "rotate(180deg)" : "rotate(0deg)";
});

async function loadTrack(track) {
  try {
    elements.player.classList.remove("hidden"); // garante que o player apareça
    elements.trackTitle.textContent = track.name;

    await initAudioContext();
    await loadStems({
      "Voz": track.vocals,
      "Instrumental": track.instrumental
    });
    state.originalUrl = track.original;

    // gera waveform para músicas antigas
    await drawWaveform();

    // marca barra de progresso e temporizador no início
    state.pauseTime = 0;
    elements.progressBar.value = 0;
    elements.currentTime.textContent = formatTime(0);

    // --- Colapsa lista de músicas antigas automaticamente ---
    tracksCollapsed = true;
    elements.tracksList.style.display = "none";
    if (arrow) arrow.style.transform = "rotate(180deg)";

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar a música selecionada");
  }
}


// Chama quando o JS carrega
loadPreviousTracks();

async function handleFile(file) {
  elements.loadingLabel.classList.remove("hidden");
  elements.loadingLabel.querySelector(".loading-text").textContent = "Enviando arquivo…";
  elements.trackTitle.textContent = file.name;

  try {
    const urls = await sendToBackend(file);

    elements.player.classList.remove("hidden");
    await drawWaveform();

    // Adiciona a música recém enviada à lista
    addTrackToList({
      name: file.name,
      original: urls.original,
      vocals: urls.vocals,
      instrumental: urls.instrumental
    });

  } catch (err) {
    console.error(err);
    elements.loadingLabel.querySelector(".loading-text").textContent = "Erro ao processar.";
    alert("Não foi possível processar o arquivo.");
  } finally {
    // esconde o loading após concluir
    setTimeout(() => elements.loadingLabel.classList.add("hidden"), 500);
  }
}

function addTrackToList(track) {
  elements.tracksSection.classList.remove("hidden");

  const item = document.createElement("div");
  item.className = "track-item";
  item.textContent = track.name;
  item.addEventListener("click", () => loadTrack(track));

  elements.tracksList.appendChild(item);

  // Se a lista estava colapsada, mantém colapsada
  if (tracksCollapsed) {
    elements.tracksList.style.display = "none";
    if (arrow) arrow.style.transform = "rotate(180deg)";
  }
}


// --- Backend flow ---
async function sendToBackend(file) {
  // mostra loading
  elements.loadingLabel.classList.remove("hidden");
  elements.loadingLabel.querySelector(".loading-text").textContent = "Enviando arquivo…";

  const form = new FormData();
  form.append("file", file);

  try {
    const upload = await fetch(`${API_BASE}/upload`, { method: "POST", body: form });
    if (!upload.ok) throw new Error("Falha no upload");

    const urls = await upload.json();
    await initAudioContext();
    await loadStems({
      "Voz": urls.vocals,
      "Instrumental": urls.instrumental
    });
    state.originalUrl = urls.original;

    setProgress(100, "Pronto!");

    return urls;
  } catch (err) {
    elements.loadingLabel.querySelector(".loading-text").textContent = "Erro ao processar.";
    throw err;
  } finally {
    // esconde o loading após meio segundo
    setTimeout(() => elements.loadingLabel.classList.add("hidden"), 500);
  }
}


function setProgress(pct, label) {
  elements.progressBar.value = pct;
  if (label) {
    elements.loadingLabel.querySelector(".loading-text").textContent = label;
  }
}

// --- Audio graph ---
async function initAudioContext() {
  if (state.context) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  state.context = new AC();
  state.masterGain = state.context.createGain();
  state.masterGain.gain.value = state.masterVolume;
  state.masterGain.connect(state.context.destination);
}

async function loadStems(stemsMap) {
  stop();
  state.stems = {};
  elements.stemsList.innerHTML = "";

  for (const [name, url] of Object.entries(stemsMap)) {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.src = url;
    audio.preload = "auto";
    await audio.load?.();

    const source = state.context.createMediaElementSource(audio);
    const gain = state.context.createGain();
    gain.gain.value = 1;
    source.connect(gain).connect(state.masterGain);

    state.stems[name] = { name, audio, gainNode: gain, muted: false, volume: 1 };
    buildStemRow(name);
  }

  const any = Object.values(state.stems)[0];
  if (any) {
    await new Promise(res => {
      if (!isNaN(any.audio.duration) && any.audio.duration > 0) res();
      else any.audio.addEventListener("loadedmetadata", res, { once: true });
    });
    state.duration = any.audio.duration || 0;
    elements.totalTime.textContent = formatTime(state.duration);
  }

  hookControls();
}

function buildStemRow(name) {
  const row = document.createElement("div");
  row.className = "stem";
  row.innerHTML = `
    <div class="stem-name">${name}</div>
    <input class="stem-volume" type="range" min="0" max="1" step="0.01" value="1">
    <button class="mute-btn">🔊</button>
  `;
  const vol = row.querySelector(".stem-volume");
  const muteBtn = row.querySelector(".mute-btn");
  vol.addEventListener("input", (e) => {
    const v = parseFloat(e.target.value);
    state.stems[name].volume = v;
    state.stems[name].gainNode.gain.value = state.stems[name].muted ? 0 : v;
  });
  muteBtn.addEventListener("click", () => {
    const s = state.stems[name];
    s.muted = !s.muted;
    muteBtn.classList.toggle("active", s.muted);
    muteBtn.textContent = s.muted ? "🔇" : "🔊";
    s.gainNode.gain.value = s.muted ? 0 : s.volume;
  });
  elements.stemsList.appendChild(row);
}

// --- Player controls ---
function hookControls() {
  elements.playBtn.onclick = togglePlay;
  elements.stopBtn.onclick = stop;
  elements.masterVolume.oninput = (e) => {
    state.masterVolume = parseFloat(e.target.value);
    if (state.masterGain) state.masterGain.gain.value = state.masterVolume;
  };
  elements.playbackRate.oninput = (e) => {
    state.playbackRate = parseFloat(e.target.value);
    Object.values(state.stems).forEach(s => s.audio.playbackRate = state.playbackRate);
  };
  elements.progressBar.oninput = (e) => {
    const pct = parseFloat(e.target.value) / 100;
    const newTime = pct * state.duration;
    Object.values(state.stems).forEach(s => { s.audio.currentTime = newTime; });
    state.pauseTime = newTime;
    updateTimeUI(newTime);
  };
  elements.playOriginalBtn.onclick = () => {
    if (!state.originalUrl) return;
    if (!originalAudio) originalAudio = new Audio(state.originalUrl);
    if (originalAudio.paused) {
      originalAudio.play();
      elements.playOriginalBtn.textContent = "⏸️ Pausar faixa original";
    } else {
      originalAudio.pause();
      elements.playOriginalBtn.textContent = "▶️ Tocar faixa original";
    }
  };
}

function togglePlay() {
  if (!state.context) return;
  if (state.context.state === "suspended") state.context.resume();
  state.isPlaying ? pause() : play();
}

function play() {
  Object.values(state.stems).forEach(s => {
    s.audio.playbackRate = state.playbackRate;
    const seek = state.pauseTime || 0;
    s.audio.currentTime = seek;
    s.audio.play();
  });
  state.isPlaying = true;
  // startTime = tempo real baseado na posição atual
  state.startTime = performance.now() - (state.pauseTime * 1000);
  elements.playBtn.textContent = "⏸️";
  tick();
}

function pause() {
  Object.values(state.stems).forEach(s => s.audio.pause());
  state.isPlaying = false;
  // Pega o tempo atual de um stem para sincronizar
  state.pauseTime = Object.values(state.stems)[0]?.audio.currentTime || 0;
  elements.playBtn.textContent = "▶️";
  if (state.animationId) cancelAnimationFrame(state.animationId);
}

function stop() {
  Object.values(state.stems).forEach(s => { s.audio.pause(); s.audio.currentTime = 0; });
  state.isPlaying = false;
  state.pauseTime = 0;
  elements.playBtn.textContent = "▶️";
  updateTimeUI(0);
  if (state.animationId) cancelAnimationFrame(state.animationId);
}

function getCurrentTime() {
  return state.isPlaying ? Math.min(state.duration, (performance.now() - state.startTime) / 1000)
    : Math.min(state.duration, state.pauseTime || 0);
}
function updateTimeUI(sec) { elements.currentTime.textContent = formatTime(sec); }
function formatTime(sec) { sec = Math.floor(sec || 0); return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`; }

// --- Waveform ---
async function drawWaveform() {
  const canvas = elements.waveform;
  const ctx = canvas.getContext("2d");
  if (!state.stems["Voz"]) return;
  const url = state.stems["Voz"].audio.src;

  const resp = await fetch(url);
  const arrayBuffer = await resp.arrayBuffer();
  const audioBuffer = await state.context.decodeAudioData(arrayBuffer);

  const raw = audioBuffer.getChannelData(0);
  const step = Math.ceil(raw.length / canvas.width);
  const amp = canvas.height / 2;

  const data = [];
  for (let i = 0; i < canvas.width; i++) {
    let min = 1.0, max = -1.0;
    for (let j = 0; j < step; j++) {
      const datum = raw[(i * step) + j];
      if (datum < min) min = datum;
      if (datum > max) max = datum;
    }
    data.push([min, max]);
  }
  state.waveformData = data;
  drawWaveformFrame();
}

function drawWaveformFrame() {
  const canvas = elements.waveform;
  const ctx = canvas.getContext("2d");
  const data = state.waveformData;
  if (!data) return;
  const amp = canvas.height / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < canvas.width; i++) {
    const [min, max] = data[i];
    ctx.fillStyle = "rgba(124,92,255,0.3)";
    ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
  }

  // indicador de posição atual
  const now = getCurrentTime();
  const pos = Math.floor((now / state.duration) * canvas.width);
  ctx.fillStyle = "rgba(124,92,255,0.8)";
  ctx.fillRect(pos, 0, 2, canvas.height);
}

// --- Animation loop ---
function tick() {
  const now = getCurrentTime();
  updateTimeUI(now);
  elements.progressBar.value = (now / state.duration) * 100;
  drawWaveformFrame();
  state.animationId = requestAnimationFrame(tick);
}

// Barra de progresso interativa
elements.progressBar.addEventListener("input", (e) => {
  const pct = parseFloat(e.target.value) / 100;
  const newTime = pct * state.duration;

  Object.values(state.stems).forEach(s => s.audio.currentTime = newTime);
  state.pauseTime = newTime;

  updateTimeUI(newTime);
  drawWaveformFrame();

  // Se a música estiver tocando, ajusta o startTime para sincronizar o tick
  if (state.isPlaying) {
    state.startTime = performance.now() - (newTime * 1000);
  }
});

// Garante que, ao soltar a barra, a música continue tocando normalmente
elements.progressBar.addEventListener("change", (e) => {
  if (state.isPlaying) tick(); // garante que a animação continue
});


