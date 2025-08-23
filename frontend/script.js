// script.js

const uploadForm = document.getElementById("uploadForm");
const playerDiv = document.getElementById("player");
const audioPlayer = document.getElementById("audioPlayer");

let audioFiles = {}; // armazenará os caminhos retornados pelo backend

// Função para reproduzir o áudio escolhido
function play(type) {
  if (!audioFiles[type]) return;
  audioPlayer.src = audioFiles[type];
  audioPlayer.play();
}

// Evento de envio do formulário
uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(uploadForm);
  const file = formData.get("file");

  if (!file) {
    alert("Selecione um arquivo antes de enviar!");
    return;
  }

  // Mostrar feedback de upload
  uploadForm.querySelector("button").disabled = true;
  uploadForm.querySelector("button").innerText = "Enviando...";

  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Erro no upload do arquivo");
    }

    const data = await response.json();

    // Salvar URLs retornadas pelo backend
    audioFiles = {
      original: data.original,
      vocals: data.vocals,
      instrumental: data.instrumental,
    };

    // Mostrar player
    playerDiv.style.display = "block";

    // Reset botão
    uploadForm.querySelector("button").disabled = false;
    uploadForm.querySelector("button").innerText = "Enviar";
  } catch (err) {
    console.error(err);
    alert("Erro ao enviar ou processar o arquivo.");
    uploadForm.querySelector("button").disabled = false;
    uploadForm.querySelector("button").innerText = "Enviar";
  }
});
