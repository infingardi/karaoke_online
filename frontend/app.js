

document.addEventListener("DOMContentLoaded", async () => {
  const api = new API();
  const player = new Player();
  const ui = new UI(player, api);

  async function loadInitialTracks() {
    try {
      const tracks = await api.fetchPreviousTracks();
      if (tracks.length === 0) return;
      ui.elements.tracksSection.classList.remove("hidden");
      tracks.forEach(track => ui.addTrackToList(track));
    } catch (err) {
      console.error(err);
    }
  }

  loadInitialTracks();
});