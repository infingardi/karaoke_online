class API {
    constructor(baseUrl = "http://localhost:3000") {
        this.baseUrl = baseUrl;
    }

    async fetchPreviousTracks() {
        const res = await fetch(`${this.baseUrl}/tracks`);
        if (!res.ok) throw new Error("Falha ao buscar tracks");
        return await res.json();
    }

    async sendToBackend(file) {
        const form = new FormData();
        form.append("file", file);
        const upload = await fetch(`${this.baseUrl}/upload`, { method: "POST", body: form });
        if (!upload.ok) throw new Error("Falha no upload");
        return await upload.json();
    }
}