# PlayAlong - Backend ⚙️

O backend do **PlayAlong** é responsável por gerenciar o upload de músicas, processar os arquivos de áudio com o **Spleeter** (biblioteca Python) e disponibilizar as faixas separadas (voz e instrumental) para o frontend.

---

## Tecnologias utilizadas

- **Node.js + Express** → Servidor HTTP
- **Multer** → Upload de arquivos
- **Child Process (exec)** → Integração com Python / Spleeter
- **Spleeter (Python)** → Separação de áudio (voz/instrumental)
- **File System (fs)** → Armazenamento e leitura dos arquivos enviados

---

## Estrutura

```
backend/
│
├── server.js   # Servidor principal
├── uploads/    # Arquivos originais enviados
├── output/     # Arquivos processados pelo Spleeter
└── package.json
```

---

## Rotas principais

- **POST `/upload`** → Faz upload de uma música e processa com Spleeter.
- **GET `/tracks`** → Lista as músicas já enviadas (nome + caminhos das faixas).
- **/uploads** → Pasta estática para servir os arquivos originais.
- **/output** → Pasta estática para servir os arquivos processados.

---

## Como executar

1. Instale dependências do backend:

   ```bash
   cd backend
   npm install
   ```

2. Configure e instale o ambiente Python para o Spleeter:

   ```bash
   cd ..
   python -m venv spleeter-env
   spleeter-env/Scripts/activate   # Windows
   pip install spleeter
   ```

3. Inicie o servidor backend:
   ```bash
   cd backend
   node server.js
   ```

O servidor ficará disponível em: **http://localhost:3000**
