// Adicione no início do arquivo
console.log('Loading sketch.js...');

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
  console.log('Setting up canvas...');
  // Criar um canvas quadrado menor e centralizado
  let canvasSize = min(windowWidth, windowHeight) * 0.8;
  let canvas = createCanvas(canvasSize, canvasSize);
  
  // Centralizar o canvas na janela
  let x = (windowWidth - canvasSize) / 2;
  let y = (windowHeight - canvasSize) / 2;
  canvas.position(x, y);
  
  console.log('Canvas created:', canvasSize, 'x', canvasSize);
  
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
  try {
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
  } catch (error) {
    console.error('Error in draw:', error);
  }
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
    this.y = height - 50;
    this.speed = 5;
    this.size = 40;
    this.boosted = false;
    this.boostTimer = 0;
  }
  
  update() {
    handleMovement();
    if (this.boosted) {
      if (this.boostTimer > 0) {
        this.boostTimer--;
      } else {
        this.boosted = false;
        this.speed = 5;
      }
    }
  }
  
  show() {
    push();
    translate(this.x, this.y);
    noStroke();
    // Green neon glow for player
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = "rgba(0,255,0,0.8)";
    fill(0, 255, 0);
    // Draw ship shape
    beginShape();
    vertex(0, -this.size);
    vertex(this.size/2, this.size/2);
    vertex(0, this.size/4);
    vertex(-this.size/2, this.size/2);
    endShape(CLOSE);
    drawingContext.shadowBlur = 0;
    pop();
  }
  
  move(dir) {
    this.x += dir * this.speed;
    this.x = constrain(this.x, 25, width - 25);
  }
  
  shoot() {
    bullets.push(new Bullet(this.x, this.y - 20));
  }
  
  activateBoost() {
    this.boosted = true;
    this.speed = 8;
    this.boostTimer = 300;
  }
}

// ====================
// Enemy Class
// ====================
class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 3;
    this.size = 30;
  }
  
  update() {
    this.y += this.speed;
  }
  
  show() {
    push();
    translate(this.x, this.y);
    noStroke();
    // Red neon glow for enemies
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = "rgba(255,0,0,0.8)";
    fill(255, 0, 0);
    // Draw enemy shape
    triangle(0, -this.size/2, this.size/2, this.size/2, -this.size/2, this.size/2);
    drawingContext.shadowBlur = 0;
    pop();
  }
  
  offscreen() {
    return this.y > height + this.size;
  }
}

// ====================
// Bullet Class
// ====================
class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 10;
    this.size = 8;
  }
  
  update() {
    this.y -= this.speed;
  }
  
  show() {
    push();
    noStroke();
    // Green neon glow for bullets
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = "rgba(0,255,0,0.8)";
    fill(0, 255, 0);
    ellipse(this.x, this.y, this.size);
    drawingContext.shadowBlur = 0;
    pop();
  }
  
  hits(enemy) {
    let d = dist(this.x, this.y, enemy.x, enemy.y);
    return d < enemy.size;
  }
  
  offscreen() {
    return this.y < 0;
  }
}

// ====================
// Boss Class
// ====================
class Boss {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 80;
    this.speed = 2;
    this.hp = 20;
    this.direction = 1;
  }
  
  update() {
    this.x += this.speed * this.direction;
    if (this.x > width - this.size/2 || this.x < this.size/2) {
      this.direction *= -1;
    }
    if (random(1) < 0.02) {
      enemies.push(new Enemy(this.x, this.y + this.size/2));
    }
  }
  
  show() {
    push();
    translate(this.x, this.y);
    noStroke();
    // Red neon glow for boss
    drawingContext.shadowBlur = 20;
    drawingContext.shadowColor = "rgba(255,0,0,0.8)";
    fill(255, 0, 0);
    // Draw boss shape
    beginShape();
    vertex(0, -this.size);
    vertex(this.size, 0);
    vertex(0, this.size);
    vertex(-this.size, 0);
    endShape(CLOSE);
    drawingContext.shadowBlur = 0;
    // Draw HP bar
    noFill();
    stroke(255, 0, 0);
    rect(-this.size/2, -this.size - 20, this.size, 10);
    noStroke();
    fill(255, 0, 0);
    rect(-this.size/2, -this.size - 20, this.size * (this.hp/20), 10);
    pop();
  }
  
  hits(bullet) {
    let d = dist(this.x, this.y, bullet.x, bullet.y);
    return d < this.size;
  }
}

// ====================
// Boots Class (Power-up)
// ====================
class Boots {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.speed = 2;
  }
  
  update() {
    this.y += this.speed;
  }
  
  show() {
    push();
    translate(this.x, this.y);
    noStroke();
    // Blue neon glow for boots
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = "rgba(0,255,255,0.8)";
    fill(0, 255, 255);
    // Draw boots shape
    rect(-this.size/4, -this.size/2, this.size/2, this.size);
    rect(-this.size/2, this.size/2 - 5, this.size, 5);
    drawingContext.shadowBlur = 0;
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
    this.vx = random(-3, 3);
    this.vy = random(-3, 3);
    this.alpha = 255;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 5;
  }
  
  show() {
    noStroke();
    fill(255, 0, 0, this.alpha);
    ellipse(this.x, this.y, 4);
  }
  
  finished() {
    return this.alpha <= 0;
  }
}

// ====================
// Shockwave Class for Explosion Effects
// ====================
class Shockwave {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 1;
    this.alpha = 255;
  }
  
  update() {
    this.size += 2;
    this.alpha -= 10;
  }
  
  show() {
    noFill();
    stroke(255, 0, 0, this.alpha);
    ellipse(this.x, this.y, this.size);
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
    this.speed = random(1, 3);
    this.size = random(1, 3);
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
    fill(255, 255, 255, 150);
    ellipse(this.x, this.y, this.size);
  }
}

// ====================
// Explosion Spawner
// ====================
function spawnExplosion(x, y) {
  for (let i = 0; i < 20; i++) {
    particles.push(new Particle(x, y));
  }
  shockwaves.push(new Shockwave(x, y));
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
    this.level = 1;
  }
  
  update() {
    // Level logic is handled in the main game loop
  }
  
  show() {
    // Level display is handled in the main game loop
  }
}

// ====================
// Weapon System Class
// ====================
class WeaponSystem {
  constructor() {
    // Future weapon upgrade implementation
  }
}

// ====================
// Effect System Class
// ====================
class EffectSystem {
  constructor() {
    // Future special effects implementation
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
