# Karaokê Online Inteligente 🎤

Este projeto é um **Karaokê Online** que permite enviar arquivos de áudio ou vídeo e separar automaticamente a voz e a base instrumental utilizando o [Spleeter](https://github.com/deezer/spleeter). É feito com **Node.js** no backend e um frontend simples em HTML/JS.

---

## Funcionalidades

- Upload de arquivos de áudio ou vídeo (`.mp3`, `.wav`, etc.)
- Separação automática de stems (voz e instrumental) usando Spleeter.
- Reprodução das faixas:
  - **Original**
  - **Só Voz**
  - **Só Instrumental**
- Interface web simples com player de áudio integrado.

---

## Estrutura do projeto

karaoke_online/
│
├── backend/
│ ├── server.js # Backend Node.js
│ ├── uploads/ # Uploads temporários de usuários
│ ├── output/ # Arquivos processados pelo Spleeter
│ └── pretrained_models/ # (Ignorada pelo Git)
│
├── frontend/
│ ├── index.html
│ └── script.js
│
├── spleeter-env/ # Virtual environment Python com Spleeter instalado
├── .gitignore
└── README.md


---

## Pré-requisitos

- [Node.js](https://nodejs.org/) >= 14
- [Python](https://www.python.org/) >= 3.8
- [Spleeter](https://github.com/deezer/spleeter)
- Sistema operacional Windows (adaptar caminhos se for Linux/Mac)

---

## Instalação

1. Clone o repositório:

```bash
git clone [<URL_DO_REPO>](https://github.com/infingardi/karaoke_online.git)
cd karaoke_online
```
2. Crie e ative o ambiente virtual Python:

```bash
python -m venv spleeter-env
# Windows
spleeter-env\Scripts\activate
# Linux/Mac
# source spleeter-env/bin/activate
```

3. Instale Spleeter e dependências Python:

```bash
pip install --upgrade pip
pip install spleeter
```

4. Instale dependências Node.js:
```bash
cd backend
npm install express multer
```

## Rodando o projeto

1. Ative o venv Python:

```bash
cd ..
spleeter-env\Scripts\activate  # Windows
# source spleeter-env/bin/activate  # Linux/Mac
```

2. Inicie o backend:

```bash
cd backend
node server.js
```
3. Abra o navegador e acesse:

http://localhost:3000

