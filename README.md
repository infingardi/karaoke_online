# PlayAlong 🎶

O **PlayAlong** é um sistema que permite separar automaticamente a **voz** do **instrumental** de músicas.  
Ele foi pensado para **cantores** e **instrumentistas** que desejam praticar suas habilidades utilizando apenas a parte que desejam ouvir — seja acompanhando o instrumental ou ensaiando com a voz original.

## Funcionalidades principais

- Upload de arquivos de áudio (`.mp3`, `.wav`, etc.)
- Separação automática em:
  - **Voz**
  - **Instrumental**
- Player integrado com:
  - Controle de volume por faixa
  - Controle de playback e andamento
  - Barra de progresso interativa
  - Visualização em **waveform**
- Histórico de músicas enviadas, podendo reutilizar arquivos anteriores.

## Tecnologias utilizadas

- **Backend:** Node.js, Express, Multer, Python, Spleeter
- **Frontend:** HTML, CSS, JavaScript (DOM APIs, Canvas, Web Audio API)

## Documentação detalhada

- [📌 Documentação do Backend](./backend/README_BACKEND.md)
- [🎨 Documentação do Frontend](./frontend/README_FRONTEND.md)

## Estrutura do projeto

```
PlayAlong/
│
├── backend/
│ ├── server.js # Backend Node.js
│ ├── uploads/ # Uploads temporários de usuários
│ ├── output/ # Arquivos processados pelo Spleeter
│ └── pretrained_models/ # (Ignorada pelo Git)
│
├── frontend/
│ ├── index.html
│ ├── javascript/ # Scripts JS
│ ├── styles/ # Arquivos de estilo CSS
│
├── spleeter-env/ # Virtual environment Python com Spleeter instalado
├── .gitignore
└── README.md
```

## Pré-requisitos

- [Node.js](https://nodejs.org/) >= 14
- [Python](https://www.python.org/) >= 3.8
- [Spleeter](https://github.com/deezer/spleeter)
- Sistema operacional Windows (adaptar caminhos se for Linux/Mac)

## Instalação

1. Clone o repositório:

```bash
git clone [<URL_DO_REPO>]
cd PlayAlong
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
