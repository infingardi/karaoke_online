class UI {
    constructor(player, api) {
        this.player = player;
        this.api = api;
        this.elements = {
            fileInput: document.querySelector("#fileInput"),
            dropzone: document.querySelector("#dropzone"),
            browseBtn: document.querySelector("#browseBtn"),
            progressBar: document.querySelector("#progressBar"),
            loadingLabel: document.querySelector("#loadingLabel"),
            playerSection: document.querySelector("#playerSection"),
            playBtn: document.querySelector("#playBtn"),
            stopBtn: document.querySelector("#stopBtn"),
            masterVolume: document.querySelector("#masterVolume"),
            playbackRate: document.querySelector("#playbackRate"),
            waveform: document.querySelector("#waveform"),
            trackTitle: document.querySelector("#trackTitle"),
            currentTime: document.querySelector("#currentTime"),
            totalTime: document.querySelector("#totalTime"),
            stemsList: document.querySelector("#stemsList"),
            playOriginalBtn: document.querySelector("#playOriginalBtn"),
            tracksSection: document.querySelector("#tracksSection"),
            tracksList: document.querySelector("#tracksList"),
            tracksHeader: document.querySelector("#tracksSection h3"),
            toggleBtn: document.querySelector("#themeToggle")
        };
        this.tracksCollapsed = false;
        this.originalAudio = null;
        this.initEventListeners();
        this.initTracksHeader();
    }

    initEventListeners() {
        // Drag & Drop
        ['dragenter', 'dragover'].forEach(ev => this.elements.dropzone.addEventListener(ev, e => {
            e.preventDefault(); e.stopPropagation(); this.elements.dropzone.classList.add("dragover");
        }));
        ['dragleave', 'drop'].forEach(ev => this.elements.dropzone.addEventListener(ev, e => {
            e.preventDefault(); e.stopPropagation(); this.elements.dropzone.classList.remove("dragover");
        }));
        this.elements.dropzone.addEventListener("click", () => this.elements.fileInput.click());
        this.elements.browseBtn.addEventListener("click", e => { e.stopPropagation(); this.elements.fileInput.click(); });
        this.elements.fileInput.addEventListener("change", e => {
            const file = e.target.files?.[0];
            if (file) this.handleFile(file);
        });
        this.elements.dropzone.addEventListener("drop", e => {
            const file = e.dataTransfer.files?.[0];
            if (file) this.handleFile(file);
        });

        // Player Controls
        this.elements.playBtn.onclick = () => {
            this.player.togglePlay();
            this.updatePlayerUI();
        };
        this.elements.stopBtn.onclick = () => {
            this.player.stop();
            this.updatePlayerUI();
        };
        this.elements.masterVolume.oninput = e => this.player.setMasterVolume(parseFloat(e.target.value));
        this.elements.playbackRate.oninput = e => this.player.setPlaybackRate(parseFloat(e.target.value));

        // Progress Bar
        this.elements.progressBar.addEventListener("input", e => {
            const pct = parseFloat(e.target.value) / 100;
            const newTime = pct * this.player.state.duration;
            this.player.seek(newTime);
            this.updateTimeUI(newTime);
            this.drawWaveform();
        });
        this.elements.progressBar.addEventListener("change", () => {
            if (this.player.state.isPlaying) this.tick();
        });

        // Original Track Button
        this.elements.playOriginalBtn.onclick = () => this.toggleOriginalTrack();

        const root = document.documentElement;

        if (localStorage.getItem("theme") === "light") {
            root.classList.add("light");
        }

        this.elements.toggleBtn.addEventListener("click", () => {

            root.classList.toggle("light");
            if (root.classList.contains("light")) {
                localStorage.setItem("theme", "light");
            } else {
                localStorage.setItem("theme", "dark");
            }
        });
    }

    initTracksHeader() {
        const arrow = document.createElement("span");
        arrow.textContent = " ▼";
        arrow.style.transition = "transform 0.5s";
        this.elements.tracksHeader.appendChild(arrow);
        this.elements.tracksHeader.style.cursor = "pointer";
        this.elements.tracksHeader.addEventListener("click", () => {
            this.tracksCollapsed = !this.tracksCollapsed;
            this.elements.tracksList.style.display = this.tracksCollapsed ? "none" : "block";
            arrow.style.transform = this.tracksCollapsed ? "rotate(180deg)" : "rotate(0deg)";
        });
    }

    async handleFile(file) {
        this.showLoading("Enviando arquivo…");
        this.elements.trackTitle.textContent = file.name;
        try {
            const urls = await this.api.sendToBackend(file);
            this.addTrackToList({ name: file.name, ...urls });

            this.elements.playerSection.classList.remove("hidden");
            await this.player.initAudioContext();
            await this.player.loadStems({
                "Voz": urls.vocals,
                "Instrumental": urls.instrumental
            });
            this.player.state.originalUrl = urls.original;
            await this.player.loadWaveformData();
            this.drawWaveform();
            this.elements.totalTime.textContent = this.formatTime(this.player.state.duration);

            this.updatePlayerUI();
        } catch (err) {
            console.error(err);
            this.showLoading("Erro ao processar.");
            alert("Não foi possível processar o arquivo.");
        } finally {
            setTimeout(() => this.elements.loadingLabel.classList.add("hidden"), 500);
        }
    }

    addTrackToList(track) {
        this.elements.tracksSection.classList.remove("hidden");
        const item = document.createElement("div");
        item.className = "track-item";
        item.textContent = track.name;
        item.addEventListener("click", () => this.loadTrack(track));
        this.elements.tracksList.appendChild(item);
    }

    async loadTrack(track) {
        try {
            this.elements.playerSection.classList.remove("hidden");
            this.elements.trackTitle.textContent = track.name;
            await this.player.initAudioContext();
            await this.player.loadStems({
                "Voz": track.vocals,
                "Instrumental": track.instrumental
            });
            this.player.state.originalUrl = track.original;
            await this.player.loadWaveformData();
            this.drawWaveform();
            this.player.state.pauseTime = 0;
            this.elements.progressBar.value = 0;
            this.updateTimeUI(0);
            this.elements.totalTime.textContent = this.formatTime(this.player.state.duration);
            this.elements.stemsList.innerHTML = "";
            Object.values(this.player.state.stems).forEach(s => this.buildStemRow(s.name));
            this.collapseTracks();
            this.updatePlayerUI();
        } catch (err) {
            console.error(err);
            alert("Erro ao carregar a música selecionada");
        }
    }

    buildStemRow(name) {
        const row = document.createElement("div");
        row.className = "stem";
        row.innerHTML = `
        <div class="stem-name">${name}</div>
        <input class="stem-volume" type="range" min="0" max="1" step="0.01" value="1">
        <button class="mute-btn">🔊</button>
    `;
        const vol = row.querySelector(".stem-volume");
        const muteBtn = row.querySelector(".mute-btn");
        const stem = this.player.state.stems[name];

        vol.addEventListener("input", e => {
            const v = parseFloat(e.target.value);
            stem.volume = v;
            stem.gainNode.gain.value = stem.muted ? 0 : v;
        });

        muteBtn.addEventListener("click", () => {
            stem.muted = !stem.muted;
            muteBtn.classList.toggle("active", stem.muted);
            muteBtn.textContent = stem.muted ? "🔇" : "🔊";
            stem.gainNode.gain.value = stem.muted ? 0 : stem.volume;
        });
        this.elements.stemsList.appendChild(row);
    }

    updatePlayerUI() {
        this.elements.playBtn.textContent = this.player.state.isPlaying ? "⏸️" : "▶️";
        this.updateTimeUI(this.player.getCurrentTime());
        this.elements.progressBar.value = (this.player.getCurrentTime() / this.player.state.duration) * 100;
        this.drawWaveform();
        if (this.player.state.isPlaying) {
            this.tick();
        } else {
            if (this.player.state.animationId) {
                cancelAnimationFrame(this.player.state.animationId);
            }
        }
    }

    tick() {
        const now = this.player.getCurrentTime();
        this.updateTimeUI(now);
        this.elements.progressBar.value = (now / this.player.state.duration) * 100;
        this.drawWaveform();
        if (this.player.state.isPlaying) {
            this.player.state.animationId = requestAnimationFrame(() => this.tick());
        }
    }

    showLoading(text) {
        this.elements.loadingLabel.classList.remove("hidden");
        this.elements.loadingLabel.querySelector(".loading-text").textContent = text;
    }

    formatTime(sec) {
        sec = Math.floor(sec || 0);
        return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;
    }

    updateTimeUI(sec) {
        this.elements.currentTime.textContent = this.formatTime(sec);
    }

    drawWaveform() {
        const canvas = this.elements.waveform;
        const ctx = canvas.getContext("2d");
        const raw = this.player.state.waveformRaw;
        if (!raw) return;

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

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < canvas.width; i++) {
            const [min, max] = data[i];
            ctx.fillStyle = "rgba(124,92,255,0.3)";
            ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
        }

        const now = this.player.getCurrentTime();
        const pos = Math.floor((now / this.player.state.duration) * canvas.width);
        ctx.fillStyle = "rgba(124,92,255,0.8)";
        ctx.fillRect(pos, 0, 2, canvas.height);
    }



    toggleOriginalTrack() {
        const url = this.player.state.originalUrl;
        if (!url) return;
        if (!this.originalAudio) {
            this.originalAudio = new Audio(url);
        }
        if (this.originalAudio.paused) {
            this.originalAudio.play();
            this.elements.playOriginalBtn.textContent = "⏸️ Pausar faixa original";
        } else {
            this.originalAudio.pause();
            this.elements.playOriginalBtn.textContent = "▶️ Tocar faixa original";
        }
    }

    collapseTracks() {
        this.tracksCollapsed = true;
        this.elements.tracksList.style.display = "none";
        const arrow = this.elements.tracksHeader.querySelector("span");
        if (arrow) arrow.style.transform = "rotate(180deg)";
    }
}
