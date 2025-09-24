
class PixelCharacter {
    constructor(id, name, sprite, x, y, maxLife, attack, characterClass = 'warrior') {
        this.id = id;
        this.name = name;
        this.sprite = sprite;
        this.x = x;
        this.y = y;
        this.maxLife = maxLife;
        this.currentLife = maxLife;
        this.attack = attack;
        this.characterClass = characterClass;
        this.level = Math.floor(Math.random() * 10) + 8;
        this.isDefending = false;
        this.specialCooldown = 0;
        this.healCooldown = 0;
        this.ultimateCooldown = 0;
        this.element = document.getElementById(id);
        this.isMoving = false;
        this.direction = 'down';
        this.statusEffects = new Map(); 
        this.experience = 0;
        this.mana = 100;
        this.maxMana = 100;
        this.shield = 0;
        this.combos = 0;
        this.lastActionTime = 0;
        this.battleStats = {
            wins: 0,
            losses: 0,
            damageDealt: 0,
            damageReceived: 0,
            specialsUsed: 0,
            healsUsed: 0,
            criticalHits: 0
        };
        
        this.setupClassAbilities();
        
        this.updatePosition();
        this.updateUI();
    }
    
    setupClassAbilities() {
        const classData = {
            warrior: {
                specialName: "Fúria Berserker",
                ultimateName: "Corte Devastador",
                manaRegen: 5,
                specialCost: 30,
                ultimateCost: 60
            },
            mage: {
                specialName: "Bola de Fogo",
                ultimateName: "Meteoro Arcano",
                manaRegen: 8,
                specialCost: 25,
                ultimateCost: 70
            },
            rogue: {
                specialName: "Ataque Furtivo",
                ultimateName: "Mil Cortes",
                manaRegen: 6,
                specialCost: 20,
                ultimateCost: 50
            },
            healer: {
                specialName: "Luz Curativa",
                ultimateName: "Benção Divina",
                manaRegen: 10,
                specialCost: 35,
                ultimateCost: 80
            }
        };
        
        this.classData = classData[this.characterClass] || classData.warrior;
    }

    move(direction) {
        if (this.isMoving) return false;
        
        const TILE_SIZE = 32;
        const MAP_WIDTH = 800;
        const MAP_HEIGHT = 600;
        
        let newX = this.x;
        let newY = this.y;
        
        switch(direction) {
            case 'up':
                newY = Math.max(0, this.y - TILE_SIZE);
                break;
            case 'down':
                newY = Math.min(MAP_HEIGHT - TILE_SIZE, this.y + TILE_SIZE);
                break;
            case 'left':
                newX = Math.max(0, this.x - TILE_SIZE);
                break;
            case 'right':
                newX = Math.min(MAP_WIDTH - TILE_SIZE, this.x + TILE_SIZE);
                break;
        }
        
        if (this.canMoveTo(newX, newY)) {
            this.isMoving = true;
            this.direction = direction;
            this.x = newX;
            this.y = newY;
            
            this.regenerateMana(2);
            
            this.element.classList.add('moving');
            this.element.style.transform = `translateZ(0) rotateY(${direction === 'left' ? '10deg' : direction === 'right' ? '-10deg' : '0deg'})`;
            this.createMovementParticles();
            this.updatePosition();
            
            if (Math.random() < 0.2) {
                const messages = [
                    `🚶 ${this.name} explora o terreno...`,
                    `👀 ${this.name} procura por oponentes...`,
                    `⚡ ${this.name} sente energia no ar...`,
                    `🗺️ ${this.name} avança cautelosamente...`
                ];
                addChatMessage(messages[Math.floor(Math.random() * messages.length)], 'system');
            }
            
            setTimeout(() => {
                this.isMoving = false;
                this.element.classList.remove('moving');
                this.element.style.transform = '';
                this.checkInteractions();
                this.updateMinimap();
            }, 250);
            
            return true;
        }
        
        return false;
    }
    
    createMovementParticles() {
        for (let i = 0; i < 3; i++) {
            const particle = document.createElement('div');
            particle.className = 'movement-particle';
            particle.style.left = (this.x + Math.random() * 32) + 'px';
            particle.style.top = (this.y + Math.random() * 32) + 'px';
            
            document.getElementById('charactersLayer').appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 1000);
        }
    }
    
    regenerateMana(amount) {
        this.mana = Math.min(this.maxMana, this.mana + amount);
        this.updateUI();
    }
    
    canMoveTo(x, y) {
        for (let player of Object.values(players)) {
            if (player !== this && 
                Math.abs(player.x - x) < 32 && 
                Math.abs(player.y - y) < 32) {
                return false;
            }
        }
        return true;
    }
    
    checkInteractions() {
        const INTERACTION_DISTANCE = 64;
        let nearbyPlayers = [];
        
        for (let player of Object.values(players)) {
            if (player !== this && player.currentLife > 0) {
                const distance = Math.sqrt(
                    Math.pow(this.x - player.x, 2) + 
                    Math.pow(this.y - player.y, 2)
                );
                
                if (distance <= INTERACTION_DISTANCE) {
                    nearbyPlayers.push(player);
                }
            }
        }
        
        if (nearbyPlayers.length > 0) {
            showInteractionPrompt(true);
            this.nearbyPlayers = nearbyPlayers;
            
            const opponent = nearbyPlayers[0];
            addChatMessage(`⚡ ${opponent.name} detectado! Nível ${opponent.level}`, 'system');
        } else {
            showInteractionPrompt(false);
            this.nearbyPlayers = [];
        }
    }
    
    updatePosition() {
        if (this.element) {
            this.element.style.left = this.x + 'px';
            this.element.style.top = this.y + 'px';
        }
    }
    
    updateUI() {
        if (this.element) {
            const nameElement = this.element.querySelector('.char-name');
            const levelElement = this.element.querySelector('.char-level');
            const healthBar = this.element.querySelector('.health-fill-small');
            const statusElement = this.element.querySelector('.char-status');
            const effectsElement = this.element.querySelector('.char-effects');
            
            if (nameElement) nameElement.textContent = this.name;
            if (levelElement) levelElement.textContent = `Nv.${this.level}`;
            if (healthBar) {
                const healthPercent = (this.currentLife / this.maxLife) * 100;
                healthBar.style.width = healthPercent + '%';
                
                if (healthPercent > 60) {
                    healthBar.style.backgroundColor = '#4CAF50';
                } else if (healthPercent > 30) {
                    healthBar.style.backgroundColor = '#FF9800';
                } else {
                    healthBar.style.backgroundColor = '#F44336';
                }
            }
            
            if (statusElement) {
                if (this.isDefending) {
                    statusElement.textContent = '🛡️ Defendendo';
                    statusElement.style.color = '#3498db';
                } else if (this.shield > 0) {
                    statusElement.textContent = `🛡️ Escudo: ${this.shield}`;
                    statusElement.style.color = '#9b59b6';
                } else if (this.statusEffects.size > 0) {
                    const effectsArray = Array.from(this.statusEffects.keys());
                    statusElement.textContent = effectsArray.map(e => this.getEffectIcon(e)).join(' ');
                    statusElement.style.color = '#e74c3c';
                } else {
                    statusElement.textContent = this.combos > 0 ? `🔥 Combo x${this.combos}` : '';
                    statusElement.style.color = '#f39c12';
                }
            }
            
            if (effectsElement) {
                effectsElement.innerHTML = '';
                this.statusEffects.forEach((duration, effect) => {
                    const effectIcon = document.createElement('div');
                    effectIcon.className = `effect-icon effect-${effect}`;
                    effectIcon.textContent = this.getEffectIcon(effect);
                    effectIcon.title = `${effect} (${duration} turnos)`;
                    effectsElement.appendChild(effectIcon);
                });
            }
            
            if (this.currentLife < this.maxLife * 0.25) {
                this.element.classList.add('low-health');
            } else {
                this.element.classList.remove('low-health');
            }
        }
        
        if (this === activePlayer) {
            updateActivePlayerPanel();
        }
    }
    
    getEffectIcon(effect) {
        const icons = {
            poison: '☠️',
            burn: '🔥',
            freeze: '❄️',
            shield: '🛡️',
            regen: '💚',
            boost: '⚡',
            bleed: '🩸',
            slow: '🐌',
            purify: '✨'
        };
        return icons[effect] || '❓';
    }
    
    updateMinimap() {
        const minimap = document.getElementById('minimapGrid');
        if (minimap) {
            const mapWidth = 800;
            const mapHeight = 600;
            const minimapWidth = 100;
            const minimapHeight = 80;
            
            const dotX = (this.x / mapWidth) * minimapWidth;
            const dotY = (this.y / mapHeight) * minimapHeight;
            
            const dot = document.getElementById(this.id === 'player1Char' ? 'player1Dot' : 'player2Dot');
            if (dot) {
                dot.style.left = dotX + 'px';
                dot.style.top = dotY + 'px';
            }
        }
    }
    
    performAction(action, target) {
        let result = { success: false, damage: 0, message: '', effect: null };
        
        if ((action === 'special' && this.mana < this.classData.specialCost) ||
            (action === 'ultimate' && this.mana < this.classData.ultimateCost)) {
            return {
                success: false,
                message: `💙 ${this.name} não tem mana suficiente!`
            };
        }
        
        switch(action) {
            case 'attack':
                result = this.basicAttack(target);
                break;
            case 'defend':
                result = this.defend();
                break;
            case 'special':
                result = this.specialAttack(target);
                break;
            case 'heal':
                result = this.heal();
                break;
            case 'ultimate':
                result = this.ultimateAttack(target);
                break;
            case 'flee':
                result = this.flee();
                break;
        }
        
        const timeSinceLastAction = Date.now() - this.lastActionTime;
        if (timeSinceLastAction < 3000 && result.success && action !== 'defend') {
            this.combos++;
            if (this.combos >= 3) {
                result.damage = Math.floor(result.damage * 1.2);
                result.message += ` COMBO x${this.combos}!`;
                this.createComboEffect();
            }
        } else {
            this.combos = 0;
        }
        
        this.lastActionTime = Date.now();
        
        if (result.effect) {
            this.applyVisualEffect(result.effect);
        }
        
        if (action === 'special') this.mana -= this.classData.specialCost;
        if (action === 'ultimate') this.mana -= this.classData.ultimateCost;
        
        this.processStatusEffects();
        
        this.updateCooldowns();
        
        return result;
    }

    createComboEffect() {
        const comboText = document.createElement('div');
        comboText.className = 'combo-text';
        comboText.textContent = `COMBO x${this.combos}!`;
        comboText.style.left = (this.x + 16) + 'px';
        comboText.style.top = (this.y - 20) + 'px';
        
        document.getElementById('charactersLayer').appendChild(comboText);
        
        setTimeout(() => {
            comboText.remove();
        }, 2000);
    }
    
    basicAttack(target) {
        const baseDamage = this.attack + Math.floor(this.level * 0.5);
        const variation = Math.floor(Math.random() * 10) - 5;
        let damage = Math.max(1, baseDamage + variation);
        
        const critChance = 0.1 + (this.level * 0.01) + (this.combos * 0.02);
        const isCrit = Math.random() < critChance;
        if (isCrit) {
            damage = Math.floor(damage * (1.5 + (this.combos * 0.1)));
            this.battleStats.criticalHits++;
            this.createCriticalEffect(target);
        }
        
        if (target.isDefending) {
            damage = Math.floor(damage * 0.4);
        }
        if (target.shield > 0) {
            const blockedDamage = Math.min(damage, target.shield);
            target.shield -= blockedDamage;
            damage -= blockedDamage;
            this.createShieldEffect(target);
        }
        
        if (damage > 0) {
            target.takeDamage(damage);
            this.battleStats.damageDealt += damage;
        }
        
        let message = `⚔️ ${this.name} atacou ${target.name}!`;
        if (isCrit) message += ' ✨CRÍTICO!✨';
        if (damage > 0) {
            message += ` ${damage} de dano!`;
        } else {
            message += ' Bloqueado!';
        }
        
        return {
            success: true,
            damage: damage,
            message: message,
            effect: 'attack',
            isCrit: isCrit
        };
    }
    
    createCriticalEffect(target) {
        const critEffect = document.createElement('div');
        critEffect.className = 'critical-effect';
        critEffect.textContent = 'CRÍTICO!';
        critEffect.style.left = (target.x + 16) + 'px';
        critEffect.style.top = (target.y - 30) + 'px';
        
        document.getElementById('charactersLayer').appendChild(critEffect);
        
        setTimeout(() => {
            critEffect.remove();
        }, 1500);
    }
    
    createShieldEffect(target) {
        const shieldEffect = document.createElement('div');
        shieldEffect.className = 'shield-effect';
        shieldEffect.textContent = '🛡️';
        shieldEffect.style.left = (target.x + 16) + 'px';
        shieldEffect.style.top = (target.y + 10) + 'px';
        
        document.getElementById('charactersLayer').appendChild(shieldEffect);
        
        setTimeout(() => {
            shieldEffect.remove();
        }, 1000);
    }
    
    defend() {
        this.isDefending = true;
        
        const shieldAmount = Math.floor(this.level * 2 + this.attack * 0.3);
        this.shield += shieldAmount;
        
        this.regenerateMana(this.classData.manaRegen);
        
        if (Math.random() < 0.4) {
            this.addStatusEffect('regen', 3);
        }
        
        return {
            success: true,
            damage: 0,
            message: `🛡️ ${this.name} assumiu posição defensiva! Escudo: +${shieldAmount}`,
            effect: 'defend'
        };
    }
    
    specialAttack(target) {
        if (this.specialCooldown > 0) {
            return {
                success: false,
                message: `⏰ ${this.classData.specialName} ainda não disponível! (${this.specialCooldown} turnos)`
            };
        }
        
        let damage, effectChance, effects, message;
        
        switch(this.characterClass) {
            case 'warrior':
                damage = Math.floor((this.attack + this.level) * 2.0);
                effectChance = 0.6;
                effects = ['bleed'];
                message = `⚡ ${this.name} usa ${this.classData.specialName}!`;
                break;
            case 'mage':
                damage = Math.floor((this.attack + this.level) * 1.8);
                effectChance = 0.7;
                effects = ['burn', 'freeze'];
                message = `🔥 ${this.name} lança ${this.classData.specialName}!`;
                break;
            case 'rogue':
                damage = Math.floor((this.attack + this.level) * 2.2);
                effectChance = 0.5;
                effects = ['poison', 'slow'];
                message = `🗡️ ${this.name} executa ${this.classData.specialName}!`;
                break;
            case 'healer':
                damage = Math.floor((this.attack + this.level) * 1.3);
                effectChance = 0.8;
                effects = ['purify'];
                message = `✨ ${this.name} invoca ${this.classData.specialName}!`;
                this.currentLife = Math.min(this.maxLife, this.currentLife + Math.floor(damage * 0.3));
                break;
            default:
                damage = Math.floor((this.attack + this.level) * 1.8);
                effectChance = 0.4;
                effects = ['burn', 'poison'];
        }
        
        if (target.isDefending) {
            damage = Math.floor(damage * 0.6);
        }
        
        if (target.shield > 0) {
            const blockedDamage = Math.min(damage, target.shield);
            target.shield -= blockedDamage;
            damage -= blockedDamage;
        }
        
        if (damage > 0) {
            target.takeDamage(damage);
            this.battleStats.damageDealt += damage;
            this.battleStats.specialsUsed++;
        }
        
        this.specialCooldown = 3;
        
        if (Math.random() < effectChance && effects.length > 0) {
            const effect = effects[Math.floor(Math.random() * effects.length)];
            if (effect === 'purify') {
                target.statusEffects.clear();
                message += ' Efeitos negativos removidos!';
            } else {
                target.addStatusEffect(effect, 4);
            }
        }
        
        return {
            success: true,
            damage: damage,
            message: message + ` ${damage} de dano!`,
            effect: 'special'
        };
    }
    
    heal() {
        if (this.healCooldown > 0) {
            return {
                success: false,
                message: `⏰ ${this.name} ainda não pode curar! (${this.healCooldown} turnos)`
            };
        }
        
        const healAmount = Math.floor(this.maxLife * 0.3);
        const oldLife = this.currentLife;
        this.currentLife = Math.min(this.maxLife, this.currentLife + healAmount);
        const actualHeal = this.currentLife - oldLife;
        
        this.healCooldown = 4;
        
        if (actualHeal > 0) {
            this.addStatusEffect('regen', 2);
            return {
                success: true,
                damage: -actualHeal,
                message: `💚 ${this.name} se curou! +${actualHeal} vida!`,
                effect: 'heal'
            };
        }
        
        return {
            success: false,
            message: `${this.name} já está com vida máxima!`
        };
    }
    
    ultimateAttack(target) {
        if (this.ultimateCooldown > 0) {
            return {
                success: false,
                message: `⏰ Ultimate não disponível! (${this.ultimateCooldown} turnos)`
            };
        }
        
        const ultimateDamage = Math.floor((this.attack + this.level * 2) * 2.5);
        let damage = ultimateDamage;
        
        if (target.isDefending) {
            damage = Math.floor(damage * 0.8);
        }
        
        target.takeDamage(damage);
        this.battleStats.damageDealt += damage;
        this.ultimateCooldown = 6;
        
        target.addStatusEffect('burn', 4);
        target.addStatusEffect('poison', 3);
        
        return {
            success: true,
            damage: damage,
            message: `💥 ${this.name} usou ULTIMATE DEVASTADOR! ${damage} de dano épico!`,
            effect: 'ultimate'
        };
    }
    
    flee() {
        const fleeChance = 0.6 + (this.level * 0.02) + ((this.maxLife - this.currentLife) / this.maxLife * 0.3);
        const escaped = Math.random() < fleeChance;
        
        if (escaped) {
            return {
                success: true,
                damage: 0,
                message: `🏃 ${this.name} conseguiu fugir da batalha!`,
                effect: 'flee',
                fled: true
            };
        } else {
            const damage = Math.floor(this.maxLife * 0.1);
            this.takeDamage(damage);
            return {
                success: false,
                damage: damage,
                message: `🚫 ${this.name} tentou fugir mas falhou! Perdeu ${damage} de vida!`,
                effect: 'flee-failed'
            };
        }
    }
    
    takeDamage(damage) {
        this.currentLife = Math.max(0, this.currentLife - damage);
        this.battleStats.damageReceived += damage;
        
        showFloatingDamage(this, damage, false, false);
        
        if (this.currentLife <= 0) {
            this.die();
        }
        
        this.updateUI();
    }
    
    addStatusEffect(effect, duration) {
        this.statusEffects.set(effect, duration);
        this.updateUI();
    }
    
    processStatusEffects() {
        this.statusEffects.forEach((duration, effect) => {
            switch(effect) {
                case 'poison':
                    const poisonDamage = Math.floor(this.maxLife * 0.05);
                    this.takeDamage(poisonDamage);
                    addChatMessage(`☠️ ${this.name} perdeu ${poisonDamage} de vida por veneno!`, 'system');
                    break;
                case 'burn':
                    const burnDamage = Math.floor(this.maxLife * 0.07);
                    this.takeDamage(burnDamage);
                    addChatMessage(`🔥 ${this.name} perdeu ${burnDamage} de vida por queimadura!`, 'system');
                    break;
                case 'regen':
                    const healAmount = Math.floor(this.maxLife * 0.08);
                    this.currentLife = Math.min(this.maxLife, this.currentLife + healAmount);
                    showFloatingDamage(this, healAmount, false, true);
                    addChatMessage(`💚 ${this.name} recuperou ${healAmount} de vida!`, 'system');
                    break;
                case 'freeze':
                    addChatMessage(`❄️ ${this.name} está congelado e perde o turno!`, 'system');
                    break;
            }
            
            this.statusEffects.set(effect, duration - 1);
            if (duration - 1 <= 0) {
                this.statusEffects.delete(effect);
            }
        });
        
        this.updateUI();
    }
    
    applyVisualEffect(effect) {
        if (!this.element) return;
        
        this.element.classList.add(`effect-${effect}`);
        
        setTimeout(() => {
            this.element.classList.remove(`effect-${effect}`);
        }, 1000);
    }
    
    updateCooldowns() {
        if (this.specialCooldown > 0) this.specialCooldown--;
        if (this.healCooldown > 0) this.healCooldown--;
        if (this.ultimateCooldown > 0) this.ultimateCooldown--;
    }
    
    die() {
        this.currentLife = 0;
        this.battleStats.losses++;
        
        if (this.element) {
            this.element.style.opacity = '0.5';
            this.element.style.filter = 'grayscale(100%)';
        }
        
        addChatMessage(`💀 ${this.name} foi derrotado!`, 'system');
    }
    
    revive() {
        this.currentLife = Math.floor(this.maxLife * 0.3);
        
        if (this.element) {
            this.element.style.opacity = '1';
            this.element.style.filter = 'none';
        }
        
        this.updateUI();
        addChatMessage(`✨ ${this.name} foi revivido!`, 'system');
    }
    
    gainExperience(amount) {
        this.experience += amount;

        const expNeeded = this.level * 100;
        if (this.experience >= expNeeded) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.level++;
        this.experience = 0;
        
        this.maxLife += Math.floor(Math.random() * 20) + 10;
        this.currentLife = this.maxLife;
        this.attack += Math.floor(Math.random() * 5) + 2;
        this.maxMana += Math.floor(Math.random() * 15) + 5;
        this.mana = this.maxMana;
        
        this.updateUI();
        addChatMessage(`🌟 ${this.name} subiu para o nível ${this.level}!`, 'system');
    }
}

const players = {};
let activePlayer = null;
let gameState = 'exploring'
let battleData = null;

const characterTemplates = [
    { name: "Akira", sprite: "🧙‍♂️", life: 100, attack: 25, class: "mage" },
    { name: "Dragão", sprite: "🐉", life: 140, attack: 22, class: "warrior" },
    { name: "Luna", sprite: "🔮", life: 90, attack: 30, class: "mage" },
    { name: "Thor", sprite: "⚡", life: 160, attack: 20, class: "warrior" },
    { name: "Ninja", sprite: "🥷", life: 85, attack: 32, class: "rogue" },
    { name: "Seraphina", sprite: "🧝‍♀️", life: 95, attack: 18, class: "healer" },
    { name: "Golem", sprite: "🗿", life: 180, attack: 15, class: "warrior" },
    { name: "Assassino", sprite: "🔪", life: 75, attack: 35, class: "rogue" }
];

function initializeGame() {
    const char1 = characterTemplates[Math.floor(Math.random() * characterTemplates.length)];
    const char2 = characterTemplates[Math.floor(Math.random() * characterTemplates.length)];
    
    players.player1 = new PixelCharacter(
        'player1Char', char1.name, char1.sprite, 100, 100, char1.life, char1.attack, char1.class
    );
    
    players.player2 = new PixelCharacter(
        'player2Char', char2.name, char2.sprite, 200, 200, char2.life, char2.attack, char2.class
    );
    
    activePlayer = players.player1;
    setActivePlayer('player1');
    
    drawMap();
    
    addChatMessage("🎮 Bem-vindo ao Pixel Adventure RPG!", 'system');
    addChatMessage("🗺️ Use WASD ou setas para mover seu personagem", 'system');
    addChatMessage("⚔️ Aproxime-se de outros jogadores para iniciar batalha!", 'system');
    addChatMessage(`👤 Você é ${char1.name} (${char1.class}) vs ${char2.name} (${char2.class})`, 'system');
    addChatMessage("💙 Ações especiais consomem mana - mova-se para regenerar!", 'system');
    
    updatePlayersCount();
}

function drawMap() {
    const canvas = document.getElementById('mapCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let x = 0; x < canvas.width; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    ctx.fillStyle = '#2d5016';
    
    const rocks = [
        {x: 300, y: 150}, {x: 500, y: 300}, {x: 150, y: 400},
        {x: 600, y: 100}, {x: 400, y: 450}, {x: 50, y: 250}
    ];
    
    rocks.forEach(rock => {
        ctx.fillRect(rock.x, rock.y, 32, 32);
        ctx.fillStyle = '#1a3309';
        ctx.fillRect(rock.x + 4, rock.y + 4, 24, 24);
        ctx.fillStyle = '#2d5016';
    });
}

function setActivePlayer(playerId) {
    if (!players[playerId]) {
        console.error('Jogador não encontrado:', playerId);
        return;
    }
    
    Object.values(players).forEach(player => {
        if (player.element) {
            player.element.classList.remove('active');
        }
    });
    
    activePlayer = players[playerId];
    if (activePlayer && activePlayer.element) {
        activePlayer.element.classList.add('active');
    }
    
    updateActivePlayerPanel();
}

function updateActivePlayerPanel() {
    if (!activePlayer) return;
    
    const avatar = document.querySelector('.player-avatar');
    const name = document.getElementById('activePlayerName');
    const life = document.getElementById('activePlayerLife');
    const mana = document.getElementById('activePlayerMana');
    const attack = document.getElementById('activePlayerAttack');
    const level = document.getElementById('activePlayerLevel');
    const healthBar = document.getElementById('activePlayerHealthBar');
    const manaBar = document.getElementById('activePlayerManaBar');
    
    if (avatar) avatar.textContent = activePlayer.sprite;
    if (name) name.textContent = `${activePlayer.name} (${activePlayer.characterClass})`;
    if (life) life.textContent = `${activePlayer.currentLife}/${activePlayer.maxLife}`;
    if (mana) mana.textContent = `${activePlayer.mana}/${activePlayer.maxMana}`;
    if (attack) attack.textContent = activePlayer.attack;
    if (level) level.textContent = `Nv.${activePlayer.level}`;
    
    const pos = document.getElementById('activePlayerPos');
    if (pos) pos.textContent = `X: ${Math.floor(activePlayer.x/32)}, Y: ${Math.floor(activePlayer.y/32)}`;
    
    if (healthBar) {
        const healthPercent = (activePlayer.currentLife / activePlayer.maxLife) * 100;
        healthBar.style.width = healthPercent + '%';
        
        if (healthPercent > 60) {
            healthBar.style.backgroundColor = '#4CAF50';
        } else if (healthPercent > 30) {
            healthBar.style.backgroundColor = '#FF9800';
        } else {
            healthBar.style.backgroundColor = '#F44336';
        }
    }

    if (manaBar) {
        const manaPercent = (activePlayer.mana / activePlayer.maxMana) * 100;
        manaBar.style.width = manaPercent + '%';
    }
    

    updateAbilitySlots();
}

function updateAbilitySlots() {
    const abilitySlots = document.querySelectorAll('.ability-slot');
    
    if (abilitySlots.length >= 3) {

        abilitySlots[0].className = 'ability-slot';
        abilitySlots[0].textContent = '⚡';
        abilitySlots[0].title = `${activePlayer.classData.specialName} - ${activePlayer.classData.specialCost} mana`;;
        
        if (activePlayer.specialCooldown > 0) {
            abilitySlots[0].classList.add('cooldown');
            abilitySlots[0].title += ` (${activePlayer.specialCooldown} turnos)`;
        } else if (activePlayer.mana < activePlayer.classData.specialCost) {
            abilitySlots[0].classList.add('no-mana');
            abilitySlots[0].title += ' (Sem mana)';
        }
        
        abilitySlots[1].className = 'ability-slot';
        abilitySlots[1].textContent = '💚';
        abilitySlots[1].title = 'Curar';
        
        if (activePlayer.healCooldown > 0) {
            abilitySlots[1].classList.add('cooldown');
            abilitySlots[1].title += ` (${activePlayer.healCooldown} turnos)`;
        }
        
        abilitySlots[2].className = 'ability-slot';
        abilitySlots[2].textContent = '💥';
        abilitySlots[2].title = `${activePlayer.classData.ultimateName} - ${activePlayer.classData.ultimateCost} mana`;;
        
        if (activePlayer.ultimateCooldown > 0) {
            abilitySlots[2].classList.add('cooldown');
            abilitySlots[2].title += ` (${activePlayer.ultimateCooldown} turnos)`;
        } else if (activePlayer.mana < activePlayer.classData.ultimateCost) {
            abilitySlots[2].classList.add('no-mana');
            abilitySlots[2].title += ' (Sem mana)';
        }
    }
}

function showInteractionPrompt(show) {
    const prompt = document.getElementById('interactionPrompt');
    if (show) {
        prompt.classList.add('show');
    } else {
        prompt.classList.remove('show');
    }
}

function addChatMessage(message, type = 'system') {
    const chatLog = document.getElementById('chatLog');
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${type}`;
    messageElement.textContent = message;
    
    chatLog.appendChild(messageElement);
    chatLog.scrollTop = chatLog.scrollHeight;

    while (chatLog.children.length > 50) {
        chatLog.removeChild(chatLog.firstChild);
    }
}

function createProximityEffect(player1, player2) {
    const effect = document.createElement('div');
    effect.className = 'proximity-effect';
    effect.textContent = '⚡';
    
    const midX = (player1.x + player2.x) / 2;
    const midY = (player1.y + player2.y) / 2;
    
    effect.style.left = midX + 'px';
    effect.style.top = midY + 'px';
    
    document.getElementById('charactersLayer').appendChild(effect);
    
    setTimeout(() => {
        effect.remove();
    }, 2000);
}

function showFloatingDamage(target, damage, isCrit = false, isHeal = false) {
    const damageText = document.createElement('div');
    damageText.className = `floating-damage ${isCrit ? 'critical' : ''} ${isHeal ? 'heal' : ''}`;
    
    if (isHeal) {
        damageText.textContent = `+${damage}`;
        damageText.style.color = '#27ae60';
    } else {
        damageText.textContent = `-${damage}`;
        damageText.style.color = isCrit ? '#e74c3c' : '#f39c12';
    }
    
    damageText.style.left = (target.x + Math.random() * 20) + 'px';
    damageText.style.top = (target.y - 10) + 'px';
    
    document.getElementById('charactersLayer').appendChild(damageText);
    
    setTimeout(() => {
        damageText.remove();
    }, 2000);
}

function addSystemMessage(message, icon = '🎮') {
    addChatMessage(`${icon} ${message}`, 'system');
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (message) {

        if (!processChatCommand(message)) {
            addChatMessage(`${activePlayer.name}: ${message}`, activePlayer.id);
        }
        input.value = '';
    }
}


function updatePlayersCount() {
    const count = Object.keys(players).length;
    document.getElementById('playersCount').textContent = count;
}

function interact() {
    if (activePlayer && activePlayer.nearbyPlayers && activePlayer.nearbyPlayers.length > 0) {
        const targetPlayer = activePlayer.nearbyPlayers[0];
        startBattle(activePlayer, targetPlayer);
    }
}


function startBattle(player1, player2) {
    gameState = 'battle';
    battleData = {
        player1: player1,
        player2: player2,
        currentTurn: player1,
        round: 1
    };
    
    showBattleModal(true);
    updateBattleUI();
    
    addChatMessage(`⚔️ Batalha iniciada: ${player1.name} vs ${player2.name}!`, 'system');
}

function showBattleModal(show) {
    const modal = document.getElementById('battleModal');
    if (show) {
        modal.classList.add('show');
    } else {
        modal.classList.remove('show');
    }
}


function updateBattleUI() {
    if (!battleData) return;
    
    const { player1, player2, currentTurn } = battleData;
    
    const leftSprite = document.getElementById('leftFighterSprite');
    const leftName = document.getElementById('leftFighterName');
    const leftHealthText = document.getElementById('leftFighterHealthText');
    const leftManaText = document.getElementById('leftFighterManaText');
    const leftHealth = document.getElementById('leftFighterHealth');
    const leftMana = document.getElementById('leftFighterMana');
    
    if (leftSprite) leftSprite.textContent = player1.sprite;
    if (leftName) leftName.textContent = player1.name;
    if (leftHealthText) leftHealthText.textContent = `${player1.currentLife}/${player1.maxLife}`;
    if (leftManaText) leftManaText.textContent = `${player1.mana}/${player1.maxMana}`;
    
    const rightSprite = document.getElementById('rightFighterSprite');
    const rightName = document.getElementById('rightFighterName');
    const rightHealthText = document.getElementById('rightFighterHealthText');
    const rightHealth = document.getElementById('rightFighterHealth');
    
    if (rightSprite) rightSprite.textContent = player2.sprite;
    if (rightName) rightName.textContent = player2.name;
    if (rightHealthText) rightHealthText.textContent = `${player2.currentLife}/${player2.maxLife}`;

    const p1HealthPercent = (player1.currentLife / player1.maxLife) * 100;
    const p2HealthPercent = (player2.currentLife / player2.maxLife) * 100;
    const p1ManaPercent = (player1.mana / player1.maxMana) * 100;
    
    if (leftHealth) leftHealth.style.width = p1HealthPercent + '%';
    if (rightHealth) rightHealth.style.width = p2HealthPercent + '%';
    if (leftMana) leftMana.style.width = p1ManaPercent + '%';
    

    updateFighterStatus('leftFighterStatus', player1);
    updateFighterStatus('rightFighterStatus', player2);
    

    const turnIndicator = document.getElementById('turnIndicator');
    if (turnIndicator) {
        if (currentTurn === activePlayer) {
            turnIndicator.textContent = 'Seu turno!';
        } else {
            turnIndicator.textContent = `Turno de ${currentTurn.name}`;
        }
    }
    
    const activePortrait = document.getElementById('activePortrait');
    const activePlayerHP = document.getElementById('activePlayerHP');
    const activePlayerMP = document.getElementById('activePlayerMP');
    const activePlayerHPText = document.getElementById('activePlayerHPText');
    const activePlayerMPText = document.getElementById('activePlayerMPText');
    
    if (activePortrait) activePortrait.textContent = activePlayer.sprite;
    if (activePlayerHPText) activePlayerHPText.textContent = `${activePlayer.currentLife}/${activePlayer.maxLife}`;
    if (activePlayerMPText) activePlayerMPText.textContent = `${activePlayer.mana}/${activePlayer.maxMana}`;
    
    const activeHPPercent = (activePlayer.currentLife / activePlayer.maxLife) * 100;
    const activeMPPercent = (activePlayer.mana / activePlayer.maxMana) * 100;
    
    if (activePlayerHP) activePlayerHP.style.width = activeHPPercent + '%';
    if (activePlayerMP) activePlayerMP.style.width = activeMPPercent + '%';
    
    updateBattleButtons(currentTurn);
    
    const leftFighter = document.getElementById('leftFighter');
    const rightFighter = document.getElementById('rightFighter');
    
    if (leftFighter) leftFighter.classList.toggle('active', currentTurn === player1);
    if (rightFighter) rightFighter.classList.toggle('active', currentTurn === player2);
}

function updateFighterStatus(elementId, player) {
    const statusElement = document.getElementById(elementId);
    if (!statusElement) return;
    
    let statusText = '';
    
    if (player.isDefending) {
        statusText += '🛡️ Defendendo ';
    }
    if (player.shield > 0) {
        statusText += `⚡ Escudo: ${player.shield} `;
    }
    if (player.statusEffects.size > 0) {
        player.statusEffects.forEach((duration, effect) => {
            statusText += `${player.getEffectIcon(effect)} `;
        });
    }
    
    statusElement.textContent = statusText;
}

function updateBattleButtons(currentPlayer) {
    const attackBtn = document.getElementById('attackBtn');
    const specialBtn = document.getElementById('specialBtn');
    const healBtn = document.getElementById('healBtn');
    const fleeBtn = document.getElementById('fleeBtn');
    
    const isPlayerTurn = currentPlayer === activePlayer;
    
    if (attackBtn) attackBtn.disabled = !isPlayerTurn;
    if (fleeBtn) fleeBtn.disabled = !isPlayerTurn;
    
    if (specialBtn) {
        specialBtn.disabled = !isPlayerTurn || 
            currentPlayer.specialCooldown > 0 || 
            currentPlayer.mana < currentPlayer.classData.specialCost;
        
        const specialDesc = specialBtn.querySelector('.action-desc');
        if (specialDesc) {
            if (currentPlayer.specialCooldown > 0) {
                specialDesc.textContent = `Cooldown: ${currentPlayer.specialCooldown}`;
            } else {
                specialDesc.textContent = `${currentPlayer.classData.specialCost} mana`;
            }
        }
    }
    
    if (healBtn) {
        healBtn.disabled = !isPlayerTurn || currentPlayer.healCooldown > 0;
        
        const healDesc = healBtn.querySelector('.action-desc');
        if (healDesc) {
            if (currentPlayer.healCooldown > 0) {
                healDesc.textContent = `Cooldown: ${currentPlayer.healCooldown}`;
            } else {
                healDesc.textContent = '+30% vida';
            }
        }
    }
}

function battleAction(action) {
    if (!battleData || gameState !== 'battle') return;
    
    const attacker = battleData.currentTurn;
    const target = attacker === battleData.player1 ? battleData.player2 : battleData.player1;
    
    const result = attacker.performAction(action, target);
    
    if (result.message) {
        addChatMessage(result.message, result.success ? 'system' : 'system');
    }
    
    if (result.fled) {
        setTimeout(() => {
            endBattle('fled');
        }, 1000);
        return;
    }
    
    if (!result.success && action !== 'flee') {
        return;
    }
    
    if (target.currentLife <= 0) {
        setTimeout(() => {
            endBattle('victory');
        }, 1000);
        return;
    }
    
    if (action !== 'flee' || result.success) {
        attacker.regenerateMana(attacker.classData.manaRegen);
    }
    
    if (action !== 'flee') {
        setTimeout(() => {
            target.processStatusEffects();
            updateBattleUI();
        }, 500);
        
        setTimeout(() => {
            if (target.currentLife <= 0) {
                endBattle('victory');
                return;
            }
        }, 1000);
    }
    
    battleData.currentTurn = target;
    updateBattleUI();
    
    if (battleData.currentTurn !== activePlayer) {
        setTimeout(() => {
            let chosenAction;
            
            if (battleData.currentTurn.currentLife < battleData.currentTurn.maxLife * 0.2) {
                chosenAction = Math.random() < 0.3 ? 'flee' : Math.random() < 0.7 ? 'heal' : 'attack';
            } else if (battleData.currentTurn.currentLife < battleData.currentTurn.maxLife * 0.4) {
                chosenAction = Math.random() < 0.6 ? 'heal' : 'attack';
            } else if (battleData.currentTurn.mana >= battleData.currentTurn.classData.specialCost) {
                chosenAction = Math.random() < 0.4 ? 'special' : 'attack';
            } else {
                chosenAction = 'attack';
            }
            
            battleAction(chosenAction);
        }, 1500);
    }
}

function endBattle(result) {
    if (!battleData) return;
    
    let message = '';
    const { player1, player2, currentTurn } = battleData;
    
    switch(result) {
        case 'victory':
            const winner = player1.currentLife > 0 ? player1 : player2;
            const loser = player1.currentLife <= 0 ? player1 : player2;
            
            winner.gainExperience(50 + loser.level * 10);
            winner.battleStats.wins++;
            
            message = `🏆 ${winner.name} venceu a batalha épica!`;
            addChatMessage(`⭐ ${winner.name} ganhou ${50 + loser.level * 10} XP!`, 'system');
            
            const battleVictoryMessage = document.getElementById('battleVictoryMessage');
            if (battleVictoryMessage) {
                battleVictoryMessage.innerHTML = `
                    🎉 VITÓRIA! 🎉<br>
                    <span style="font-size: 16px;">${winner.name} venceu a batalha!</span>
                `;
                battleVictoryMessage.classList.add('show');
                
                setTimeout(() => {
                    battleVictoryMessage.classList.remove('show');
                }, 3000);
            }
            
            setTimeout(() => {
                addChatMessage("🎉 PARABÉNS! VOCÊ GANHOU O JOGO! 🎉", 'victory');
                addChatMessage("🔄 O jogo será reiniciado automaticamente em 5 segundos...", 'system');
                addChatMessage("💡 Ou pressione 'R' para reiniciar agora!", 'system');
                
                setTimeout(() => {
                    restartGame();
                }, 5000);
            }, 3500);
            
            break;
        case 'fled':
            message = `🏃 ${currentTurn.name} fugiu da batalha!`;
            break;
    }
    
    addChatMessage(message, 'system');
    
    setTimeout(() => {
        gameState = 'exploring';
        showBattleModal(false);
        

        Object.values(players).forEach(player => {
            player.isDefending = false;
            player.combos = 0;
        });
        
        battleData = null;
        
        updateActivePlayerPanel();
        addChatMessage("🎮 Você voltou ao modo de exploração!", 'system');
    }, result === 'victory' ? 3000 : 0); 
}

function processChatCommand(message) {
    if (message.startsWith('/')) {
        const command = message.slice(1).toLowerCase();
        
        switch(command) {
            case 'random':
                randomizeCharacters();
                return true;
            case 'reset':
                resetPositions();
                return true;
            case 'restart':
                restartGame();
                return true;
            case 'heal':
                activePlayer.heal(50);
                return true;
            case 'help':
                addChatMessage("📋 Comandos: /random, /reset, /restart, /heal, /help", 'system');
                return true;
        }
    }
    return false;
}

function randomizeCharacters() {
    const shuffled = [...characterTemplates].sort(() => 0.5 - Math.random());
    
    Object.values(players).forEach((player, index) => {
        const template = shuffled[index];
        player.name = template.name;
        player.sprite = template.sprite;
        player.maxLife = template.life;
        player.currentLife = template.life;
        player.attack = template.attack;
        
        player.element.querySelector('.char-sprite').textContent = template.sprite;
        player.updateUI();
    });
    
    updateActivePlayerPanel();
    addChatMessage("🔄 Personagens aleatórios gerados!", 'system');
}

function resetPositions() {
    players.player1.x = 100;
    players.player1.y = 100;
    players.player2.x = 200;
    players.player2.y = 200;
    
    Object.values(players).forEach(player => {
        player.updatePosition();
        player.currentLife = player.maxLife;
        player.updateUI();
        player.element.style.opacity = '1';
        player.element.style.filter = 'none';
    });
    
    addChatMessage("📍 Posições resetadas!", 'system');
}

function restartGame() {
    Object.values(players).forEach(player => {
        player.currentLife = player.maxLife;
        player.mana = player.maxMana;
        player.level = Math.floor(Math.random() * 10) + 8;
        player.experience = 0;
        player.shield = 0;
        player.combos = 0;
        player.isDefending = false;
        player.specialCooldown = 0;
        player.healCooldown = 0;
        player.ultimateCooldown = 0;
        player.statusEffects.clear();
        player.battleStats = {
            wins: 0,
            losses: 0,
            damageDealt: 0,
            damageReceived: 0,
            specialsUsed: 0,
            healsUsed: 0,
            criticalHits: 0
        };
        player.element.style.opacity = '1';
        player.element.style.filter = 'none';
    });
    
    resetPositions();
    
    gameState = 'exploring';
    showBattleModal(false);
    battleData = null;
    
    const chatLog = document.getElementById('chatLog');
    chatLog.innerHTML = `
        <div class="chat-message system">🎮 Jogo reiniciado! Bem-vindo de volta ao Pixel Adventure!</div>
        <div class="chat-message system">🗺️ Use WASD ou setas para mover</div>
        <div class="chat-message system">⚔️ Aproxime-se de outros jogadores para batalhar!</div>
    `;
    
    updateActivePlayerPanel();
    updateMinimap();
    
    addChatMessage("🔄 Jogo reiniciado com sucesso!", 'system');
}

document.addEventListener('keydown', function(e) {
    if (!activePlayer) return;
    
    if (e.key === 'Enter') {
        const chatInput = document.getElementById('chatInput');
        if (document.activeElement === chatInput) {
            sendChatMessage();
        } else {
            chatInput.focus();
        }
        return;
    }
    
    if (document.activeElement.tagName === 'INPUT') return;
    
    if (gameState === 'battle') {
        switch(e.key.toLowerCase()) {
            case '1':
                battleAction('attack');
                break;
            case '2':
                battleAction('special');
                break;
            case '3':
                battleAction('heal');
                break;
            case 'escape':
                battleAction('flee');
                break;
        }
        return;
    }
    
    if (gameState === 'exploring') {
        let moved = false;
        
        switch(e.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                moved = activePlayer.move('up');
                break;
            case 's':
            case 'arrowdown':
                moved = activePlayer.move('down');
                break;
            case 'a':
            case 'arrowleft':
                moved = activePlayer.move('left');
                break;
            case 'd':
            case 'arrowright':
                moved = activePlayer.move('right');
                break;
            case ' ':
                interact();
                break;
            case 'r':
                if (confirm('🔄 Deseja reiniciar o jogo? Todos os progressos serão perdidos.')) {
                    restartGame();
                }
                break;
            case 'tab':
                e.preventDefault();
                const playerIds = Object.keys(players);
                let currentPlayerId = null;
                
                for (let id in players) {
                    if (players[id] === activePlayer) {
                        currentPlayerId = id;
                        break;
                    }
                }
                
                if (currentPlayerId) {
                    const currentIndex = playerIds.indexOf(currentPlayerId);
                    const nextIndex = (currentIndex + 1) % playerIds.length;
                    const nextPlayerId = playerIds[nextIndex];
                    setActivePlayer(nextPlayerId);
                    addChatMessage(`🔄 Jogador ativo alterado para ${players[nextPlayerId].name}`, 'system');
                }
                break;
        }
        
        if (moved) {
            updateActivePlayerPanel();
        }
    }
});

document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
    
    const chatInput = document.getElementById('chatInput');
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
});
