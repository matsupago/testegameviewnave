// Viral Green Space Shooter with Boss & Boots Power-Up
// Controls: LEFT/RIGHT arrow keys to move, SPACE to shoot

let player;
let bullets = [];
let enemies = [];
let particles = [];
let shockwaves = [];
let stars = [];
let bootsPowerups = [];

let enemySpawnTimer = 0;
let score = 0;
window.score = score;
let gameState = 'start'; // 'start', 'playing', 'gameover'

let shakeTimer = 0;
let flashAlpha = 0;

// Boss variables
let boss = null;
let nextBossScore = 100;

let shipImage;
let enemyImage;
let bossImage;

let playerLives = 3;
let playerShield = 100;

let currentLevel = 1;
window.currentLevel = currentLevel;
let levelSystem;
let weaponSystem;
let effectSystem;
let music;
let explosionSound;

let enemiesDestroyed = 0; // Contador de inimigos destruídos

function setup() {
  // Criar um canvas quadrado menor e centralizado
  let canvasSize = min(windowWidth, windowHeight) * 0.8; // 80% da menor dimensão da janela
  let canvas = createCanvas(canvasSize, canvasSize);
  
  // Centralizar o canvas na janela
  let x = (windowWidth - canvasSize) / 2;
  let y = (windowHeight - canvasSize) / 2;
  canvas.position(x, y);
  
  player = new Player();
  // Ajustar quantidade de estrelas para o novo tamanho
  for (let i = 0; i < 50; i++) {
    stars.push(new Star(random(width), random(height)));
  }
  textFont('Courier New');
  
  levelSystem = new LevelSystem();
  weaponSystem = new WeaponSystem();
  effectSystem = new EffectSystem();
}

function draw() {
  background(0);
  
  // Apply camera shake effect
  if (shakeTimer > 0) {
    push();
    let shakeX = random(-5, 5);
    let shakeY = random(-5, 5);
    translate(shakeX, shakeY);
    shakeTimer--;
    drawGame();
    pop();
  } else {
    drawGame();
  }
  
  // Screen flash on game over
  if (flashAlpha > 0) {
    fill(255, flashAlpha);
    rect(0, 0, width, height);
    flashAlpha -= 10;
  }
  
  // Atualizar sistema de níveis
  levelSystem.update();
  levelSystem.show();
}

function drawGame() {
  // Update and display stars
  for (let star of stars) {
    star.update();
    star.show();
  }
  
  if (gameState === 'start') {
    drawStartScreen();
  } else if (gameState === 'playing') {
    playGame();
  } else if (gameState === 'gameover') {
    drawGameOverScreen();
  }
}

function drawStartScreen() {
  fill(255, 0, 0);
  textAlign(CENTER, CENTER);
  textSize(48);
  text("GREEN SPACE SHOOTER", width / 2, height / 2 - 50);
  textSize(24);
  text("Press any key to start", width / 2, height / 2 + 20);
  text("Arrow keys: move, SPACE: shoot", width / 2, height / 2 + 60);
}

function drawGameOverScreen() {
  // Não precisamos mais desenhar a tela de game over aqui
  // pois agora usaremos o modal HTML
  showGameOverModal();
}

function playGame() {
  // Update player and show
  player.update();
  player.show();

  // Update bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update();
    bullets[i].show();
    if (bullets[i].offscreen()) {
      bullets.splice(i, 1);
      continue;
    }
    // Check collision with standard enemies
    for (let j = enemies.length - 1; j >= 0; j--) {
      if (bullets[i].hits(enemies[j])) {
        spawnExplosion(enemies[j].x, enemies[j].y);
        enemies.splice(j, 1);
        bullets.splice(i, 1);
        score += 10;
        window.score = score;
        shakeTimer = 10;
        enemiesDestroyed++;
        break;
      }
    }
  }

  // Spawn standard enemies periodically
  if (enemySpawnTimer <= 0) {
    enemies.push(new Enemy(random(50, width - 50), -50));
    // Decrease spawn time based on level
    enemySpawnTimer = random(30, 60) / (1 + (currentLevel - 1) * 0.2);
  } else {
    enemySpawnTimer--;
  }
  
  // Update standard enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].update();
    enemies[i].show();
    if (enemies[i].offscreen()) {
      enemies.splice(i, 1);
    }
    // Collision with player
    if (dist(enemies[i].x, enemies[i].y, player.x, player.y) < 30) {
      spawnExplosion(player.x, player.y);
      flashAlpha = 150;
      gameState = 'gameover';
      showGameOverModal();
      return; // Importante: sair da função após game over
    }
  }
  
  // --- Boss logic ---
  if (boss !== null) {
    boss.update();
    boss.show();
    // Check collision between boss and bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      if (boss.hits(bullets[i])) {
        boss.hp -= 1;
        bullets.splice(i, 1);
        if (boss.hp <= 0) {
          spawnExplosion(boss.x, boss.y);
          score += 50; // bonus for defeating boss
          boss = null;
          shakeTimer = 20;
        }
        break;
      }
    }
    // Boss collision with player
    if (boss && dist(boss.x, boss.y, player.x, player.y) < boss.size) {
      spawnExplosion(player.x, player.y);
      flashAlpha = 150;
      gameState = 'gameover';
      showGameOverModal();
      return; // Importante: sair da função após game over
    }
  } else if (score >= nextBossScore) {
    // Spawn boss when score threshold is reached
    boss = new Boss(width / 2, 100);
    nextBossScore += 100;
  }
  
  // --- Boots power-up logic ---
  // Occasionally spawn a boots power-up
  if (random(1) < 0.005) {
    bootsPowerups.push(new Boots(random(30, width - 30), -20));
  }
  for (let i = bootsPowerups.length - 1; i >= 0; i--) {
    bootsPowerups[i].update();
    bootsPowerups[i].show();
    if (bootsPowerups[i].offscreen()) {
      bootsPowerups.splice(i, 1);
      continue;
    }
    // If player collects boots, activate speed boost
    if (dist(player.x, player.y, bootsPowerups[i].x, bootsPowerups[i].y) < 30) {
      player.activateBoost();
      bootsPowerups.splice(i, 1);
    }
  }
  
  // Update explosion particles
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();
    if (particles[i].finished()) {
      particles.splice(i, 1);
    }
  }
  
  // Update shockwaves
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    shockwaves[i].update();
    shockwaves[i].show();
    if (shockwaves[i].finished()) {
      shockwaves.splice(i, 1);
    }
  }
  
  // Display score
  fill(255, 0, 0);
  textSize(18);
  textAlign(LEFT, TOP);
  text("Score: " + score, 10, 10);
  
  // Verificar se o nível deve ser aumentado
  if (enemiesDestroyed >= 10) {
    currentLevel++;
    window.currentLevel = currentLevel;
    enemiesDestroyed = 0; // Resetar contador
    // Visual feedback for level up
    flashAlpha = 100;
    shakeTimer = 15;
    
    // Spawn additional enemies on level up
    for (let i = 0; i < currentLevel; i++) {
      enemies.push(new Enemy(random(50, width - 50), -50));
    }
  }

  // Display current level
  fill(255, 0, 0);
  textSize(18);
  text("Level: " + currentLevel, 10, 35);
  text("Enemies: " + enemiesDestroyed + "/10", 10, 60);
}

function keyPressed() {
  if (gameState === 'start') {
    gameState = 'playing';
  } else if (gameState === 'playing' && key === ' ') {
    player.shoot();
  }
}

function handleMovement() {
  if (keyIsDown(LEFT_ARROW)) {
    player.move(-1);
  } else if (keyIsDown(RIGHT_ARROW)) {
    player.move(1);
  } else {
    player.move(0);
  }
}

// ====================
// Player Class
// ====================
class Player {
  constructor() {
    this.x = width / 2;
    this.y = height - height/6; // Ajustar posição vertical do jogador
    this.size = width/20; // Ajustar tamanho proporcionalmente
    this.baseSpeed = width/120; // Velocidade proporcional ao tamanho do canvas
    this.speed = this.baseSpeed;
    this.cooldown = 0;
    this.boostTime = 0;
    this.trail = [];
    this.shield = 100;
    this.isShieldActive = false;
    this.shieldColor = color(0, 150, 255, 100);
  }
  
  update() {
    handleMovement();
    // Boost: increase speed temporarily if activated
    if (this.boostTime > 0) {
      this.boostTime--;
      this.speed = this.baseSpeed + 3;
    } else {
      this.speed = this.baseSpeed;
    }
    this.x = constrain(this.x, this.size, width - this.size);
    if (this.cooldown > 0) this.cooldown--;
    
    // Adicionar posição atual à trilha
    this.trail.push({x: this.x, y: this.y});
    if (this.trail.length > 10) {
      this.trail.shift();
    }
  }
  
  show() {
    // Desenhar a trilha (se existir)
    if (this.trail) {
      for (let i = 0; i < this.trail.length; i++) {
        let alpha = map(i, 0, this.trail.length, 0, 255);
        fill(0, 255, 0, alpha * 0.2);
        noStroke();
        let pos = this.trail[i];
        triangle(pos.x, pos.y - this.size, 
                pos.x + this.size * 0.6, pos.y + this.size,
                pos.x - this.size * 0.6, pos.y + this.size);
      }
    }
    
    push();
    imageMode(CENTER);
    // Desenhar a imagem na posição do jogador
    // O último parâmetro (this.size * 2) ajusta o tamanho da imagem
    image(shipImage, this.x, this.y, this.size * 2, this.size * 2);
    pop();
    
    // Desenhar escudo se ativo
    if (this.isShieldActive) {
      push();
      noFill();
      stroke(this.shieldColor);
      strokeWeight(2);
      circle(this.x, this.y, this.size * 3);
      pop();
    }
  }
  
  move(dir) {
    this.x += dir * this.speed;
  }
  
  shoot() {
    if (this.cooldown === 0) {
      bullets.push(new Bullet(this.x, this.y - this.size));
      this.cooldown = 15;
    }
  }
  
  activateBoost() {
    this.boostTime = 300; // Boost lasts for 300 frames
  }

  takeDamage() {
    if (this.isShieldActive) {
      this.shield -= 25;
      if (this.shield <= 0) {
        this.isShieldActive = false;
      }
    } else {
      playerLives--;
      if (playerLives <= 0) {
        gameState = 'gameover';
      } else {
        // Dar invencibilidade temporária
        this.isShieldActive = true;
        this.shield = 100;
      }
    }
  }
}

// ====================
// Bullet Class
// ====================
class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 5;
    this.speed = 7;
  }
  
  update() {
    this.y -= this.speed;
  }
  
  show() {
    noStroke();
    fill(0, 255, 0);
    ellipse(this.x, this.y, this.r * 2);
  }
  
  offscreen() {
    return (this.y < -this.r);
  }
  
  hits(enemy) {
    let d = dist(this.x, this.y, enemy.x, enemy.y);
    return (d < this.r + enemy.size * 0.5);
  }
}

// ====================
// Enemy Class (Standard Enemies)
// ====================
class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 30;
    // Increase base speed based on current level
    this.speed = random(2, 4) + (currentLevel - 1);
  }
  
  update() {
    this.y += this.speed;
    // Horizontal oscillation for dynamic movement
    this.x += sin(frameCount * 0.05) * 2;
  }
  
  show() {
    push();
    translate(this.x, this.y);
    noStroke();
    // Red neon glow for enemy
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = "rgba(255,0,0,0.8)";
    fill(255, 0, 0);
    beginShape();
    vertex(0, -this.size);
    vertex(this.size, this.size);
    vertex(0, this.size * 0.5);
    vertex(-this.size, this.size);
    endShape(CLOSE);
    drawingContext.shadowBlur = 0;
    pop();
  }
  
  offscreen() {
    return (this.y > height + this.size);
  }
}

// ====================
// Boss Class
// ====================
class Boss {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 60;
    this.hp = 20;
    this.speed = 2;
    this.direction = 1; // moving right initially
  }
  
  update() {
    // Horizontal movement with bouncing off canvas edges
    this.x += this.speed * this.direction;
    if (this.x > width - this.size || this.x < this.size) {
      this.direction *= -1;
    }
  }
  
  show() {
    push();
    translate(this.x, this.y);
    noStroke();
    // Boss red neon glow effect
    drawingContext.shadowBlur = 30;
    drawingContext.shadowColor = "rgba(255,0,0,0.8)";
    fill(255, 0, 0);
    // Draw an octagon-like boss shape
    beginShape();
    for (let i = 0; i < 8; i++) {
      let angle = TWO_PI / 8 * i;
      let rad = this.size + (i % 2 === 0 ? 10 : 0);
      let sx = cos(angle) * rad;
      let sy = sin(angle) * rad;
      vertex(sx, sy);
    }
    endShape(CLOSE);
    drawingContext.shadowBlur = 0;
    // Draw boss HP bar
    fill(255);
    rect(-this.size, this.size + 10, this.size * 2, 8);
    fill(0, 255, 0);
    let hpWidth = map(this.hp, 0, 20, 0, this.size * 2);
    rect(-this.size, this.size + 10, hpWidth, 8);
    pop();
  }
  
  hits(bullet) {
    let d = dist(this.x, this.y, bullet.x, bullet.y);
    return d < this.size;
  }
}

// ====================
// Boots Power-Up Class
// ====================
class Boots {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 2;
    this.size = 20;
  }
  
  update() {
    this.y += this.speed;
  }
  
  show() {
    push();
    translate(this.x, this.y);
    noStroke();
    // Draw a simple boot shape with a contrasting color
    fill(0, 0, 255);
    rectMode(CENTER);
    rect(0, 0, this.size, this.size * 1.2, 5);
    fill(255);
    ellipse(0, this.size * 0.3, this.size * 0.6, this.size * 0.4);
    pop();
  }
  
  offscreen() {
    return this.y > height + this.size;
  }
}

// ====================
// Particle Class for Explosions
// ====================
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-2, 2);
    this.vy = random(-2, 2);
    this.alpha = 255;
    this.size = random(2, 5);
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 5;
  }
  
  show() {
    noStroke();
    fill(0, 255, 0, this.alpha);
    ellipse(this.x, this.y, this.size);
  }
  
  finished() {
    return this.alpha < 0;
  }
}

// ====================
// Shockwave Class for Explosion Effects
// ====================
class Shockwave {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.maxRadius = 80;
    this.alpha = 200;
  }
  
  update() {
    this.radius += 4;
    this.alpha -= 4;
  }
  
  show() {
    noFill();
    stroke(0, 255, 0, this.alpha);
    strokeWeight(3);
    ellipse(this.x, this.y, this.radius * 2);
  }
  
  finished() {
    return this.alpha <= 0;
  }
}

// ====================
// Star Class for Background
// ====================
class Star {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = random(1, 3);
    this.speed = random(0.5, 2);
  }
  
  update() {
    this.y += this.speed;
    if (this.y > height) {
      this.y = 0;
      this.x = random(width);
    }
  }
  
  show() {
    noStroke();
    fill(0, 150, 0);
    ellipse(this.x, this.y, this.size);
  }
}

// ====================
// Explosion Spawner
// ====================
function spawnExplosion(x, y) {
  // Spawn many particles for an explosion effect
  for (let i = 0; i < 30; i++) {
    particles.push(new Particle(x, y));
  }
  // Spawn a shockwave
  shockwaves.push(new Shockwave(x, y));
}

function preload() {
  // Carregar imagens
  shipImage = loadImage('assets/ship.png', 
    () => console.log('Ship image loaded successfully'), 
    () => console.error('Error loading ship image'));
  
  enemyImage = loadImage('assets/enemy.png', 
    () => console.log('Enemy image loaded successfully'), 
    () => console.error('Error loading enemy image'));
  
  bossImage = loadImage('assets/boss.png', 
    () => console.log('Boss image loaded successfully'), 
    () => console.error('Error loading boss image'));
}

class PowerupManager {
  constructor() {
    this.powerups = [];
    this.types = {
      'shield': {
        color: color(0, 150, 255),
        effect: (player) => {
          player.isShieldActive = true;
          player.shield = 100;
        }
      },
      'rapidFire': {
        color: color(255, 0, 255),
        effect: (player) => {
          player.weaponSystem.currentWeapon = 'double';
          setTimeout(() => {
            player.weaponSystem.currentWeapon = 'single';
          }, 5000);
        }
      },
      'heal': {
        color: color(0, 255, 0),
        effect: () => {
          playerLives = min(playerLives + 1, 3);
        }
      }
    };
  }

  spawnPowerup() {
    if (random(1) < 0.01) { // 1% chance por frame
      let type = random(Object.keys(this.types));
      this.powerups.push(new Powerup(
        random(width),
        0,
        type,
        this.types[type]
      ));
    }
  }

  update() {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      this.powerups[i].update();
      if (this.powerups[i].offscreen()) {
        this.powerups.splice(i, 1);
      }
    }
  }

  show() {
    this.powerups.forEach(powerup => powerup.show());
  }
}

// ====================
// Level System Class
// ====================
class LevelSystem {
  constructor() {
    this.currentLevel = 1;
    this.objectives = [
      { requirement: 10, description: "Destrua 10 inimigos" },
      { requirement: 20, description: "Sobreviva por 60 segundos" },
      { requirement: 1, description: "Derrote o chefe" }
    ];
  }

  update() {
    // Lógica para verificar se o objetivo do nível foi alcançado
  }

  show() {
    fill(255);
    textSize(20);
    text(`Nível: ${this.currentLevel}`, 10, 90);
    text(this.objectives[this.currentLevel - 1].description, 10, 120);
  }
}

// ====================
// Weapon System Class
// ====================
class WeaponSystem {
  constructor() {
    this.currentWeapon = 'single';
  }

  shoot() {
    // Lógica para disparar com a arma atual
  }
}

// ====================
// Effect System Class
// ====================
class EffectSystem {
  constructor() {
    this.effects = [];
  }

  update() {
    // Atualizar efeitos
  }

  show() {
    // Mostrar efeitos
  }
}

// ====================
// Powerup Class
// ====================
class Powerup {
  constructor(x, y, type, effect) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.type = type;
    this.effect = effect;
  }

  update() {
    this.y += 2;
    if (this.y > height) {
      // Remove power-up se sair da tela
    }
  }

  show() {
    push();
    fill(this.type === 'shield' ? color(0, 150, 255) : this.type === 'rapidFire' ? color(255, 0, 255) : color(0, 255, 0));
    ellipse(this.x, this.y, this.size);
    pop();
  }

  offscreen() {
    return this.y > height + this.size;
  }
}

// ====================
// Function to Add Enemy
// ====================
function addEnemy() {
  enemies.push(new Enemy(random(width), -50));
}

// ====================
// Function to Add Powerup
// ====================
function addPowerup() {
  bootsPowerups.push(new Boots(random(30, width - 30), -20));
}

// ====================
// Function to Spawn Entities
// ====================
function spawnEntities() {
  if (frameCount % 60 === 0) {
    addEnemy();
  }
  if (frameCount % 120 === 0) {
    addPowerup();
  }
}

function showGameOverModal() {
    try {
        console.log('Game Over - Score:', score, 'Level:', currentLevel);
        const finalScoreElement = document.getElementById('finalScore');
        const finalLevelElement = document.getElementById('finalLevel');
        const modalElement = document.getElementById('gameOverModal');
        
        if (finalScoreElement) finalScoreElement.textContent = score;
        if (modalElement) modalElement.style.display = 'block';
        
        // Parar o loop do jogo
        noLoop();
    } catch (error) {
        console.error('Error showing game over modal:', error);
    }
}

function resetGame() {
    try {
        gameState = 'playing';
        score = 0;
        window.score = score;
        currentLevel = 1;
        window.currentLevel = currentLevel;
        enemiesDestroyed = 0;
        enemies = [];
        bullets = [];
        particles = [];
        shockwaves = [];
        bootsPowerups = [];
        boss = null;
        nextBossScore = 100;
        player = new Player();
        
        // Reiniciar o loop do jogo
        loop();
    } catch (error) {
        console.error('Error resetting game:', error);
    }
}
