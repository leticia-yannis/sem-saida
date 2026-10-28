# Sem Saída

Jogo estilo Pac-Man feito só com **HTML, CSS e JavaScript (Canvas)**. Você é um ladrão que precisa coletar todos os sacos de dinheiro do labirinto e fugir da polícia por 3 fases.

Projeto desenvolvido para a disciplina de **Aplicações Front-End**.

## Jogar online

https://leticia-yannis.github.io/sem-saida/

## Como jogar

| Controle | Ação |
|---|---|
| Setas ou **W A S D** | Mover o ladrão |
| **P** | Pausar e continuar |
| Botão **Som** | Liga e desliga música e efeitos |

**Objetivo:** coletar todas as bolsas de dinheiro de cada fase sem perder as 3 vidas. Quem completa a fase 3 vence.

## Regras

- Cada bolsa vale **100 pontos**; completar uma fase dá **+500**.
- A **maleta** aparece de tempos em tempos (some em 7 segundos) e vale **+500**.
- A **bombinha** deixa os policiais desnorteados por **6 segundos** e o ladrão fica invulnerável.
- Se um policial encostar no ladrão, você perde uma vida. Com 0 vidas, é fim de jogo.
- O **recorde** fica salvo no navegador.

## Fases

| Fase | Cor | Policiais |
|---|---|---|
| 1 | Azul | 2 |
| 2 | Verde | 2 |
| 3 | Laranja | 3 |

Cada fase tem um labirinto diferente e os policiais ficam um pouco mais rápidos a cada fase.

## Os policiais

- **Azul:** persegue o ladrão pelo caminho mais curto (busca em largura, BFS).
- **Vermelho:** tenta interceptar, mirando a casa à frente do ladrão.
- **Roxo (fase 3):** faz emboscada, mirando até 4 casas à frente.
- A polícia **persegue por um tempo e depois volta para as delegacias**, dando uma chance ao jogador.

## Tecnologias

- **HTML5**: estrutura da página e o elemento `<canvas>`
- **CSS3**: layout, cores e a camada das telas de início, pausa, vitória e derrota
- **JavaScript (ES6)**: lógica do jogo, desenho no Canvas, classes, eventos e temporizadores
- **Web Audio API**: música de fundo e efeitos sonoros gerados por código (sem arquivos de áudio)
- **localStorage**: guarda o recorde

## Conceitos aplicados

Canvas 2D, classes e herança, matriz para representar o labirinto, busca em largura (BFS) para a perseguição, eventos de teclado, `setInterval` e `setTimeout`, detecção de colisão e `localStorage`.

## Estrutura do projeto

```
sem-saida/
├── index.html
├── jogoSemSaida.css
├── jogoSemSaida.js
└── README.md
```

## Como executar no computador

1. Baixe ou clone este repositório.
2. Abra o arquivo `index.html` no navegador. Não precisa instalar nada.

## Inspiração

O jogo se inspira no clássico **Pac-Man**, com outro tema: ladrão no lugar do herói, policiais no lugar dos fantasmas, sacos de dinheiro no lugar dos pontinhos e delegacias onde os policiais começam e voltam.

## Autor

Letícia Yannis Ribeiro Gomes