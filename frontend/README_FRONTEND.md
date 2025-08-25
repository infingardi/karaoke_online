# PlayAlong - Frontend 🎨

O frontend do **PlayAlong** é responsável pela interface web que permite ao usuário enviar músicas, visualizar a separação em tempo real e interagir com o player.

---

## Tecnologias utilizadas

- **HTML5** → Estrutura da aplicação
- **CSS3** → Estilização responsiva e suporte a tema claro/escuro
- **JavaScript (ES6+)** → Lógica da aplicação
- **Canvas API** → Renderização da forma de onda (waveform)
- **Web Audio API** → Controle de áudio no navegador

---

## Estrutura

```
frontend/
│
├── index.html       # Estrutura principal da aplicação
├── styles.css       # Estilos da aplicação
├── Player.js        # Classe responsável pela lógica de áudio
├── UI.js            # Classe responsável pela interface do usuário
└── api.js           # Comunicação com o backend
```

---

## Funcionalidades

- Upload de músicas (arrastar/soltar ou seleção manual)
- Visualização e seleção de músicas já enviadas
- Player interativo com:
  - Play / Pause / Stop
  - Controle de volume master
  - Controle individual de cada faixa (voz/instrumental)
  - Controle de playback rate (velocidade)
  - Barra de progresso sincronizada
  - Exibição do tempo atual e tempo total
- **Waveform dinâmica** exibida em tempo real
- **Tema claro/escuro** com botão de toggle

---

## Como executar

Basta abrir o arquivo `index.html` em um navegador.  
Certifique-se de que o backend está rodando em **http://localhost:3000**.

---

## Observação

O frontend depende do backend para funcionar corretamente, já que é o servidor que processa as músicas com o **Spleeter**.
