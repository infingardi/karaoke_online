class Player {
    constructor() {
        this.state = {
            context: null,
            masterGain: null,
            isPlaying: false,
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
        this.originalAudio = null;
    }

    async initAudioContext() {
        if (this.state.context) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        this.state.context = new AC();
        this.state.masterGain = this.state.context.createGain();
        this.state.masterGain.gain.value = this.state.masterVolume;
        this.state.masterGain.connect(this.state.context.destination);
    }

    async loadStems(stemsMap) {
        this.stop();
        this.state.stems = {};

        for (const [name, url] of Object.entries(stemsMap)) {
            const audio = new Audio(url);
            audio.crossOrigin = "anonymous";
            audio.preload = "auto";
            await audio.load?.();

            const source = this.state.context.createMediaElementSource(audio);
            const gain = this.state.context.createGain();
            gain.gain.value = 1;
            source.connect(gain).connect(this.state.masterGain);

            this.state.stems[name] = { name, audio, gainNode: gain, muted: false, volume: 1 };
        }

        const firstStem = Object.values(this.state.stems)[0];
        if (firstStem) {

            await new Promise(res => {
                if (!isNaN(firstStem.audio.duration) && firstStem.audio.duration > 0) {
                    res();
                } else {
                    firstStem.audio.addEventListener("loadedmetadata", res, { once: true });
                }
            });
            this.state.duration = firstStem.audio.duration || 0;
        }
    }

    togglePlay() {
        if (!this.state.context) return;
        if (this.state.context.state === "suspended") this.state.context.resume();
        this.state.isPlaying ? this.pause() : this.play();
    }

    play() {
        Object.values(this.state.stems).forEach(s => {
            s.audio.playbackRate = this.state.playbackRate;
            const seek = this.state.pauseTime || 0;
            s.audio.currentTime = seek;
            s.audio.play();
        });
        this.state.isPlaying = true;
        this.state.startTime = performance.now() - (this.state.pauseTime * 1000);
    }

    pause() {
        Object.values(this.state.stems).forEach(s => s.audio.pause());
        this.state.isPlaying = false;
        this.state.pauseTime = Object.values(this.state.stems)[0]?.audio.currentTime || 0;
        if (this.state.animationId) cancelAnimationFrame(this.state.animationId);
    }

    stop() {
        Object.values(this.state.stems).forEach(s => { s.audio.pause(); s.audio.currentTime = 0; });
        this.state.isPlaying = false;
        this.state.pauseTime = 0;
        if (this.state.animationId) cancelAnimationFrame(this.state.animationId);
    }

    setPlaybackRate(rate) {
        this.state.playbackRate = rate;
        Object.values(this.state.stems).forEach(s => s.audio.playbackRate = rate);
    }

    setMasterVolume(volume) {
        this.state.masterVolume = volume;
        if (this.state.masterGain) this.state.masterGain.gain.value = volume;
    }

    seek(newTime) {
        Object.values(this.state.stems).forEach(s => s.audio.currentTime = newTime);
        this.state.pauseTime = newTime;
        if (this.state.isPlaying) {
            this.state.startTime = performance.now() - (newTime * 1000);
        }
    }

    getCurrentTime() {
        return this.state.isPlaying ? Math.min(this.state.duration, (performance.now() - this.state.startTime) / 1000)
            : Math.min(this.state.duration, this.state.pauseTime || 0);
    }

    async loadWaveformData() {
        if (!this.state.stems["Voz"]) return;
        const url = this.state.stems["Voz"].audio.src;
        const resp = await fetch(url);
        const arrayBuffer = await resp.arrayBuffer();
        const audioBuffer = await this.state.context.decodeAudioData(arrayBuffer);
        const raw = audioBuffer.getChannelData(0);

        this.state.waveformRaw = raw;
    }

}
