
const canvas = document.getElementById("jogo");
const ctx = canvas.getContext("2d");


const TAMANHO = 40; // Tamanho de cada quadrado do mapa, em pixels.
const TOTAL_COLUNAS = 15; // largura do mapa, em quadrados
const TOTAL_LINHAS = 15; // altura do mapa, em quadrados
const FASE_FINAL = 3; // vence quem completar esta fase

// Posições iniciais dos policiais: azul persegue direto, vermelho tenta interceptar, roxo faz emboscada (só na fase 3).
const POLICIAIS_INICIO = [
  { coluna: 13, linha: 1,  cor: "#2563eb" }, // azul: persegue direto
  { coluna: 13, linha: 13, cor: "#dc2626" }, // vermelho: tenta interceptar
  { coluna: 7,  linha: 13, cor: "#7c3aed" }  // roxo (só na fase 3): faz emboscada
];

const FASE_TERCEIRO_POLICIAL = 3; // a partir desta fase entra o 3º policial

// A polícia alterna: persegue por 36 movimentos e depois volta para a delegacia por 12.
const PASSOS_PERSEGUIR = 36;
const PASSOS_PATRULHAR = 12;
const CHAVE_RECORDE = "semsaida_recorde"; // nome usado para guardar o recorde no navegador

// # representa parede; espaço representa corredor.
const MAPA_INICIAL = [
  "###############",
  "#             #",
  "# ### ##### # #",
  "# #       # # #",
  "# # ##### # # #",
  "# # #     #   #",
  "#   # ### ### #",
  "### # #       #",
  "#   # # ##### #",
  "# ### #       #",
  "#     ##### # #",
  "# ###       # #",
  "#   #######   #",
  "#             #",
  "###############"
];

// Mapa da fase 2: corredores mais estreitos e mais bolsas.
const MAPA_FASE_2 = [
  "###############",
  "#             #",
  "# ##### ##### #",
  "#       #     #",
  "# ### # # ### #",
  "# #   #   #   #",
  "# # ##### # # #",
  "#   #     # # #",
  "# # # ##### # #",
  "# #   #       #",
  "# ##### # ### #",
  "#       #   # #",
  "# ### ##### # #",
  "#             #",
  "###############"
];

// Mapa da fase 3: ainda mais curvas e paredes, com 3 policiais.
const MAPA_FASE_3 = [
  "###############",
  "#         #   #",
  "# # # #   # # #",
  "#   #         #",
  "# # ### ##### #",
  "#         #   #",
  "### # ###   ###",
  "#   #         #",
  "# ### # # ### #",
  "#     # #     #",
  "# #   # ###   #",
  "#   #         #",
  "#   #     # # #",
  "#   #     #   #",
  "###############"
];

// Um mapa para cada fase. Se houver mais fases que mapas, a lista recomeça.
const MAPAS = [MAPA_INICIAL, MAPA_FASE_2, MAPA_FASE_3];

// Retorna o mapa da fase atual (ou de uma fase futura, se houver mais fases que mapas).
function mapaDaFase(fase) {
  return MAPAS[(fase - 1) % MAPAS.length];
}

// Cor das paredes de cada fase (fica mais fácil saber em qual fase você está).
const TEMAS_FASE = [
  { nome: "azul",    parede1: "#35598f", parede2: "#172b4d", contorno: "#668dc4", detalhe: "#42628e" },
  { nome: "verde",   parede1: "#2f8f5b", parede2: "#12402a", contorno: "#6ee7a0", detalhe: "#3d9468" },
  { nome: "laranja", parede1: "#c2570c", parede2: "#5a2406", contorno: "#fb923c", detalhe: "#b45f2a" }
];

// Retorna o tema da fase atual (ou de uma fase futura, se houver mais fases que temas).
function temaDaFase(fase) {
  return TEMAS_FASE[(fase - 1) % TEMAS_FASE.length];
}

// Classe Personagem: base para Ladrao e Policial, com posição e verificação de movimento.
class Personagem {
  constructor(coluna, linha) {
    this.coluna = coluna;
    this.linha = linha;
  }

// Verifica se o personagem pode andar para a posição (coluna, linha) no mapa atual.
  podeAndar(coluna, linha) {
    if (
      linha < 0 ||
      linha >= TOTAL_LINHAS ||
      coluna < 0 ||
      coluna >= TOTAL_COLUNAS
    ) {
      return false;
    }

    return jogo.mapa[linha][coluna] !== "#";
  }
}

// Classe Ladrao: herda de Personagem, com direção e desenho específico.
class Ladrao extends Personagem {
  constructor(coluna, linha) {
    super(coluna, linha);
    this.direcao = { dx: 0, dy: 0 }; // para onde o ladrão está olhando
  }

  desenhar() {
    const x = this.coluna * TAMANHO;
    const y = this.linha * TAMANHO;

    // Pernas
    ctx.fillStyle = "#111827";
    ctx.fillRect(x + 12, y + 25, 6, 11);
    ctx.fillRect(x + 23, y + 25, 6, 11);

    // Corpo e braços
    ctx.fillStyle = "#c9da0b";
    ctx.fillRect(x + 10, y + 15, 21, 15);
    ctx.fillRect(x + 4, y + 17, 8, 5);
    ctx.fillRect(x + 29, y + 17, 7, 5);

    // Cabeça
    ctx.fillStyle = "#e8b58a";
    ctx.beginPath();
    ctx.arc(x + 20, y + 12, 9, 0, Math.PI * 2);
    ctx.fill();

    // Gorro e máscara
    ctx.fillStyle = "#111";
    ctx.fillRect(x + 10, y + 3, 20, 7);
    ctx.fillRect(x + 12, y + 12, 16, 5);

    // Olhos (deslocados para o lado em que o ladrão anda)
    ctx.fillStyle = "#fff";
    ctx.fillRect(x + 14 + this.direcao.dx * 2, y + 10 + this.direcao.dy, 3, 3);
    ctx.fillRect(x + 23 + this.direcao.dx * 2, y + 10 + this.direcao.dy, 3, 3);
  }
}

// Classe Policial: herda de Personagem, com cor e desenho específico.
class Policial extends Personagem {
  constructor(coluna, linha, cor) {
    super(coluna, linha);
    this.cor = cor;
    this.passo = 4;
  }

  desenhar() {
    const x = this.coluna * TAMANHO;
    const y = this.linha * TAMANHO;

    // Pernas e botas
    ctx.fillStyle = "#172554";
    ctx.fillRect(x + 12, y + 27, 6, 8);
    ctx.fillRect(x + 23, y + 27, 6, 8);

    ctx.fillStyle = "#111827";
    ctx.fillRect(x + 10, y + 33, 9, 5);
    ctx.fillRect(x + 22, y + 33, 9, 5);

    // Braços do uniforme
    ctx.fillStyle = this.cor;
    ctx.fillRect(x + 5, y + 17, 7, 14);
    ctx.fillRect(x + 29, y + 17, 7, 14);

    ctx.fillStyle = "#e8b58a";
    ctx.fillRect(x + 5, y + 28, 7, 4);
    ctx.fillRect(x + 29, y + 28, 7, 4);

    // Camisa/uniforme
    ctx.fillStyle = this.cor;
    ctx.fillRect(x + 10, y + 14, 21, 16);

    // Cinto e fivela
    ctx.fillStyle = "#172554";
    ctx.fillRect(x + 10, y + 27, 21, 4);

    ctx.fillStyle = "#facc15";
    ctx.fillRect(x + 19, y + 27, 4, 4);

    // Cabeça
    ctx.fillStyle = "#e8b58a";
    ctx.beginPath();
    ctx.arc(x + 20, y + 12, 8, 0, Math.PI * 2);
    ctx.fill();

    // Orelhas
    ctx.fillRect(x + 11, y + 10, 3, 5);
    ctx.fillRect(x + 26, y + 10, 3, 5);

    // Boné policial
    ctx.fillStyle = "#172554";
    ctx.fillRect(x + 10, y + 4, 20, 6);
    ctx.fillRect(x + 7, y + 8, 26, 3);

    // Emblema do boné
    ctx.fillStyle = "#facc15";
    ctx.fillRect(x + 17, y + 5, 6, 3);

    // Olhos e nariz
    ctx.fillStyle = "#111827";
    ctx.fillRect(x + 16, y + 12, 2, 2);
    ctx.fillRect(x + 23, y + 12, 2, 2);
    ctx.fillRect(x + 19, y + 15, 2, 2);

    // Distintivo no peito
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 17);
    ctx.lineTo(x + 19, y + 18);
    ctx.lineTo(x + 18, y + 24);
    ctx.lineTo(x + 14, y + 22);
    ctx.closePath();
    ctx.fill();

    // Bolso e rádio
    ctx.strokeStyle = "#dbeafe";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 23, y + 18, 5, 5);

    ctx.fillStyle = "#111827";
    ctx.fillRect(x + 29, y + 19, 3, 7);
    ctx.fillRect(x + 30, y + 17, 1, 2);
  }
}

// Classe Bolsa: item que dá 100 pontos ao ladrão.
class Bolsa {
  constructor(coluna, linha) {
    this.coluna = coluna;
    this.linha = linha;
    this.coletada = false;
  }

  desenhar() {
    if (this.coletada) return;

    const x = this.coluna * TAMANHO;
    const y = this.linha * TAMANHO;

// Desenho da bolsa de dinheiro
    ctx.fillStyle = "#9a5b2e";
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 13);
    ctx.quadraticCurveTo(x + 5, y + 20, x + 10, y + 31);
    ctx.quadraticCurveTo(x + 20, y + 37, x + 30, y + 31);
    ctx.quadraticCurveTo(x + 35, y + 20, x + 30, y + 13);
    ctx.closePath();
    ctx.fill();

    // Detalhes da bolsa
    ctx.fillStyle = "#d6b477";
    ctx.fillRect(x + 12, y + 10, 16, 5);

    // Desenho do cifrão "$" na bolsa
    ctx.fillStyle = "#facc15";
    ctx.font = "bold 17px Arial";
    ctx.textAlign = "center";
    ctx.fillText("$", x + 20, y + 28);

    // Brilho que pisca (a transparência varia com o tempo)
    const brilho = (Math.sin(Date.now() / 250 + this.coluna * 2 + this.linha) + 1) / 2;
    ctx.globalAlpha = brilho;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + 29, y + 8, 2, 8);
    ctx.fillRect(x + 26, y + 11, 8, 2);
    ctx.globalAlpha = 1; // volta ao normal para não afetar os outros desenhos
  }
}

// Classe Bombinha: item que deixa os policiais desnorteados por 6 segundos.
class Bombinha {
  constructor(coluna, linha) {
    this.coluna = coluna;
    this.linha = linha;
    this.coletada = false;
  }

  desenhar() {
    if (this.coletada) return;

    const x = this.coluna * TAMANHO + 20;
    const y = this.linha * TAMANHO + 22;

    // Corpo da bombinha
    ctx.fillStyle = "#202020";
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();

    // Pavio da bombinha
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 4, y - 7);
    ctx.lineTo(x + 9, y - 13);
    ctx.stroke();

    // Brilho da bombinha
    ctx.fillStyle = "#fb923c";
    ctx.beginPath();
    ctx.arc(x + 10, y - 14, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Classe Bonus: maleta que aparece aleatoriamente no mapa, dando pontos extras.
class Bonus {
  constructor(coluna, linha) {
    this.coluna = coluna;
    this.linha = linha;
    this.ativo = true;
  }

  desenhar() {
    if (!this.ativo) return;

    const x = this.coluna * TAMANHO;
    const y = this.linha * TAMANHO;

    // Maleta de dinheiro
    ctx.fillStyle = "#b45309";
    ctx.fillRect(x + 5, y + 11, 30, 20);

    // Alça da maleta
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(x + 5, y + 7, 30, 6);
    ctx.fillRect(x + 17, y + 15, 6, 9);

    // Cifrão "$" na maleta
    ctx.fillStyle = "#fff7ed";
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.fillText("$", x + 20, y + 25);
  }
}

// Classe Delegacia: desenhada ANTES dos personagens (fica no fundo) e com sirene piscando DEPOIS dos personagens.
class Delegacia {
  constructor(coluna, linha) {
    this.coluna = coluna;
    this.linha = linha;
  }

  // Prédio: desenhado ANTES dos personagens (fica no fundo).
  desenhar() {
    const x = this.coluna * TAMANHO;
    const y = this.linha * TAMANHO;

    // Paredes e telhado
    ctx.fillStyle = "#1e3a8a";
    ctx.fillRect(x + 3, y + 14, 34, 23);
    ctx.fillStyle = "#1d4ed8";
    ctx.fillRect(x + 1, y + 10, 38, 5);

    // Placa "DP" (delegacia de polícia)
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(x + 12, y + 17, 16, 8);
    ctx.fillStyle = "#1e3a8a";
    ctx.font = "bold 8px Arial";
    ctx.textAlign = "center";
    ctx.fillText("DP", x + 20, y + 24);

    // Porta e janelas
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(x + 17, y + 27, 7, 10);
    ctx.fillStyle = "#fde68a";
    ctx.fillRect(x + 6, y + 28, 6, 5);
    ctx.fillRect(x + 29, y + 28, 6, 5);
  }

  // Luz da sirene: desenhada DEPOIS dos personagens, alternando vermelho e azul.
  desenharSirene() {
    const vermelha = Math.floor(Date.now() / 300) % 2 === 0;

    ctx.fillStyle = vermelha ? "#ef4444" : "#3b82f6"; // vermelho ou azul
    ctx.shadowColor = ctx.fillStyle;                      // brilho da sirene
    ctx.shadowBlur = 8;                                  // brilho da sirene
    ctx.beginPath();                                    // desenha a luz da sirene como um círculo
    ctx.arc(this.coluna * TAMANHO + 35, this.linha * TAMANHO + 8, 3.5, 0, Math.PI * 2); // círculo da sirene
    ctx.fill();           // preenche o círculo da sirene
    ctx.shadowBlur = 0;  // desliga o brilho para os próximos desenhos
  }
}

// Classe Jogo: controla o estado do jogo, incluindo o mapa, pontuação, fase, vidas, personagens e lógica de movimentação.
class Jogo {
  constructor() {
    this.mapa = MAPA_INICIAL.map(linha => linha.split("")); // cria uma cópia do mapa inicial
    this.pontuacao = 0;        // pontuação do jogador
    this.fase = 1;             // fase atual do jogo
    this.vidas = 3;            // número de vidas do jogador
    this.tempoBombinha = 0;    // até quando os policiais estão desnorteados
    this.bombinhaRestante = 0; // usado para a pausa não "gastar" a bombinha
    this.jogoAtivo = true;     // true enquanto o jogo está em andamento
    this.pausado = false;      // true quando o jogo está pausado
    this.trocandoFase = false; // trava: impede concluir a mesma fase várias vezes
    this.sirene = 0;           // até quando a tela pisca azul/vermelho
    this.patrulhando = false;  // true quando os policiais estão voltando à delegacia    this.bonus = null;
    this.controle = null;      // usado para o setInterval que move os policiais
    this.ultimaDirecao = { dx: 0, dy: 0 };    // direção do último movimento do ladrão, usada para o policial vermelho tentar interceptar
    this.reiniciarFase();                     // inicializa a fase atual
  }

  // Reinicia a fase atual, reposicionando o ladrão, os policiais, as bolsas e as bombinhas.
  reiniciarFase() {
    this.mapa = mapaDaFase(this.fase).map(linha => linha.split(""));
    this.ladrao = new Ladrao(1, 1);

    this.policiais = POLICIAIS_INICIO.map(
      p => new Policial(p.coluna, p.linha, p.cor)
    );

    this.policiais = [
      new Policial(13, 1, "#2563eb"),
      new Policial(13, 13, "#dc2626")
    ];

    // Fases 1 e 2: 2 policiais. A partir da fase 3: 3 policiais.
    const inicios = POLICIAIS_INICIO.slice(
      0,
      this.fase >= FASE_TERCEIRO_POLICIAL ? 3 : 2
    );

    this.policiais = inicios.map(
      p => new Policial(p.coluna, p.linha, p.cor)
    );

    this.delegacias = inicios.map(p => new Delegacia(p.coluna, p.linha));
    this.patrulhando = false;
    
    this.trocandoFase = false;
    this.bombinhaRestante = 0;
    this.bolsas = [];
    this.bombinhas = [];
    this.bonus = null;
    this.tempoBombinha = 0;
    this.passosPolicia = 0;

    // Coloca objetos somente em corredores livres.
    const lugares = [];

    for (let linha = 1; linha < TOTAL_LINHAS - 1; linha++) {
      for (let coluna = 1; coluna < TOTAL_COLUNAS - 1; coluna++) {
        if (
          this.mapa[linha][coluna] === "#" ||
          (coluna === 1 && linha === 1) ||
          POLICIAIS_INICIO.some(p => p.coluna === coluna && p.linha === linha)
        ) {
          continue;
        }

        lugares.push({ coluna, linha });
      }
    }

    // Distribuição das bolsas e das bombas.
   lugares.forEach((lugar, i) => {
  if (i % 17 === 0) {
    this.bombinhas.push(new Bombinha(lugar.coluna, lugar.linha));
  } else if (i % 3 === 0) { // Receber apenas um dos dois itens
    this.bolsas.push(new Bolsa(lugar.coluna, lugar.linha));
  }
  });

    this.atualizarPlacar();
    this.mensagem("Colete todas as bolsas e fuja dos policiais!");
    this.desenhar();

    
  }
    // Move o ladrão na direção (dx, dy) se possível, atualizando a posição e verificando coletas e colisões.
    moverLadrao(dx, dy) {
    if (!this.jogoAtivo || this.pausado || this.trocandoFase) return;

    const novaColuna = this.ladrao.coluna + dx;
    const novaLinha = this.ladrao.linha + dy;

    if (this.ladrao.podeAndar(novaColuna, novaLinha)) {
      this.ultimaDirecao = { dx, dy };
      this.ladrao.direcao = { dx, dy };

      this.ladrao.coluna = novaColuna;
      this.ladrao.linha = novaLinha;

      this.verificarColetas();
      this.verificarColisao();
      this.desenhar();
    }
  }

  // Verifica se o ladrão coletou bolsas, bombinhas ou bônus, e atualiza a pontuação e o estado do jogo.
  verificarColetas() {
    for (const bolsa of this.bolsas) {
      if (
        !bolsa.coletada &&
        bolsa.coluna === this.ladrao.coluna &&
        bolsa.linha === this.ladrao.linha
      ) {
        bolsa.coletada = true;
        this.pontuacao += 100;
        Musica.efeito("moeda");
      }
    }

    for (const bomba of this.bombinhas) {
      if (
        !bomba.coletada &&
        bomba.coluna === this.ladrao.coluna &&
        bomba.linha === this.ladrao.linha
      ) {
        bomba.coletada = true;
        this.tempoBombinha = Date.now() + 6000;
        Musica.efeito("bomba");

        this.mensagem(
          "Bombinha ativada! Policiais desnorteados por 6 segundos."
        );
      }
    }

    if (
      this.bonus &&
      this.bonus.ativo &&
      this.bonus.coluna === this.ladrao.coluna &&
      this.bonus.linha === this.ladrao.linha
    ) {
      this.bonus.ativo = false;
      this.pontuacao += 500;
      this.mensagem("Maleta coletada: +500 pontos!");
    }

    // Verifica se todas as bolsas foram coletadas para avançar de fase.
    const restantes = this.bolsas.filter(
      bolsa => !bolsa.coletada
    ).length;

        if (restantes === 0 && !this.trocandoFase) {
      this.trocandoFase = true;
      this.pontuacao += 500;

      if (this.fase >= FASE_FINAL) {
        // VITÓRIA: completou a última fase.
        this.jogoAtivo = false;
        Musica.parar();
        const novoRecorde = salvarRecorde(this.pontuacao);
        this.atualizarPlacar();
        this.mensagem("Você escapou com todo o dinheiro!");

        // Mostra a tela de vitória com pontuação final e recorde.
        mostrarTela(
          "Você escapou!",
          `Parabéns, o ladrão fugiu com a grana!\nPontuação final: ${this.pontuacao}\nRecorde: ${lerRecorde()}${novoRecorde ? " (novo recorde!)" : ""}`,
          "Jogar de novo"
        );
      } else {
        this.fase++;
        this.mensagem("Fase concluída! Avançando para a próxima...");
        this.atualizarPlacar();

        setTimeout(() => {
          if (this.jogoAtivo && this.trocandoFase) {
            this.reiniciarFase();
            iniciarMovimentoPolicia(); // recalcula a velocidade da nova fase
          }
        }, 900);
      }
    }

    this.atualizarPlacar();
  }

// NOVA MOVIMENTAÇÃO: policiais perseguem pelo caminho mais curto.
moverPoliciais() {
  if (!this.jogoAtivo || this.pausado || this.trocandoFase) return;

  // Conta os movimentos da polícia para alternar entre perseguir e voltar à delegacia.
  this.passosPolicia++;
  const posicaoNoCiclo = this.passosPolicia % (PASSOS_PERSEGUIR + PASSOS_PATRULHAR);
  const patrulhando = posicaoNoCiclo >= PASSOS_PERSEGUIR;

  if (patrulhando !== this.patrulhando) {
    this.patrulhando = patrulhando;
    this.mensagem(
      patrulhando
        ? "Os policiais estão voltando para a delegacia. Aproveite para pegar bolsas!"
        : "Os policiais voltaram a perseguir você!"
    );
  }
  
  // Se a bombinha estiver ativa, os policiais se movem aleatoriamente.
  const desnorteados = Date.now() < this.tempoBombinha;

  const direcoes = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 }
  ];

  for (let i = 0; i < this.policiais.length; i++) {
    const policial = this.policiais[i];

    // A bombinha faz os policiais se moverem aleatoriamente.
    if (desnorteados) {
      if (Math.random() < 0.7) continue;

      const possiveis = direcoes.filter(d =>
        policial.podeAndar(
          policial.coluna + d.dx,
          policial.linha + d.dy
        )
      );

      if (possiveis.length > 0) {
        const escolha =
          possiveis[Math.floor(Math.random() * possiveis.length)];

        policial.coluna += escolha.dx;
        policial.linha += escolha.dy;
      }

      continue;
    }

    // O policial azul persegue a posição atual do ladrão.
    let alvoColuna = this.ladrao.coluna;
    let alvoLinha = this.ladrao.linha;

    // O policial vermelho tenta interceptar o ladrão.
    if (i === 1) {
      const direcao = this.ultimaDirecao || { dx: 0, dy: 0 };

      const previstaColuna =
        this.ladrao.coluna + direcao.dx;

      const previstaLinha =
        this.ladrao.linha + direcao.dy;

      if (
        policial.podeAndar(previstaColuna, previstaLinha)
      ) {
        alvoColuna = previstaColuna;
        alvoLinha = previstaLinha;
      }
    }
    
    // O policial roxo (3º) faz emboscada: mira até 4 casas à frente do ladrão.
    if (i === 2) {
      const direcao = this.ultimaDirecao || { dx: 0, dy: 0 };

      for (let k = 4; k >= 1; k--) {
        const c = this.ladrao.coluna + direcao.dx * k;
        const l = this.ladrao.linha + direcao.dy * k;

        if (policial.podeAndar(c, l)) {
          alvoColuna = c;
          alvoLinha = l;
          break;
        }
      }
    }

    // Na hora de "recolher", cada policial volta para a sua própria delegacia.
    if (patrulhando) {
      alvoColuna = POLICIAIS_INICIO[i].coluna;
      alvoLinha = POLICIAIS_INICIO[i].linha;
    }

    // Procura o caminho mais curto até o alvo escolhido.
    const encontrarPasso = (destinoColuna, destinoLinha) => {
      const fila = [{
        coluna: policial.coluna,
        linha: policial.linha,
        primeiroPasso: null
      }];

      const visitados = new Set([
        `${policial.coluna},${policial.linha}`
      ]);

      while (fila.length > 0) {
        const atual = fila.shift();

        if (
          atual.coluna === destinoColuna &&
          atual.linha === destinoLinha
        ) {
          return atual.primeiroPasso;
        }

        for (const direcao of direcoes) {
          const coluna = atual.coluna + direcao.dx;
          const linha = atual.linha + direcao.dy;
          const chave = `${coluna},${linha}`;

          if (
            !policial.podeAndar(coluna, linha) ||
            visitados.has(chave)
          ) {
            continue;
          }

          visitados.add(chave);

          fila.push({
            coluna,
            linha,
            primeiroPasso: atual.primeiroPasso || {
              coluna,
              linha
            }
          });
        }
      }

      return null;
    };

    let proximoPasso = encontrarPasso(
      alvoColuna,
      alvoLinha
    );

    // Se não houver caminho para a posição prevista,
    // o policial vermelho tenta perseguir o ladrão diretamente.
    if (
      !proximoPasso &&
      !patrulhando &&
      (alvoColuna !== this.ladrao.coluna ||
       alvoLinha !== this.ladrao.linha)
    ) {
      proximoPasso = encontrarPasso(
        this.ladrao.coluna,
        this.ladrao.linha
      );
    }

    if (proximoPasso) {
      policial.coluna = proximoPasso.coluna;
      policial.linha = proximoPasso.linha;
    }
  }

  this.verificarColisao();
  this.desenhar();
}

// Verifica se algum policial colidiu com o ladrão, reduzindo vidas e reiniciando a fase se necessário.
  verificarColisao() {
    if (Date.now() < this.tempoBombinha) return;

    for (const policial of this.policiais) {
      if (
        policial.coluna === this.ladrao.coluna &&
        policial.linha === this.ladrao.linha
      ) {
        this.vidas--;
        this.sirene = Date.now() + 900; // a tela pisca azul/vermelho
        this.atualizarPlacar();
        Musica.efeito("pego");

        if (this.vidas <= 0) {
          this.jogoAtivo = false;
          Musica.parar();
          const novoRecorde = salvarRecorde(this.pontuacao);
          this.mensagem("Fim de jogo!");

        // Mostra a tela de fim de jogo com pontuação, fase e recorde.
        mostrarTela(
          "Fim de jogo",
          `Você foi preso!\nPontuação: ${this.pontuacao}  •  Fase: ${this.fase}\nRecorde: ${lerRecorde()}${novoRecorde ? " (novo recorde!)" : ""}`,
          "Jogar de novo"
          );
        } else {
          this.mensagem(
            "A polícia pegou você! Cuidado: perdeu uma vida."
          );

          this.ladrao.coluna = 1;
          this.ladrao.linha = 1;

          // Cada policial volta para a sua delegacia.
          this.policiais.forEach((policial, i) => {
            policial.coluna = POLICIAIS_INICIO[i].coluna;
            policial.linha = POLICIAIS_INICIO[i].linha;
          });
        }

        break;
      }
    }
  }

  // Atualiza o placar, vidas, fase e recorde na tela.
  atualizarPlacar() {
    document.getElementById("pontuacao").textContent =
      this.pontuacao;

    document.getElementById("fase").textContent =
    this.fase;

    // NOVO: o número da fase e a borda do jogo usam a cor da fase.
    const tema = temaDaFase(this.fase);
    document.getElementById("fase").style.color = tema.contorno;
    canvas.style.borderColor = tema.contorno;

    document.getElementById("vidas").textContent =
      this.vidas;

    document.getElementById("bolsas").textContent =
      this.bolsas
        ? this.bolsas.filter(b => !b.coletada).length
        : 0;

     // Mostra o maior valor entre o recorde salvo e a pontuação atual.
    document.getElementById("recorde").textContent =
      Math.max(lerRecorde(), this.pontuacao);
  }

  // Exibe uma mensagem temporária na tela, como instruções ou alertas.
  mensagem(texto) {
    document.getElementById("mensagem").textContent = texto;
  }

// Desenha o mapa, as paredes, corredores e detalhes visuais de acordo com a fase atual.
desenharMapa() {
  const tema = temaDaFase(this.fase); // NOVO: cores desta fase

    for (let linha = 0; linha < TOTAL_LINHAS; linha++) {
    for (let coluna = 0; coluna < TOTAL_COLUNAS; coluna++) {
      const x = coluna * TAMANHO;
      const y = linha * TAMANHO;

      if (this.mapa[linha][coluna] === "#") {
        // Sombra da parede
        ctx.fillStyle = "#050816";
        ctx.fillRect(
          x + 2,
          y + 2,
          TAMANHO - 2,
          TAMANHO - 2
        );

        // Degradê azul da parede
        const degradê = ctx.createLinearGradient( //cria transição entre cores
          x,
          y,
          x + TAMANHO,
          y + TAMANHO
        );

        degradê.addColorStop(0, tema.parede1);
        degradê.addColorStop(1, tema.parede2);

        ctx.fillStyle = degradê;
        ctx.fillRect(
          x + 1,
          y + 1,
          TAMANHO - 3,
          TAMANHO - 3
        );

        // Contorno externo
        ctx.strokeStyle = tema.contorno;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          x + 3,
          y + 3,
          TAMANHO - 7,
          TAMANHO - 7
        );

        // Detalhe interno da parede
        ctx.strokeStyle = tema.detalhe;
        ctx.lineWidth = 1;
        ctx.strokeRect(
          x + 7,
          y + 7,
          TAMANHO - 15,
          TAMANHO - 15
        );

      } else {
        // Fundo do corredor
        ctx.fillStyle = "#080d1c";
        ctx.fillRect(x, y, TAMANHO, TAMANHO);

        // Pequeno detalhe no piso
        ctx.fillStyle = "#111c31";
        ctx.fillRect(
          x + 4,
          y + 4,
          TAMANHO - 8,
          1
        );

        // Linhas discretas entre as células
        ctx.strokeStyle = "#172238";
        ctx.lineWidth = 1;
        ctx.strokeRect(
          x,
          y,
          TAMANHO,
          TAMANHO
        );
      }
    }
  }
}


  desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.desenharMapa();

    this.delegacias.forEach(d => d.desenhar());
    this.bolsas.forEach(b => b.desenhar());
    this.bombinhas.forEach(b => b.desenhar());

    if (this.bonus) {
      this.bonus.desenhar();
    }

    this.ladrao.desenhar();
    this.policiais.forEach(p => p.desenhar());
    this.delegacias.forEach(d => d.desenharSirene());

    if (Date.now() < this.tempoBombinha) {
      ctx.fillStyle = "#fde047";
      ctx.font = "bold 13px Arial";
      ctx.textAlign = "left";
      ctx.fillText("BOMBINHA ATIVA!", 8, 18);
    }

    // Quando a polícia pega o ladrão, a tela pisca em vermelho e azul.
    if (Date.now() < this.sirene) {
      const vermelho = Math.floor(Date.now() / 120) % 2 === 0;
      ctx.fillStyle = vermelho ? "rgba(220, 38, 38, 0.3)" : "rgba(37, 99, 235, 0.3)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  // Reinicia o jogo completamente, zerando pontuação, fase, vidas e estado do jogo.
  reiniciarTudo() {
    this.pontuacao = 0;
    this.fase = 1;
    this.vidas = 3;
    this.jogoAtivo = true;
    this.pausado = false;
    this.sirene = 0;

    this.reiniciarFase();
    iniciarMovimentoPolicia(); // NOVO: recalcula a velocidade
  }
}

// Cria a instância do jogo.
const jogo = new Jogo();

 // Controles do ladrão: setas ou teclas WASD.
const teclasPermitidas = [
  "arrowup", "w",
  "arrowdown", "s",
  "arrowleft", "a",
  "arrowright", "d"
];

let teclaAtual = null;
let ultimoMovimento = 0;
const INTERVALO_LADRAO = 120;

document.addEventListener("keydown", function(event) {
  const tecla = event.key.toLowerCase();

  if (teclasPermitidas.includes(tecla)) {
    event.preventDefault();
    teclaAtual = tecla;
  }
});

document.addEventListener("keyup", function(event) {
  const tecla = event.key.toLowerCase();

  if (tecla === teclaAtual) {
    teclaAtual = null;
  }
});

// Impede o movimento de continuar se a janela perder o foco.
window.addEventListener("blur", function() {
  teclaAtual = null;
});

// Controla o movimento em intervalos regulares.
setInterval(function() {
  if (!teclaAtual || !jogo.jogoAtivo) return;

  const agora = performance.now();

  if (agora - ultimoMovimento < INTERVALO_LADRAO) {
    return;
  }

  ultimoMovimento = agora;

  const movimentos = {
    arrowup: [0, -1],
    w: [0, -1],
    arrowdown: [0, 1],
    s: [0, 1],
    arrowleft: [-1, 0],
    a: [-1, 0],
    arrowright: [1, 0],
    d: [1, 0]
  };

  const [dx, dy] = movimentos[teclaAtual];
  jogo.moverLadrao(dx, dy);
}, 16);


// POLICIAIS MAIS RÁPIDOS: um movimento a cada 250 milissegundos.
let temporizadorPolicia;

function iniciarMovimentoPolicia() {
  clearInterval(temporizadorPolicia);

  // A cada fase, os policiais ficam um pouco mais rápidos.
  const intervalo = Math.max(100, 250 - (jogo.fase - 1) * 20);

  temporizadorPolicia = setInterval(() => {
    jogo.moverPoliciais();
  }, intervalo);
}

// Inicia o movimento da polícia quando o jogo começa.
iniciarMovimentoPolicia();
// A maleta aparece em um corredor aleatório por tempo limitado.
setInterval(() => {
  if (!jogo.jogoAtivo || jogo.pausado || (jogo.bonus && jogo.bonus.ativo)) {
  return;
  }

  const livres = [];

  for (let linha = 1; linha < TOTAL_LINHAS - 1; linha++) {
    for (let coluna = 1; coluna < TOTAL_COLUNAS - 1; coluna++) {
      if (
        jogo.mapa[linha][coluna] !== "#" &&
        !(jogo.ladrao.coluna === coluna &&
          jogo.ladrao.linha === linha)
      ) {
        livres.push({ coluna, linha });
      }
    }
  }

  if (livres.length === 0) return;

  const lugar = livres[Math.floor(Math.random() * livres.length)];

  jogo.bonus = new Bonus(lugar.coluna, lugar.linha);
  jogo.mensagem("Uma maleta apareceu! Colete-a para ganhar 500 pontos.");
  jogo.desenhar();

// A maleta desaparece após 7 segundos.
  setTimeout(() => {
    if (jogo.bonus) {
      jogo.bonus.ativo = false;
      jogo.desenhar();
    }
  }, 7000);
}, 15000);

// ===== TELAS DE INÍCIO, VITÓRIA E DERROTA =====
function mostrarTela(titulo, texto, textoBotao) {
  document.getElementById("telaTitulo").textContent = titulo;
  document.getElementById("telaTexto").textContent = texto;

// O botão de ação muda de acordo com o estado do jogo (início, vitória ou derrota).
  const botao = document.getElementById("telaBotao");
  botao.textContent = textoBotao;

// Mostra a tela e foca no botão para que o jogador possa apertar Enter ou espaço.
  document.getElementById("tela").classList.remove("oculta");
  botao.focus(); // Enter ou espaço também iniciam
}

// Esconde a tela de início, vitória ou derrota.
function esconderTela() {
  document.getElementById("tela").classList.add("oculta");
}

// O botão de ação da tela de início, vitória ou derrota inicia ou retoma o jogo.
document.getElementById("telaBotao").addEventListener("click", function() {
  if (jogo.pausado) {
    retomarJogo();
  } else {
    iniciarPartida();
  }
});

// Ao abrir a página, o jogo fica parado esperando o jogador clicar em Jogar.
jogo.jogoAtivo = false;
jogo.mensagem("Clique em Jogar para começar.");

// ===== INÍCIO DA PARTIDA E PAUSA =====
function iniciarPartida() {
  jogo.reiniciarTudo();
  esconderTela();
  Musica.iniciar(); // o navegador só libera som depois de um clique: por isso começa aqui
}

// Alterna entre pausar e retomar o jogo quando o jogador aperta P ou clica em Continuar.
function alternarPausa() {
  if (!jogo.jogoAtivo) return; // sem partida em andamento (tela de início ou de fim)

  if (!jogo.pausado) {
    jogo.pausado = true;
    jogo.bombinhaRestante = Math.max(0, jogo.tempoBombinha - Date.now());
    teclaAtual = null;
    Musica.parar();
    mostrarTela("Pausado", "Aperte P ou clique em Continuar.", "Continuar");
  } else {
    retomarJogo();
  }
}

// Retoma o jogo após a pausa, restaurando o tempo da bombinha e escondendo a tela de pausa.
function retomarJogo() {
  jogo.pausado = false;
  jogo.tempoBombinha = Date.now() + jogo.bombinhaRestante; // devolve o tempo da bombinha
  esconderTela();
  Musica.iniciar();
}

document.addEventListener("keydown", function(event) {
  if (event.key.toLowerCase() === "p" && !event.repeat) {
    alternarPausa();
  }
});

// ===== RECORDE (salvo no navegador com localStorage) =====
function lerRecorde() {
  try {
    return Number(localStorage.getItem(CHAVE_RECORDE)) || 0;
  } catch (erro) {
    return 0; // se o navegador bloquear o armazenamento, o jogo continua normal
  }
}

//===== SALVAR NOVO RECORDE =====
function salvarRecorde(pontos) {
  if (pontos <= lerRecorde()) return false;

  try {
    localStorage.setItem(CHAVE_RECORDE, String(pontos));
  } catch (erro) {
    return false;
  }

  return true;
}

// ===== MÚSICA E EFEITOS SONOROS (gerados pelo navegador, sem arquivo mp3) =====
const Musica = {
  audio: null,       // o "estúdio" de áudio do navegador (Web Audio API)
  ligada: true,      // botão de som
  tocando: false,    // true quando a música de fundo está tocando
  volume: 0.05,      // volume da música de fundo
  volumeEfeito: 0.08, // volume dos efeitos sonoros
  tipoOnda: "square", // tipo de onda da música de fundo
  timer: null,
  passo: 0,
  duracaoPasso: 170, // milissegundos por nota

  // Frequências em Hz (0 = silêncio). 4 compassos de 8 notas.
  melodia: [
    440, 0, 523, 0, 659, 0, 523, 440,
    349, 0, 440, 0, 523, 0, 440, 349,
    392, 0, 494, 0, 587, 0, 494, 392,
    330, 0, 415, 0, 494, 0, 415, 330
  ],
  baixo: [110, 87.31, 98, 82.41], // uma nota de baixo por compasso

  // Toca uma nota com a frequência, tipo de onda, duração e volume especificados.
  tocarNota(frequencia, tipo, duracao, volume) {
    const agora = this.audio.currentTime;
    const oscilador = this.audio.createOscillator();
    const ganho = this.audio.createGain();

  // Configura o oscilador e o ganho para tocar a nota desejada.
    oscilador.type = tipo;
    oscilador.frequency.value = frequencia;
    ganho.gain.setValueAtTime(volume, agora);
    ganho.gain.exponentialRampToValueAtTime(0.0001, agora + duracao); // som vai sumindo

    oscilador.connect(ganho);
    ganho.connect(this.audio.destination);
    oscilador.start(agora);
    oscilador.stop(agora + duracao);
  },

  // Toca a próxima nota da melodia e do baixo, se houver.
  proximoPasso() {
    const nota = this.melodia[this.passo % this.melodia.length];
    if (nota) this.tocarNota(nota, "square", 0.22, 0.04);

    if (this.passo % 2 === 0) {
      const compasso = Math.floor(this.passo / 8) % this.baixo.length;
      this.tocarNota(this.baixo[compasso], "triangle", 0.3, 0.09);
    }

    this.passo++;
  },

  iniciar() {
    if (!this.ligada || this.tocando) return;

    try {
      if (!this.audio) {
        this.audio = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audio.state === "suspended") this.audio.resume();
    } catch (erro) {
      return; // sem suporte a áudio: o jogo funciona sem som
    }

    this.tocando = true;
    this.timer = setInterval(() => this.proximoPasso(), this.duracaoPasso);
  },

  parar() {
    clearInterval(this.timer);
    this.tocando = false;
  },

  alternar() {
    this.ligada = !this.ligada;

    if (this.ligada) {
      if (jogo.jogoAtivo && !jogo.pausado) this.iniciar();
    } else {
      this.parar();
    }

    return this.ligada;
  },

  // Efeitos curtos: "moeda", "bomba" e "pego".
  efeito(tipo) {
    if (!this.ligada || !this.audio) return;

    if (tipo === "moeda") {
      this.tocarNota(988, "square", 0.08, 0.05);
      setTimeout(() => this.tocarNota(1319, "square", 0.12, 0.05), 70);
    } else if (tipo === "bomba") {
      this.tocarNota(120, "sawtooth", 0.35, 0.12);
    } else if (tipo === "pego") {
      this.tocarNota(392, "sawtooth", 0.15, 0.08);
      setTimeout(() => this.tocarNota(294, "sawtooth", 0.15, 0.08), 150);
      setTimeout(() => this.tocarNota(196, "sawtooth", 0.3, 0.08), 300);
    }
  }
};

// Botão de som: alterna entre ligado e desligado.
document.getElementById("somBotao").addEventListener("click", function() {
  const ligada = Musica.alternar();
  this.textContent = ligada ? "🔊 Som: ligado" : "🔇 Som: desligado";
  this.blur();
});

// Redesenha o jogo 10 vezes por segundo: é isso que anima o brilho das bolsas,
// as sirenes das delegacias e o pisca-pisca da tela.
setInterval(() => jogo.desenhar(), 100);
