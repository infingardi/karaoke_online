const express = require("express");
const multer = require("multer");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Caminho do Python do venv
const pythonPath = path.join(__dirname, "..", "spleeter-env", "Scripts", "python.exe");

// Configura upload
const upload = multer({ dest: "uploads/" });

// Servir frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Servir pastas públicas
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/output", express.static(path.join(__dirname, "output")));

// --- Upload de arquivo ---
app.post("/upload", upload.single("file"), (req, res) => {
  try {
    const ext = path.extname(req.file.originalname);
    const inputPath = path.join(__dirname, "uploads", req.file.filename + ext);

    fs.renameSync(req.file.path, inputPath);

    const outputDir = path.join(__dirname, "output", req.file.filename);
    fs.mkdirSync(outputDir, { recursive: true });

    // Cria name.txt com o nome original
    const namePath = path.join(outputDir, "name.txt");
    fs.writeFileSync(namePath, req.file.originalname);

    const command = `"${pythonPath}" -m spleeter separate -p spleeter:2stems -o "${outputDir}" "${inputPath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Erro ao processar áudio:", error.message);
        return res.status(500).send("Erro ao processar áudio");
      }

      const outputSubDir = path.join(outputDir, req.file.filename);
      const vocalsPath = path.join(outputSubDir, "vocals.wav");
      const instrumentalPath = path.join(outputSubDir, "accompaniment.wav");

      if (!fs.existsSync(vocalsPath) || !fs.existsSync(instrumentalPath)) {
        return res.status(500).send("Erro: arquivos processados não encontrados");
      }

      res.json({
        original: "/uploads/" + req.file.filename + ext,
        vocals: `/output/${req.file.filename}/${req.file.filename}/vocals.wav`,
        instrumental: `/output/${req.file.filename}/${req.file.filename}/accompaniment.wav`,
        name: req.file.originalname
      });
    });
  } catch (err) {
    console.error("Erro inesperado no upload:", err);
    res.status(500).send("Erro inesperado no upload");
  }
});

// --- Rota para listar tracks ---
app.get("/tracks", (req, res) => {
  try {
    const outputDir = path.join(__dirname, "output");
    if (!fs.existsSync(outputDir)) return res.json([]);

    const folders = fs.readdirSync(outputDir).filter(f => {
      const fullPath = path.join(outputDir, f);
      return fs.statSync(fullPath).isDirectory();
    });

    const tracks = folders.map(folder => {
      const folderPath = path.join(outputDir, folder);

      // Lê name.txt para pegar o nome original
      const namePath = path.join(folderPath, "name.txt");
      let name = folder; // fallback
      if (fs.existsSync(namePath)) {
        name = fs.readFileSync(namePath, "utf-8");
      }

      const original = `/uploads/${folder}${path.extname(name)}`;
      const vocals = `/output/${folder}/${folder}/vocals.wav`;
      const instrumental = `/output/${folder}/${folder}/accompaniment.wav`;

      return { name, original, vocals, instrumental };
    });

    res.json(tracks);
  } catch (err) {
    console.error("Erro ao listar tracks:", err);
    res.status(500).send("Erro ao listar tracks");
  }
});

// Inicia servidor
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
