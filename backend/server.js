// backend/server.js

const express = require("express");
const multer = require("multer");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Caminho do Python do venv (uma pasta acima do backend)
const pythonPath = path.join(__dirname, "..", "spleeter-env", "Scripts", "python.exe");

// Configura upload (salva em /uploads)
const upload = multer({ dest: "uploads/" });

// Servir frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Servir pastas públicas
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/output", express.static(path.join(__dirname, "output")));

// Upload de arquivo
app.post("/upload", upload.single("file"), (req, res) => {
  try {
    // Pega extensão original do arquivo
    const ext = path.extname(req.file.originalname); // ex: .mp3, .wav
    const inputPath = path.join(__dirname, "uploads", req.file.filename + ext);

    // Renomeia o arquivo do multer para incluir a extensão
    fs.renameSync(req.file.path, inputPath);

    // Pasta de saída do Spleeter
    const outputDir = path.join(__dirname, "output", req.file.filename);
    fs.mkdirSync(outputDir, { recursive: true });

    // Comando Spleeter (2 stems: vocals + accompaniment)
    const command = `"${pythonPath}" -m spleeter separate -p spleeter:2stems -o "${outputDir}" "${inputPath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Erro ao processar áudio:", error.message);
        console.error("stdout:", stdout);
        console.error("stderr:", stderr);
        return res.status(500).send("Erro ao processar áudio");
      }

      console.log("Spleeter rodou com sucesso!");

      // Spleeter cria uma subpasta com o nome do arquivo
      const outputSubDir = path.join(outputDir, req.file.filename);

      const vocalsPath = path.join(outputSubDir, "vocals.wav");
      const instrumentalPath = path.join(outputSubDir, "accompaniment.wav");

      // Confirma que os arquivos existem
      if (!fs.existsSync(vocalsPath) || !fs.existsSync(instrumentalPath)) {
        console.error("Erro: arquivos processados não encontrados");
        return res.status(500).send("Erro: arquivos processados não encontrados");
      }

      // Retorna URLs relativas para o frontend
      res.json({
        original: "/uploads/" + req.file.filename + ext,
        vocals: `/output/${req.file.filename}/${req.file.filename}/vocals.wav`,
        instrumental: `/output/${req.file.filename}/${req.file.filename}/accompaniment.wav`,
      });
    });
  } catch (err) {
    console.error("Erro inesperado no upload:", err);
    res.status(500).send("Erro inesperado no upload");
  }
});

// Inicia servidor
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
