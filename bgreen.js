// -------------------------
// Blockchain Green - Futurista & Minimalista 2.0
// -------------------------

// Estados do jogo
let gameState = "intro"; // "intro" ou "play"

// Configurações globais
let blocks = [];           // Array de blocos (a blockchain)
let numBlocks = 5;        // Sempre 5 blocos
let blockWidth;     // Será calculado baseado na viewport
let blockHeight;    // Será calculado baseado no blockWidth
let selectedBlock = null; // Bloco atualmente selecionado
let swapDuration = 20;    // Duração da animação de troca (frames)
let phase = 1;            // Fase atual
let nextPhaseDelay = 2000; // Delay para próxima fase
let nextPhaseTime = 0;    // Timestamp para transição
let solvedAlready = false; // Flag para efeitos
let showInstructions = true; // Controle do modal de instruções

// No início do arquivo, adicione estas variáveis
let viewportWidth;  // Será calculado baseado na tela
let viewportOffset = 0;   // Deslocamento para animação de scroll

// Adicione estas variáveis globais
let gameTimer = 30; // 30 segundos
let lastTimeCheck = 0;
let gameOver = false;
let glitchIntensityGlobal = 0;

// Adicione esta variável global no início do arquivo
let logoImage;

// Adicione esta variável global no início do arquivo
let hashFontSize;

// Modifique as variáveis globais
let blockStates = []; // Array para controlar estados especiais dos blocos

// Adicione esta variável global no início do arquivo
let gameOverSound;

// Adicione estas variáveis globais
let matrixChars = [];
const MATRIX_CHARS_COUNT = 50;

// Adicione esta variável global no início do arquivo
let matrixVideo;

// Adicione estas variáveis globais
let logoX, logoY, logoWidth, logoHeight;

// Adicione estas variáveis globais
let gameAreaWidth;
let gameAreaHeight;
let gameAreaX;
let gameAreaY;

// Adicione esta variável global no início do arquivo
let verificationEffect = {
  active: false,
  startTime: 0,
  duration: 1000 // 1 segundo de duração total
};

// Adicione esta variável global no início do arquivo
let helpButton;

// Adicione esta variável global no início do arquivo
let exampleButton;

// Adicione esta classe para controlar as "gotas" do efeito matrix
class MatrixChar {
  constructor() {
    this.reset();
    this.y = random(-1000, 0); // Começa fora da tela em posições diferentes
  }
  
  reset() {
    this.x = random(width);
    this.y = -50;
    this.speed = random(2, 5);
    this.value = random(cryptoWords);
    this.opacity = random(40, 100);
  }
  
  update() {
    this.y += this.speed;
    if (this.y > height) {
      this.reset();
    }
  }
  
  draw() {
    fill(0, 255, 0, this.opacity);
    noStroke();
    textSize(12);
    textAlign(CENTER, CENTER);
    text(this.value, this.x, this.y);
  }
}

// Array de palavras relacionadas à blockchain
const cryptoWords = [
  "BLOCKCHAIN",
  "CRYPTO",
  "HASH",
  "BLOCK",
  "NODE",
  "MINING",
  "TOKEN",
  "LEDGER",
  "GENESIS",
  "CHAIN",
  "VERIFY",
  "PROOF",
  "SMART",
  "CONTRACT",
  "WALLET",
  "KEY",
  "SECURE",
  "DECRYPT",
  "ENCRYPT",
  "PEER"
];

// Mova todas as definições de classe para o início do arquivo
class Block {
  constructor(order, hash, prevHash) {
    this.order = order;         // Ordem correta (solução)
    this.hash = hash;           // Hash do bloco (4 dígitos hex)
    this.prevHash = prevHash;   // Hash do bloco anterior (ou "GEN")
    
    // Propriedades de posição e animação
    this.x = 0;
    this.y = 0;
    this.startX = 0;
    this.startY = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.animProgress = 1;      // 1 = sem animação
    
    // Para efeito de transição pixelada
    this.pixelTransition = 0;   // 0 a 1, onde 1 é completo
    this.isSelected = false;    // Realça se selecionado
    this.isHighlighted = false; // Adicione esta linha
    this.isEdgeBlock = false; // Nova propriedade para identificar blocos das extremidades
    this.glitchIntensity = 0; // Intensidade do efeito glitch
    this.noiseIntensity = 0; // Adicione esta propriedade
  }
  
  update() {
    if (this.animProgress < 1) {
      this.animProgress += 1 / swapDuration;
      if (this.animProgress > 1) this.animProgress = 1;
      this.x = lerp(this.startX, this.targetX, this.animProgress);
      this.y = lerp(this.startY, this.targetY, this.animProgress);
      // Atualiza efeito de transição pixelada (um breve "mosaico" ao final da animação)
      this.pixelTransition = 1 - pow(1 - this.animProgress, 3);
    }
  }
  
  draw() {
    let state = blockStates[blocks.indexOf(this)];
    
    push();
    translate(this.x, this.y);
    
    // Ajusta a opacidade baseada no estado de visibilidade
    let baseAlpha = state.isVisible ? 255 : 100;
    
    // Sombra
    noStroke();
    fill(0, 50);
    rect(5, 5, blockWidth, blockHeight);
    
    // Gradiente de fundo com efeito glitch
    let correctPosition = isBlockCorrect(this, blocks.indexOf(this));
    for (let i = 0; i < blockHeight; i++) {
      let inter = map(i, 0, blockHeight, 0, 1);
      let baseColor = correctPosition ? color(0, 180, 0) : color(0, 100, 0);
      let highlightColor = correctPosition ? color(0, 255, 0) : color(0, 200, 0);
      let col = lerpColor(baseColor, highlightColor, inter);
      
      // Adiciona ruído ao gradiente se necessário
      if (state.noiseLevel > 0) {
        let noise = random(-30, 30) * state.noiseLevel;
        col = color(
          constrain(red(col), 0, 255),
          constrain(green(col) + noise, 0, 255),
          constrain(blue(col), 0, 255)
        );
      }
      
      stroke(col);
      line(0, i, blockWidth, i);
    }
    
    // Borda
    if (this.isHighlighted) {
      let pulseIntensity = map(sin(frameCount * 0.2), -1, 1, 100, 255);
      stroke(0, pulseIntensity, 0);
      strokeWeight(4);
    } else if (this.isSelected) {
      stroke(255);
      strokeWeight(4);
    } else {
      stroke(0, 200, 0);
      strokeWeight(2);
    }
    noFill();
    rect(0, 0, blockWidth, blockHeight);
    
    // Texto dos hashes com melhor formatação
    noStroke();
    fill(240, baseAlpha);
    textSize(hashFontSize);
    textAlign(CENTER, CENTER);
    
    // Posiciona os hashes com mais espaço entre eles
    let prevHashY = blockHeight * 0.35;
    let hashY = blockHeight * 0.65;
    
    let prevHashText = this.formatHash(this.prevHash);
    let hashText = this.formatHash(this.hash);
    
    if (state.noiseLevel > 0) {
      let offset = random(-3, 3) * state.noiseLevel;
      text(prevHashText, blockWidth / 2 + offset, prevHashY);
      text(hashText, blockWidth / 2 + offset, hashY);
    } else {
      text(prevHashText, blockWidth / 2, prevHashY);
      text(hashText, blockWidth / 2, hashY);
    }
    
    pop();
  }
  
  formatHash(hash) {
    // Mantém o hash em uma linha, mas aumenta o espaçamento entre caracteres
    return hash.split('').join(' ');
  }
  
  contains(mx, my) {
    // Simplifica a verificação de clique para permitir selecionar qualquer bloco
    return mx > this.x && 
           mx < this.x + blockWidth && 
           my > this.y && 
           my < this.y + blockHeight;
  }
}

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-3, 3);
    this.vy = random(-5, -1);
    this.alpha = 255;
    this.size = random(4, 8);
    this.angle = random(360);
    this.angularSpeed = random(-5, 5);
    this.col = color(0, random(180, 255), random(50, 150));
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.15;
    this.angle += this.angularSpeed;
    this.alpha -= 4;
  }
  
  draw() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    noStroke();
    fill(red(this.col), green(this.col), blue(this.col), this.alpha);
    rectMode(CENTER);
    rect(0, 0, this.size, this.size);
    pop();
  }
}

class GlitchSquare {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.life = 30;
    this.alpha = 255;
  }
  
  update() {
    this.life--;
    this.alpha = map(this.life, 30, 0, 255, 0);
  }
  
  draw() {
    noStroke();
    fill(0, 255, 0, this.alpha);
    rect(this.x, this.y, this.size, this.size);
  }
}

// Partículas (confetti) – agora em forma de quadrados
let particles = [];

// Efeitos de glitch (detalhes quadrados piscantes)
let glitches = [];

// Controle de pontuação (high score salvo no localStorage)
let highScore = 0;

// No início do arquivo, apenas declare as variáveis
let modal;
let closeButton;

function calculateDimensions() {
  // Define a área do jogo como um quadrado no centro
  gameAreaWidth = min(windowWidth * 0.7, windowHeight * 0.7); // 70% da menor dimensão
  gameAreaHeight = gameAreaWidth;
  
  // Centraliza a área do jogo
  gameAreaX = (windowWidth - gameAreaWidth) / 2;
  gameAreaY = (windowHeight - gameAreaHeight) / 2;
  
  // Calcula o tamanho dos blocos baseado no espaço disponível
  let minSpacing = 10;
  let totalSpacing = (numBlocks - 1) * minSpacing;
  let availableWidth = gameAreaWidth * 0.8; // 80% da largura da área do jogo
  
  // Calcula o tamanho ideal do bloco
  blockWidth = min(availableWidth / numBlocks, 150);
  blockHeight = blockWidth * 1.3;
  
  // Ajusta o tamanho da fonte baseado no tamanho do bloco
  hashFontSize = min(blockWidth * 0.2, 24);
  
  // Atualiza a posição do logo
  logoWidth = gameAreaWidth * 0.4;
  logoHeight = logoWidth * (logoImage.height / logoImage.width);
  logoX = gameAreaX + (gameAreaWidth - logoWidth) / 2;
  logoY = gameAreaY + gameAreaHeight * 0.1;
}

function preload() {
  logoImage = loadImage('assets/logo01.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  rectMode(CORNER);
  angleMode(DEGREES);
  
  // Inicializa com 5 blocos
  numBlocks = 5;
  
  calculateDimensions();
  
  // Inicializa os estados dos blocos
  blockStates = Array(numBlocks).fill({ isVisible: true, noiseLevel: 0 });
  
  // Inicializa o modal
  modal = document.getElementById("instructionsModal");
  closeButton = document.querySelector(".close-button");
  
  if (modal && closeButton) {
    modal.style.display = "block";
    
    closeButton.onclick = function() {
      modal.style.display = "none";
    }
    
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    }
  }

  // Carrega high score, se existir
  if (localStorage.getItem("blockchainGreenHighScore")) {
    highScore = parseInt(localStorage.getItem("blockchainGreenHighScore"));
  }
  
  // Gera a cadeia inicial
  generateChain(numBlocks);
  scrambleBlocks();
  
  // Inicializa os caracteres do efeito matrix
  for (let i = 0; i < MATRIX_CHARS_COUNT; i++) {
    matrixChars.push(new MatrixChar());
  }

  // Inicializa o botão de ajuda
  helpButton = document.getElementById("helpButton");
  if (helpButton) {
    helpButton.onclick = function() {
      modal.style.display = "block";
    }
  }

  // Inicializa o botão de exemplo
  exampleButton = document.getElementById("exampleButton");
  if (exampleButton) {
    exampleButton.onclick = function() {
      showExampleModal();
    }
  }
}

function draw() {
  background(0);
  drawSquarePattern();
  
  if (gameOver) {
    drawGameOver();
  } else {
    // Atualiza o timer
    if (millis() - lastTimeCheck >= 1000) {
      gameTimer--;
      lastTimeCheck = millis();
      
      if (gameTimer <= 0) {
        if (!gameOver) {
          gameOver = true;
          matrixVideo.play();
        }
        drawGameOver();
        return;
      }
    }
    
    push();
    // Desenha a borda da área do jogo
    noFill();
    stroke(0, 255, 0, 30);
    strokeWeight(2);
    rect(gameAreaX, gameAreaY, gameAreaWidth, gameAreaHeight);
    pop();
    
    // Desenha o jogo
    drawGame();
    drawTimer();
  }
}

function drawInstructions() {
  // Desenha o modal de instruções
  push();
  fill(0, 150);
  rect(0, 0, width, height);
  
  // Título
  textAlign(CENTER, CENTER);
  textSize(36);
  fill(0, 255, 0);
  text("BLOCKCHAIN GREEN", width/2, height/3);
  
  // Instruções
  textSize(20);
  fill(255);
  let instructions = [
    "Como Jogar:",
    "• Organize os blocos para formar uma cadeia válida",
    "• Cada bloco deve se conectar ao anterior através do hash",
    "• Clique em dois blocos para trocá-los de posição",
    "• Use o botão 'Reset' para embaralhar os blocos",
    "• Use o botão 'Solve' para ver a solução",
    "",
    "Clique em qualquer lugar para começar"
  ];
  
  for(let i = 0; i < instructions.length; i++) {
    text(instructions[i], width/2, height/2 + (i * 30));
  }
  pop();
}

function drawGame() {
  drawSquarePattern();
  
  // Modo de jogo "play":
  drawTitle();
  drawLevelIndicator();
  drawHighScore();
  
  // Atualiza e desenha cada bloco
  for (let block of blocks) {
    block.update();
    block.draw();
  }
  
  // Desenha as ligações da blockchain
  drawChainLinks();
  
  // Desenha os botões
  drawResetButton();
  drawSolveButton();
  drawShareButton();
  drawNextMoveButton();
  
  // Verifica se a cadeia está correta
  if (isChainSolved()) {
    // Passa para a próxima fase imediatamente
    phase++;
    
    // Atualiza high score se necessário
    if (phase > highScore) {
      highScore = phase;
      localStorage.setItem("blockchainGreenHighScore", highScore);
    }
    
    // Gera nova cadeia
    calculateDimensions();
    generateChain(numBlocks);
    scrambleBlocks();
    updateBlockStates();
  }
}

// --------------------
// Fundo Dinâmico e Padrão Quadrado
// --------------------
function drawSquarePattern() {
  // Fundo totalmente preto
  background(0);
  
  // Efeito matrix mais sutil
  for (let char of matrixChars) {
    char.update();
    char.draw();
  }
}

// --------------------
// Geração e Embaralhamento da Blockchain
// --------------------
function generateChain(n) {
  blocks = [];
  let previousHash = "GEN";
  for (let i = 0; i < n; i++) {
    let newHash = generateRandomHash();
    let block = new Block(i, newHash, previousHash);
    blocks.push(block);
    previousHash = newHash;
  }
}

function generateRandomHash() {
  let hex = "";
  for (let i = 0; i < 4; i++) {
    hex += floor(random(16)).toString(16).toUpperCase();
  }
  return hex;
}

function scrambleBlocks() {
  for (let i = blocks.length - 1; i > 0; i--) {
    let j = floor(random(i + 1));
    let temp = blocks[i];
    blocks[i] = blocks[j];
    blocks[j] = temp;
  }
  assignPositions();
}

function assignPositions() {
  let spacing = 20;
  let totalWidth = blocks.length * blockWidth + (blocks.length - 1) * spacing;
  let startX = gameAreaX + (gameAreaWidth - totalWidth) / 2;
  let yPos = gameAreaY + gameAreaHeight * 0.45;
  
  for (let i = 0; i < blocks.length; i++) {
    let block = blocks[i];
    block.startX = block.x;
    block.startY = block.y;
    block.targetX = startX + i * (blockWidth + spacing);
    block.targetY = yPos;
    block.animProgress = 0;
    block.pixelTransition = 0;
    
    // Nova progressão do efeito de ruído - começa no nível 3
    if (phase >= 3) {
      // Calcula quantos blocos devem ter ruído baseado na fase
      let noisyBlocks = Math.floor((phase - 2) / 2); // Começa com 1 bloco e aumenta a cada 2 fases
      let maxNoiseIntensity = map(phase, 3, 15, 0.5, 1.5); // Aumenta a intensidade máxima com as fases
      
      // Aplica ruído primeiro nas extremidades da direita
      if (i >= blocks.length - noisyBlocks) {
        block.isEdgeBlock = true;
        // Intensidade aumenta quanto mais à direita o bloco estiver
        let distanceFromEnd = blocks.length - 1 - i;
        block.noiseIntensity = map(distanceFromEnd, noisyBlocks - 1, 0, maxNoiseIntensity * 0.5, maxNoiseIntensity);
      } else {
        block.isEdgeBlock = false;
        block.noiseIntensity = 0;
      }
    } else {
      block.isEdgeBlock = false;
      block.noiseIntensity = 0;
    }
  }
}

// --------------------
// Interação: Clique do Mouse
// --------------------
function mousePressed() {
  // Não processa cliques quando o modal estiver aberto
  if (modal.style.display === "block") {
    return;
  }
  
  if (mouseOverLogo()) {
    window.open('https://www.x.com', '_blank');
    return;
  }
  
  if (gameState === "intro") {
    gameState = "play";
    generateChain(numBlocks);
    scrambleBlocks();
    updateBlockStates();
    gameTimer = 30;
    lastTimeCheck = millis();
    return;
  }
  
  // Verifica os botões primeiro
  if (mouseOverReset()) {
    scrambleBlocks();
    if (selectedBlock) {
      selectedBlock.isSelected = false;
      selectedBlock = null;
    }
    nextPhaseTime = 0;
    solvedAlready = false;
    return;
  }
  
  if (mouseOverSolve()) {
    solveChain();
    if (selectedBlock) {
      selectedBlock.isSelected = false;
      selectedBlock = null;
    }
    nextPhaseTime = millis() + nextPhaseDelay;
    solvedAlready = true;
    triggerGlitchAll();
    triggerConfetti();
    return;
  }
  
  if (mouseOverShare()) {
    shareScore();
    return;
  }
  
  if (mouseOverNextMove()) {
    highlightNextMove();
    return;
  }
  
  // Verifica clique nos blocos - sem restrição de área
  for (let block of blocks) {
    if (block.contains(mouseX, mouseY)) {
      if (selectedBlock === null) {
        selectedBlock = block;
        block.isSelected = true;
      } else if (selectedBlock === block) {
        block.isSelected = false;
        selectedBlock = null;
      } else {
        swapBlocks(selectedBlock, block);
        selectedBlock.isSelected = false;
        selectedBlock = null;
      }
      break;
    }
  }
}

function swapBlocks(blockA, blockB) {
  let indexA = blocks.indexOf(blockA);
  let indexB = blocks.indexOf(blockB);
  let temp = blocks[indexA];
  blocks[indexA] = blocks[indexB];
  blocks[indexB] = temp;
  // Aciona efeito glitch nos blocos envolvidos
  triggerGlitch(blockA);
  triggerGlitch(blockB);
  assignPositions();
}

// --------------------
// Solucionar a Cadeia e Próxima Fase
// --------------------
function solveChain() {
  blocks.sort((a, b) => a.order - b.order);
  assignPositions();
}

// Adicione esta função para controlar os estados especiais dos blocos
function updateBlockStates() {
  blockStates = Array(numBlocks).fill({ isVisible: true, noiseLevel: 0 });
  
  // Diferentes padrões de dificuldade baseados na fase
  switch(phase) {
    case 1:
      // Fase 1: Normal, sem efeitos
      break;
      
    case 2:
      // Fase 2: Último bloco com ruído leve
      blockStates[4].noiseLevel = 0.4;
      break;
      
    case 3:
      // Fase 3: Último bloco com ruído forte e penúltimo com ruído leve
      blockStates[4].noiseLevel = 0.7;
      blockStates[3].noiseLevel = 0.3;
      break;
      
    case 4:
      // Fase 4: Último bloco invisível
      blockStates[4].isVisible = false;
      blockStates[3].noiseLevel = 0.5;
      break;
      
    case 5:
      // Fase 5: Último invisível, penúltimo com ruído forte
      blockStates[4].isVisible = false;
      blockStates[3].noiseLevel = 0.8;
      blockStates[2].noiseLevel = 0.4;
      break;
      
    case 6:
      // Fase 6: Dois blocos invisíveis
      blockStates[4].isVisible = false;
      blockStates[3].isVisible = false;
      blockStates[2].noiseLevel = 0.6;
      break;
      
    default:
      // Fase 7+: Progressivamente mais difícil
      let invisibleCount = Math.min(3, Math.floor((phase - 4) / 2));
      let maxNoise = map(phase, 7, 15, 0.8, 1.5);
      
      // Aplica invisibilidade aos últimos blocos
      for (let i = 0; i < invisibleCount; i++) {
        blockStates[4-i].isVisible = false;
      }
      
      // Aplica ruído crescente aos blocos visíveis
      for (let i = 0; i < 5 - invisibleCount; i++) {
        let noiseLevel = map(i, 0, 4-invisibleCount, maxNoise * 0.3, maxNoise);
        blockStates[4-invisibleCount-i].noiseLevel = noiseLevel;
      }
      
      // Chance de trocar visibilidade por ruído extremo
      if (phase > 10 && random() < 0.5) {
        let randomBlock = floor(random(5));
        blockStates[randomBlock].isVisible = true;
        blockStates[randomBlock].noiseLevel = 1.5;
      }
      break;
  }
}

// --------------------
// Verificação da Cadeia e Feedback Visual
// --------------------
function isChainSolved() {
  for (let i = 1; i < blocks.length; i++) {
    if (blocks[i].prevHash !== blocks[i - 1].hash) {
      return false;
    }
  }
  return true;
}

function drawChainLinks() {
  for (let i = 1; i < blocks.length; i++) {
    let leftBlock = blocks[i - 1];
    let currentBlock = blocks[i];
    
    if (currentBlock.prevHash === leftBlock.hash) {
      let x1 = leftBlock.x + blockWidth;
      let y1 = leftBlock.y + blockHeight / 2;
      let x2 = currentBlock.x;
      let y2 = currentBlock.y + blockHeight / 2;
      
      push();
      // Linha principal brilhante
      strokeWeight(3);
      stroke(0, 255, 0, 200);
      line(x1, y1, x2, y2);
      
      // Efeito de glow
      strokeWeight(6);
      stroke(0, 255, 0, 50);
      line(x1, y1, x2, y2);
      
      // Efeito pulsante
      let pulseAlpha = map(sin(frameCount * 0.1), -1, 1, 30, 100);
      strokeWeight(12);
      stroke(0, 255, 0, pulseAlpha);
      line(x1, y1, x2, y2);
      
      // Pequenos quadrados animados ao longo da linha
      let steps = 5;
      let dx = (x2 - x1) / steps;
      let dy = (y2 - y1) / steps;
      
      for (let j = 0; j <= steps; j++) {
        let t = (frameCount * 0.05 + j/steps) % 1;
        let sx = lerp(x1, x2, t);
        let sy = lerp(y1, y2, t);
        
        // Quadrado com glow
        noStroke();
        fill(0, 255, 0, 150);
        rect(sx - 3, sy - 3, 6, 6);
        
        fill(0, 255, 0, 50);
        rect(sx - 5, sy - 5, 10, 10);
      }
      pop();
    }
  }
}

function drawTitle() {
  push();
  imageMode(CENTER);
  // Desenha a logo com efeito de brilho
  let glowAmount = map(sin(frameCount * 0.05), -1, 1, 0.8, 1);
  
  // Efeito de brilho
  tint(0, 255, 0, 50 * glowAmount);
  image(logoImage, width/2 + 2, height * 0.15 + 2, 400, 100);
  
  // Imagem principal
  tint(255, 255 * glowAmount);
  image(logoImage, width/2, height * 0.15, 400, 100);
  pop();
}

function drawLevelIndicator() {
  push();
  textAlign(CENTER, CENTER);
  textSize(24);
  
  // Posição abaixo dos blocos
  let yPos = gameAreaY + gameAreaHeight * 0.8;
  
  // Efeito de glow sutil
  for (let i = 3; i > 0; i--) {
    fill(0, 255, 0, 20);
    text("Level: " + phase, gameAreaX + gameAreaWidth/2, yPos);
  }
  
  fill(0, 255, 0);
  text("Level: " + phase, gameAreaX + gameAreaWidth/2, yPos);
  pop();
}

function drawHighScore() {
  push();
  textAlign(CENTER, CENTER);
  textSize(24);
  
  // Posição logo abaixo do level
  let yPos = gameAreaY + gameAreaHeight * 0.85;
  
  // Efeito de glow sutil
  for (let i = 3; i > 0; i--) {
    fill(0, 255, 0, 20);
    text("Best Level: " + highScore, gameAreaX + gameAreaWidth/2, yPos);
  }
  
  fill(0, 255, 0);
  text("Best Level: " + highScore, gameAreaX + gameAreaWidth/2, yPos);
  pop();
}

// --------------------
// Sistema de Partículas (Confetti Quadrado)
// --------------------
function triggerConfetti() {
  let centerX = width / 2;
  let centerY = height / 2;
  for (let i = 0; i < 100; i++) {
    particles.push(new Particle(centerX + random(-50, 50), centerY + random(-50, 50)));
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();
    if (particles[i].alpha <= 0) {
      particles.splice(i, 1);
    }
  }
}

// --------------------
// Efeitos Glitch (Detalhes Quadrados Piscantes)
// --------------------
function triggerGlitch(block) {
  let count = 20;
  for (let i = 0; i < count; i++) {
    let gx = block.x + random(blockWidth);
    let gy = block.y + random(blockHeight);
    let size = random(4, 10);
    glitches.push(new GlitchSquare(gx, gy, size));
  }
}

function triggerGlitchAll() {
  for (let block of blocks) {
    triggerGlitch(block);
  }
}

function updateGlitches() {
  for (let i = glitches.length - 1; i >= 0; i--) {
    glitches[i].update();
    glitches[i].draw();
    if (glitches[i].life <= 0) {
      glitches.splice(i, 1);
    }
  }
}

// --------------------
// Botões da UI: Reset, Solve, Share (detalhes quadrados)
// --------------------
function calculateButtonDimensions() {
  let btnW = min(120, gameAreaWidth * 0.15);
  let btnH = min(40, gameAreaHeight * 0.06);
  let totalButtons = 4; // Reset, Solve, Share, Next Move
  let totalWidth = (btnW * totalButtons) + ((totalButtons - 1) * 20); // 20px entre botões
  let startX = (windowWidth - totalWidth) / 2;
  
  return {
    width: btnW,
    height: btnH,
    startX: startX,
    y: windowHeight - btnH - 30, // 30px da parte inferior
    spacing: 20
  };
}

function drawResetButton() {
  let btn = calculateButtonDimensions();
  let btnX = btn.startX;
  
  push();
  fill(0, 50);
  stroke(0, 255, 0);
  strokeWeight(2);
  rect(btnX, btn.y, btn.width, btn.height);
  noStroke();
  fill(0, 255, 0);
  textAlign(CENTER, CENTER);
  textSize(min(16, btn.height * 0.4));
  text("Reset", btnX + btn.width / 2, btn.y + btn.height / 2);
  pop();
}

function drawSolveButton() {
  let btn = calculateButtonDimensions();
  let btnX = btn.startX + btn.width + btn.spacing;
  
  push();
  fill(0, 50);
  stroke(0, 255, 0);
  strokeWeight(2);
  rect(btnX, btn.y, btn.width, btn.height);
  noStroke();
  fill(0, 255, 0);
  textAlign(CENTER, CENTER);
  textSize(min(16, btn.height * 0.4));
  text("Solve", btnX + btn.width / 2, btn.y + btn.height / 2);
  pop();
}

function drawShareButton() {
  let btn = calculateButtonDimensions();
  let btnX = btn.startX + (btn.width + btn.spacing) * 2;
  
  push();
  fill(0, 50);
  stroke(0, 255, 0);
  strokeWeight(2);
  rect(btnX, btn.y, btn.width, btn.height);
  noStroke();
  fill(0, 255, 0);
  textAlign(CENTER, CENTER);
  textSize(min(16, btn.height * 0.4));
  text("Share", btnX + btn.width / 2, btn.y + btn.height / 2);
  pop();
}

function drawNextMoveButton() {
  let btn = calculateButtonDimensions();
  let btnX = btn.startX + (btn.width + btn.spacing) * 3;
  
  push();
  fill(0, 50);
  stroke(0, 255, 0);
  strokeWeight(2);
  rect(btnX, btn.y, btn.width, btn.height);
  noStroke();
  fill(0, 255, 0);
  textAlign(CENTER, CENTER);
  textSize(min(16, btn.height * 0.4));
  text("Next Move", btnX + btn.width / 2, btn.y + btn.height / 2);
  pop();
}

function mouseOverReset() {
  let btn = calculateButtonDimensions();
  return mouseX >= btn.startX && 
         mouseX <= btn.startX + btn.width && 
         mouseY >= btn.y && 
         mouseY <= btn.y + btn.height;
}

function mouseOverSolve() {
  let btn = calculateButtonDimensions();
  let btnX = btn.startX + btn.width + btn.spacing;
  return mouseX >= btnX && 
         mouseX <= btnX + btn.width && 
         mouseY >= btn.y && 
         mouseY <= btn.y + btn.height;
}

function mouseOverShare() {
  let btn = calculateButtonDimensions();
  let btnX = btn.startX + (btn.width + btn.spacing) * 2;
  return mouseX >= btnX && 
         mouseX <= btnX + btn.width && 
         mouseY >= btn.y && 
         mouseY <= btn.y + btn.height;
}

function mouseOverNextMove() {
  let btn = calculateButtonDimensions();
  let btnX = btn.startX + (btn.width + btn.spacing) * 3;
  return mouseX >= btnX && 
         mouseX <= btnX + btn.width && 
         mouseY >= btn.y && 
         mouseY <= btn.y + btn.height;
}

// Adicione esta função auxiliar para desenhar o glow
function drawButtonGlow(x, y, w, h) {
  push();
  noFill();
  for(let i = 0; i < 3; i++) {
    stroke(0, 255, 0, 50 - i * 15);
    strokeWeight(6 - i);
    rect(x, y, w, h);
  }
  pop();
}

// --------------------
// Compartilhamento Social
// --------------------
function shareScore() {
  let tweetText = encodeURIComponent("Acabei de chegar na fase " + phase + " do Blockchain Green! Consegue bater minha pontuação? #BlockchainGreen");
  let tweetURL = "https://twitter.com/intent/tweet?text=" + tweetText;
  window.open(tweetURL, "_blank");
}

// Adicionar função para redimensionar a janela
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateDimensions();
  
  // Atualiza dimensões do logo
  logoWidth = min(300, windowWidth * 0.3);
  logoHeight = logoWidth * (logoImage.height / logoImage.width);
  logoX = (windowWidth - logoWidth) / 2;
  logoY = height * 0.15;
  
  // Reposiciona os blocos
  if (blocks.length > 0) {
    assignPositions();
  }
}

// Adicione uma função para verificar se um bloco está na posição correta
function isBlockCorrect(block, index) {
  if (index === 0) {
    return block.prevHash === "GEN";
  }
  return block.prevHash === blocks[index - 1].hash;
}

// Adicione esta função para encontrar o próximo movimento
function findNextMove() {
  // Procura o primeiro bloco incorreto
  for (let i = 0; i < blocks.length; i++) {
    if (i === 0 && blocks[i].prevHash !== "GEN") {
      // Procura o bloco que deveria estar aqui (com prevHash = "GEN")
      for (let j = i + 1; j < blocks.length; j++) {
        if (blocks[j].prevHash === "GEN") {
          return {from: j, to: i};
        }
      }
    } else if (i > 0) {
      let prevBlock = blocks[i - 1];
      if (blocks[i].prevHash !== prevBlock.hash) {
        // Procura o bloco que deveria estar aqui
        for (let j = i + 1; j < blocks.length; j++) {
          if (blocks[j].prevHash === prevBlock.hash) {
            return {from: j, to: i};
          }
        }
      }
    }
  }
  return null;
}

// Adicione esta função para destacar o próximo movimento
function highlightNextMove() {
  let move = findNextMove();
  if (move) {
    // Remove qualquer highlight anterior
    blocks.forEach(b => b.isHighlighted = false);
    
    // Marca os blocos para o efeito pulsante
    blocks[move.from].isHighlighted = true;
    blocks[move.to].isHighlighted = true;
    
    // Remove o highlight após 2 segundos
    setTimeout(() => {
      blocks[move.from].isHighlighted = false;
      blocks[move.to].isHighlighted = false;
    }, 2000);
  }
}

// Adicione esta função para desenhar o cronômetro
function drawTimer() {
  push();
  textAlign(CENTER, CENTER);
  let timerSize = min(32, gameAreaHeight * 0.05);
  let timerY = gameAreaY + (gameAreaHeight * 0.3); // Posiciona acima dos blocos
  
  if (gameTimer <= 10) {
    // Efeito de "glitch" no texto do timer quando está baixo
    for (let i = 0; i < 3; i++) {
      let offsetX = random(-5, 5);
      let offsetY = random(-3, 3);
      fill(255, 0, 0, 100);
      textSize(timerSize * 1.2);
      text(ceil(gameTimer), gameAreaX + gameAreaWidth/2 + offsetX, timerY + offsetY);
    }
    fill(255, 0, 0);
  } else {
    fill(0, 255, 0);
  }
  
  textSize(timerSize);
  text(ceil(gameTimer), gameAreaX + gameAreaWidth/2, timerY);
  
  // Adiciona uma barra de progresso do tempo
  let barWidth = gameAreaWidth * 0.3;
  let barHeight = 4;
  let barX = gameAreaX + (gameAreaWidth - barWidth)/2;
  let barY = timerY + 20;
  
  // Borda da barra
  noFill();
  stroke(0, 255, 0);
  rect(barX, barY, barWidth, barHeight);
  
  // Preenchimento da barra
  let progress = gameTimer / 30;
  fill(0, 255, 0);
  noStroke();
  rect(barX, barY, barWidth * progress, barHeight);
  
  pop();
}

// Adicione esta função para o game over
function drawGameOver() {
  push();
  // Fundo preto sólido
  background(0);
  
  let titleSize = min(64, windowWidth * 0.08);
  let scoreSize = min(32, windowWidth * 0.04);
  let instructSize = min(24, windowWidth * 0.03);
  
  textSize(titleSize);
  textAlign(CENTER, CENTER);
  
  // Efeito glitch no texto GAME OVER
  for (let i = 0; i < 3; i++) {
    let offsetX = random(-5, 5);
    let offsetY = random(-5, 5);
    fill(255, 0, 0, 100);
    text("GAME OVER", width/2 + offsetX, height/2 - 50 + offsetY);
  }
  
  fill(255, 0, 0);
  text("GAME OVER", width/2, height/2 - 50);
  
  textSize(scoreSize);
  fill(0, 255, 0);
  text("Level reached: " + phase, width/2, height/2 + 30);
  text("Best Level: " + highScore, width/2, height/2 + 80);
  
  textSize(instructSize);
  fill(255);
  text("Press SPACE to restart", width/2, height/2 + 150);
  pop();
}

// Modifique a função keyPressed para reiniciar completamente o jogo
function keyPressed() {
  if (gameOver && keyCode === 32) {
    gameOver = false;
    gameTimer = 30;
    lastTimeCheck = millis();
    phase = 1;
    numBlocks = 5;
    
    calculateDimensions();
    generateChain(numBlocks);
    scrambleBlocks();
    updateBlockStates();
    
    particles = [];
    glitches = [];
    selectedBlock = null;
    solvedAlready = false;
    gameState = "play";
  }
}

// Substitua o efeito de vignette por um novo efeito de "matrix"
function drawTimeWarning(intensity) {
  push();
  let columns = width / 20;
  let rows = height / 20;
  
  // Caracteres para o efeito matrix
  let chars = "01";
  textSize(16);
  textAlign(CENTER, CENTER);
  
  for (let i = 0; i < columns; i++) {
    for (let j = 0; j < rows; j++) {
      if (random() < 0.1 * intensity) { // Densidade dos caracteres aumenta com a intensidade
        let x = i * 20;
        let y = j * 20;
        
        // Cor vermelha com opacidade variável
        let alpha = random(50, 150) * intensity;
        fill(255, 0, 0, alpha);
        
        // Caractere aleatório
        let char = chars.charAt(floor(random(chars.length)));
        text(char, x, y);
      }
    }
  }
  pop();
}

// Adicione esta função para verificar se o mouse está sobre o logo
function mouseOverLogo() {
  return mouseX >= logoX && 
         mouseX <= logoX + logoWidth && 
         mouseY >= logoY && 
         mouseY <= logoY + logoHeight;
}

// Adicione estas funções para controlar o modal de exemplo
function showExampleModal() {
    document.getElementById('exampleModal').style.display = "block";
}

function closeExampleModal() {
    document.getElementById('exampleModal').style.display = "none";
}


