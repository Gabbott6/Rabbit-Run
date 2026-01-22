// Game Scene - Main Gameplay
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.currentFloor = data.floor || 1;
        this.gameOver = false;
        this.gameWon = false;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.score = data.score || 0;
        this.hasRequiredBerry = false;
        this.bonusBerriesCollected = 0;

        // Generate the level procedurally
        this.levelData = this.generateLevel(this.currentFloor);
    }

    generateLevel(floor) {
        const gen = LEVEL_GEN;

        // Calculate arena size (grows with floor, capped)
        const arenaWidth = Math.min(
            gen.BASE_ARENA_WIDTH + (floor - 1) * gen.ARENA_GROWTH,
            gen.MAX_ARENA_WIDTH
        );
        const arenaHeight = Math.min(
            gen.BASE_ARENA_HEIGHT + (floor - 1) * gen.ARENA_GROWTH,
            gen.MAX_ARENA_HEIGHT
        );

        // Calculate wolf count
        const wolfCount = Math.min(
            Math.floor(gen.BASE_WOLF_COUNT + (floor - 1) * gen.WOLF_INCREMENT),
            gen.MAX_WOLVES
        );

        // Calculate wolf speed multiplier
        const wolfSpeedMultiplier = Math.min(
            1 + (floor - 1) * gen.WOLF_SPEED_INCREMENT,
            gen.MAX_WOLF_SPEED_MULTIPLIER
        );

        // Calculate platform count
        const platformCount = Math.min(
            Math.floor(gen.BASE_PLATFORMS + (floor - 1) * gen.PLATFORM_INCREMENT),
            gen.MAX_PLATFORMS
        );

        // Vertical wall probability
        const verticalChance = Math.min(
            gen.BASE_VERTICAL_CHANCE + (floor - 1) * gen.VERTICAL_CHANCE_INCREMENT,
            gen.MAX_VERTICAL_CHANCE
        );

        // Fixed positions: rabbit starts bottom-left, home is top-right
        const rabbitStart = { x: 80, y: arenaHeight - 80 };
        const homePosition = { x: arenaWidth - 60, y: 80 };

        // Generate random platforms avoiding safe zones
        const platforms = this.generatePlatforms(
            platformCount, arenaWidth, arenaHeight,
            rabbitStart, homePosition, verticalChance
        );

        // Generate berry positions
        const berryPositions = this.generateBerryPositions(
            arenaWidth, arenaHeight, rabbitStart, homePosition, platforms
        );

        // Generate floor name
        const nameIndex = (floor - 1) % gen.FLOOR_NAMES.length;
        const modifierIndex = Math.floor((floor - 1) / gen.FLOOR_NAMES.length) % gen.FLOOR_MODIFIERS.length;
        const name = `${gen.FLOOR_MODIFIERS[modifierIndex]}${gen.FLOOR_NAMES[nameIndex]}`;

        return {
            name: `Floor ${floor}: ${name}`,
            floor: floor,
            wolfCount: wolfCount,
            wolfSpeedMultiplier: wolfSpeedMultiplier,
            arenaWidth: arenaWidth,
            arenaHeight: arenaHeight,
            platforms: platforms,
            rabbitStart: rabbitStart,
            homePosition: homePosition,
            requiredBerry: berryPositions.required,
            bonusBerries: berryPositions.bonus
        };
    }

    generatePlatforms(count, arenaWidth, arenaHeight, rabbitStart, homePosition, verticalChance) {
        const platforms = [];
        const gen = LEVEL_GEN;
        const maxAttempts = 50;

        for (let i = 0; i < count; i++) {
            let placed = false;
            let attempts = 0;

            while (!placed && attempts < maxAttempts) {
                attempts++;

                const isVertical = Math.random() < verticalChance;
                let platform;

                if (isVertical) {
                    // Vertical wall
                    const height = Phaser.Math.Between(gen.WALL_MIN_HEIGHT, gen.WALL_MAX_HEIGHT);
                    const x = Phaser.Math.Between(150, arenaWidth - 150);
                    const y = Phaser.Math.Between(height / 2 + 50, arenaHeight - height / 2 - 50);
                    platform = { x, y, width: gen.WALL_WIDTH, height };
                } else {
                    // Horizontal platform
                    const width = Phaser.Math.Between(gen.PLATFORM_MIN_LENGTH, gen.PLATFORM_MAX_LENGTH);
                    const x = Phaser.Math.Between(width / 2 + 50, arenaWidth - width / 2 - 50);
                    const y = Phaser.Math.Between(150, arenaHeight - 150);
                    platform = { x, y, width, height: gen.PLATFORM_HEIGHT };
                }

                // Check safe zones
                const distToRabbit = Math.hypot(platform.x - rabbitStart.x, platform.y - rabbitStart.y);
                const distToHome = Math.hypot(platform.x - homePosition.x, platform.y - homePosition.y);

                if (distToRabbit < gen.SPAWN_SAFE_RADIUS || distToHome < gen.HOME_SAFE_RADIUS) {
                    continue;
                }

                // Check overlap with existing platforms
                let overlaps = false;
                for (const existing of platforms) {
                    if (this.platformsOverlap(platform, existing, 40)) {
                        overlaps = true;
                        break;
                    }
                }

                if (!overlaps) {
                    platforms.push(platform);
                    placed = true;
                }
            }
        }

        return platforms;
    }

    platformsOverlap(a, b, padding = 0) {
        return !(a.x + a.width / 2 + padding < b.x - b.width / 2 ||
                 a.x - a.width / 2 - padding > b.x + b.width / 2 ||
                 a.y + a.height / 2 + padding < b.y - b.height / 2 ||
                 a.y - a.height / 2 - padding > b.y + b.height / 2);
    }

    generateBerryPositions(arenaWidth, arenaHeight, rabbitStart, homePosition, platforms) {
        const positions = { required: null, bonus: [] };
        const gen = LEVEL_GEN;
        const maxAttempts = 100;

        // Generate required berry (somewhere in the middle area)
        let attempts = 0;
        while (!positions.required && attempts < maxAttempts) {
            attempts++;
            const x = Phaser.Math.Between(arenaWidth * 0.3, arenaWidth * 0.7);
            const y = Phaser.Math.Between(arenaHeight * 0.3, arenaHeight * 0.7);

            if (this.isValidBerryPosition(x, y, rabbitStart, homePosition, platforms, [])) {
                positions.required = { x, y };
            }
        }

        // Fallback if no valid position found
        if (!positions.required) {
            positions.required = { x: arenaWidth / 2, y: arenaHeight / 2 };
        }

        // Generate 3 bonus berries spread across the map
        const zones = [
            { minX: 0.1, maxX: 0.4, minY: 0.1, maxY: 0.4 },      // Top-left
            { minX: 0.6, maxX: 0.9, minY: 0.5, maxY: 0.9 },      // Bottom-right
            { minX: 0.5, maxX: 0.9, minY: 0.1, maxY: 0.4 }       // Top-right area
        ];

        for (const zone of zones) {
            attempts = 0;
            let placed = false;

            while (!placed && attempts < maxAttempts) {
                attempts++;
                const x = Phaser.Math.Between(arenaWidth * zone.minX, arenaWidth * zone.maxX);
                const y = Phaser.Math.Between(arenaHeight * zone.minY, arenaHeight * zone.maxY);

                const allBerries = [positions.required, ...positions.bonus];
                if (this.isValidBerryPosition(x, y, rabbitStart, homePosition, platforms, allBerries)) {
                    positions.bonus.push({ x, y });
                    placed = true;
                }
            }

            // Fallback
            if (!placed) {
                positions.bonus.push({
                    x: Phaser.Math.Between(arenaWidth * zone.minX, arenaWidth * zone.maxX),
                    y: Phaser.Math.Between(arenaHeight * zone.minY, arenaHeight * zone.maxY)
                });
            }
        }

        return positions;
    }

    isValidBerryPosition(x, y, rabbitStart, homePosition, platforms, existingBerries) {
        const gen = LEVEL_GEN;

        // Check distance from spawn and home
        if (Math.hypot(x - rabbitStart.x, y - rabbitStart.y) < gen.SPAWN_SAFE_RADIUS) return false;
        if (Math.hypot(x - homePosition.x, y - homePosition.y) < gen.HOME_SAFE_RADIUS) return false;

        // Check distance from other berries
        for (const berry of existingBerries) {
            if (berry && Math.hypot(x - berry.x, y - berry.y) < gen.BERRY_SAFE_RADIUS * 2) return false;
        }

        // Check not inside platforms
        for (const plat of platforms) {
            if (x > plat.x - plat.width / 2 - 20 && x < plat.x + plat.width / 2 + 20 &&
                y > plat.y - plat.height / 2 - 20 && y < plat.y + plat.height / 2 + 20) {
                return false;
            }
        }

        return true;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Set world bounds
        this.physics.world.setBounds(
            (width - this.levelData.arenaWidth) / 2,
            (height - this.levelData.arenaHeight) / 2,
            this.levelData.arenaWidth,
            this.levelData.arenaHeight
        );

        // Create background and arena
        this.createArena(width, height);

        // Create platforms
        this.createPlatforms();

        // Create home burrow (goal)
        this.createHomeBurrow();

        // Create berries
        this.createBerries();

        // Create player
        this.createPlayer();

        // Create wolf pack
        this.createWolfPack();

        // Create UI
        this.createUI(width);

        // Setup input
        this.setupInput();

        // Camera fade in
        this.cameras.main.fadeIn(500);

        // Start timer
        this.startTime = this.time.now;

        // Debug mode (press D to toggle)
        this.debugMode = false;
        this.debugGraphics = this.add.graphics();
        this.input.keyboard.on('keydown-D', () => {
            this.debugMode = !this.debugMode;
        });
    }

    createArena(width, height) {
        // Background
        this.add.rectangle(width / 2, height / 2, width, height, COLORS.BACKGROUND);

        // Arena border glow
        const bounds = this.physics.world.bounds;
        const borderGraphics = this.add.graphics();

        // Outer glow
        borderGraphics.lineStyle(8, COLORS.NEON_MAGENTA, 0.2);
        borderGraphics.strokeRect(bounds.x - 4, bounds.y - 4, bounds.width + 8, bounds.height + 8);

        borderGraphics.lineStyle(4, COLORS.NEON_CYAN, 0.4);
        borderGraphics.strokeRect(bounds.x - 2, bounds.y - 2, bounds.width + 4, bounds.height + 4);

        borderGraphics.lineStyle(2, COLORS.NEON_CYAN, 0.8);
        borderGraphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

        // Grid pattern on floor
        const gridGraphics = this.add.graphics();
        gridGraphics.lineStyle(1, COLORS.NEON_MAGENTA, 0.1);

        const gridSize = 50;
        for (let x = bounds.x; x <= bounds.x + bounds.width; x += gridSize) {
            gridGraphics.lineBetween(x, bounds.y, x, bounds.y + bounds.height);
        }
        for (let y = bounds.y; y <= bounds.y + bounds.height; y += gridSize) {
            gridGraphics.lineBetween(bounds.x, y, bounds.x + bounds.width, y);
        }
    }

    createPlatforms() {
        this.platforms = this.physics.add.staticGroup();
        const bounds = this.physics.world.bounds;

        this.levelData.platforms.forEach(plat => {
            const x = bounds.x + plat.x;
            const y = bounds.y + plat.y;

            // Platform graphics
            const platform = this.add.graphics();
            platform.fillStyle(COLORS.PLATFORM, 1);
            platform.fillRect(-plat.width / 2, -plat.height / 2, plat.width, plat.height);

            // Platform glow
            platform.lineStyle(2, COLORS.NEON_CYAN, 0.5);
            platform.strokeRect(-plat.width / 2, -plat.height / 2, plat.width, plat.height);

            platform.setPosition(x, y);

            // Physics body
            const platBody = this.add.rectangle(x, y, plat.width, plat.height, 0x000000, 0);
            this.physics.add.existing(platBody, true);
            this.platforms.add(platBody);
        });
    }

    createHomeBurrow() {
        const bounds = this.physics.world.bounds;
        const homeX = bounds.x + this.levelData.homePosition.x;
        const homeY = bounds.y + this.levelData.homePosition.y;

        // Burrow graphics
        this.homeBurrow = this.add.graphics();
        this.homeBurrow.setPosition(homeX, homeY);

        // Burrow hole
        this.homeBurrow.fillStyle(0x2a1a1a, 1);
        this.homeBurrow.fillEllipse(0, 0, 60, 40);

        // Burrow entrance
        this.homeBurrow.fillStyle(0x1a0a0a, 1);
        this.homeBurrow.fillEllipse(0, 5, 40, 25);

        // Glow ring
        this.homeBurrow.lineStyle(3, COLORS.NEON_GREEN, 0.8);
        this.homeBurrow.strokeEllipse(0, 0, 70, 50);

        // Pulsing outer ring
        this.homeGlow = this.add.graphics();
        this.homeGlow.setPosition(homeX, homeY);

        // Home label
        this.add.text(homeX, homeY - 45, 'HOME', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: '14px',
            color: '#00ff00'
        }).setOrigin(0.5);

        // Home hitbox
        this.homeZone = this.add.circle(homeX, homeY, 30, 0x000000, 0);
        this.physics.add.existing(this.homeZone, true);
    }

    createBerries() {
        const bounds = this.physics.world.bounds;
        this.berries = [];

        // Create required berry (golden/special)
        const reqPos = this.levelData.requiredBerry;
        const reqX = bounds.x + reqPos.x;
        const reqY = bounds.y + reqPos.y;

        const requiredBerry = this.createBerryGraphic(reqX, reqY, true);
        requiredBerry.isRequired = true;
        requiredBerry.collected = false;
        this.berries.push(requiredBerry);

        // Create bonus berries
        this.levelData.bonusBerries.forEach(pos => {
            const x = bounds.x + pos.x;
            const y = bounds.y + pos.y;

            const bonusBerry = this.createBerryGraphic(x, y, false);
            bonusBerry.isRequired = false;
            bonusBerry.collected = false;
            this.berries.push(bonusBerry);
        });
    }

    createBerryGraphic(x, y, isRequired) {
        const container = this.add.container(x, y);

        const berry = this.add.graphics();

        // Berry color: golden for required, red for bonus
        const berryColor = isRequired ? 0xffdd00 : 0xff3366;
        const glowColor = isRequired ? 0xffff00 : 0xff0066;

        // Glow effect
        berry.fillStyle(glowColor, 0.3);
        berry.fillCircle(0, 0, 18);

        // Main berry body
        berry.fillStyle(berryColor, 1);
        berry.fillCircle(0, 0, 12);

        // Berry shine
        berry.fillStyle(0xffffff, 0.6);
        berry.fillCircle(-4, -4, 4);

        // Small leaf on top
        berry.fillStyle(0x44aa44, 1);
        berry.fillEllipse(2, -12, 8, 5);

        container.add(berry);

        // Add label for required berry
        if (isRequired) {
            const label = this.add.text(0, -28, 'REQUIRED', {
                fontFamily: UI.FONT_FAMILY,
                fontSize: '10px',
                color: '#ffdd00'
            }).setOrigin(0.5);
            container.add(label);
        }

        // Physics body for collection
        const hitZone = this.add.circle(x, y, 15, 0x000000, 0);
        this.physics.add.existing(hitZone, true);
        container.hitZone = hitZone;

        // Store reference to container in hitZone for collection
        hitZone.berryContainer = container;

        // Floating animation
        this.tweens.add({
            targets: container,
            y: y - 5,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        return container;
    }

    collectBerry(rabbit, hitZone) {
        const container = hitZone.berryContainer;
        if (!container || container.collected) return;

        container.collected = true;

        if (container.isRequired) {
            this.hasRequiredBerry = true;
            this.score += SCORE.REQUIRED_BERRY;
            this.updateRequiredBerryUI();
        } else {
            this.bonusBerriesCollected++;
            this.score += SCORE.BONUS_BERRY;
        }

        // Update score display
        this.updateScoreUI();

        // Collection effect
        this.createCollectionEffect(container.x, container.y, container.isRequired);

        // Remove berry
        hitZone.destroy();
        container.destroy();
    }

    createCollectionEffect(x, y, isRequired) {
        const color = isRequired ? 0xffdd00 : 0xff3366;

        // Particle burst
        for (let i = 0; i < 12; i++) {
            const particle = this.add.circle(
                x, y,
                Phaser.Math.Between(2, 5),
                color
            );

            const angle = (i / 12) * Math.PI * 2;
            const speed = Phaser.Math.Between(60, 120);

            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0,
                duration: 400,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }

        // Score popup
        const points = isRequired ? SCORE.REQUIRED_BERRY : SCORE.BONUS_BERRY;
        const popup = this.add.text(x, y - 20, `+${points}`, {
            fontFamily: UI.FONT_FAMILY,
            fontSize: '18px',
            color: isRequired ? '#ffdd00' : '#ff3366',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.tweens.add({
            targets: popup,
            y: y - 60,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => popup.destroy()
        });
    }

    createPlayer() {
        const bounds = this.physics.world.bounds;
        const startX = bounds.x + this.levelData.rabbitStart.x;
        const startY = bounds.y + this.levelData.rabbitStart.y;

        this.rabbit = new Rabbit(this, startX, startY);

        // Collisions with platforms (rabbit can jump over, wolves blocked)
        // For now, we'll make platforms block both for simplicity
        this.physics.add.collider(this.rabbit, this.platforms);

        // Win condition
        this.physics.add.overlap(this.rabbit, this.homeZone, this.reachHome, null, this);

        // Berry collection
        this.berries.forEach(berry => {
            this.physics.add.overlap(this.rabbit, berry.hitZone, this.collectBerry, null, this);
        });

        // Dash events
        this.events.on('dashUsed', () => {
            if (this.dashIndicator) {
                this.dashIndicator.setFillStyle(0x444444, 1);
            }
        });

        this.events.on('dashReady', () => {
            if (this.dashIndicator) {
                this.dashIndicator.setFillStyle(COLORS.NEON_CYAN, 1);
            }
        });
    }

    createWolfPack() {
        this.wolfPackAI = new WolfPackAI(this);
        this.wolfPackAI.setRabbit(this.rabbit);

        this.wolves = [];
        const bounds = this.physics.world.bounds;

        // Spawn wolves at edges of arena
        const spawnPositions = [
            { x: bounds.x + bounds.width - 50, y: bounds.y + 100 },
            { x: bounds.x + bounds.width - 50, y: bounds.y + bounds.height - 100 },
            { x: bounds.x + bounds.width / 2, y: bounds.y + 50 },
            { x: bounds.x + 50, y: bounds.y + 50 },
            { x: bounds.x + bounds.width - 100, y: bounds.y + bounds.height / 2 },
            { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height - 50 }
        ];

        // Shuffle spawn positions (Fisher-Yates)
        for (let i = spawnPositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [spawnPositions[i], spawnPositions[j]] = [spawnPositions[j], spawnPositions[i]];
        }

        for (let i = 0; i < this.levelData.wolfCount; i++) {
            const pos = spawnPositions[i % spawnPositions.length];
            const wolf = new Wolf(this, pos.x, pos.y, i);

            // Apply speed multiplier for difficulty scaling
            wolf.speed = WOLF.SPEED * this.levelData.wolfSpeedMultiplier;

            this.wolves.push(wolf);
            this.wolfPackAI.addWolf(wolf);

            // Collision with platforms
            this.physics.add.collider(wolf, this.platforms);

            // Collision with rabbit
            this.physics.add.overlap(this.rabbit, wolf, this.wolfCatchesRabbit, null, this);
        }
    }

    createUI(width) {
        // Level name
        this.add.text(width / 2, 30, this.levelData.name, {
            fontFamily: UI.FONT_FAMILY,
            fontSize: UI.MENU_SIZE,
            color: '#00ffff'
        }).setOrigin(0.5).setScrollFactor(0);

        // Timer
        this.timerText = this.add.text(width - 20, 30, '0:00', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: UI.HUD_SIZE,
            color: '#ffffff'
        }).setOrigin(1, 0.5).setScrollFactor(0);

        // Dash indicator
        this.add.text(20, 30, 'DASH:', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: UI.HUD_SIZE,
            color: '#888888'
        }).setScrollFactor(0);

        this.dashIndicator = this.add.circle(90, 30, 10, COLORS.NEON_CYAN);
        this.dashIndicator.setScrollFactor(0);

        // Score display
        this.add.text(20, 55, 'SCORE:', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: UI.HUD_SIZE,
            color: '#888888'
        }).setScrollFactor(0);

        this.scoreText = this.add.text(90, 55, this.score.toString(), {
            fontFamily: UI.FONT_FAMILY,
            fontSize: UI.HUD_SIZE,
            color: '#ffffff'
        }).setScrollFactor(0);

        // Required berry indicator
        this.add.text(width - 20, 55, 'KEY BERRY:', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: UI.HUD_SIZE,
            color: '#888888'
        }).setOrigin(1, 0.5).setScrollFactor(0);

        this.requiredBerryIndicator = this.add.circle(width - 100, 55, 8, 0x444444);
        this.requiredBerryIndicator.setScrollFactor(0);

        // Bonus berries indicator
        this.add.text(width - 20, 80, 'BONUS:', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: UI.HUD_SIZE,
            color: '#888888'
        }).setOrigin(1, 0.5).setScrollFactor(0);

        this.bonusBerryText = this.add.text(width - 70, 80, '0/3', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: UI.HUD_SIZE,
            color: '#ff3366'
        }).setOrigin(1, 0.5).setScrollFactor(0);

        // Escape prompt
        this.add.text(width / 2, this.cameras.main.height - 20, 'ESC - Menu', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: '14px',
            color: '#444444'
        }).setOrigin(0.5).setScrollFactor(0);
    }

    updateScoreUI() {
        if (this.scoreText) {
            this.scoreText.setText(this.score.toString());
        }
        if (this.bonusBerryText) {
            this.bonusBerryText.setText(`${this.bonusBerriesCollected}/3`);
        }
    }

    updateRequiredBerryUI() {
        if (this.requiredBerryIndicator) {
            this.requiredBerryIndicator.setFillStyle(0xffdd00, 1);
        }
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = {
            up: this.input.keyboard.addKey('W'),
            down: this.input.keyboard.addKey('S'),
            left: this.input.keyboard.addKey('A'),
            right: this.input.keyboard.addKey('D'),
            shift: this.input.keyboard.addKey('SHIFT')
        };

        // Escape to menu
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });
    }

    reachHome() {
        if (this.gameOver || this.gameWon) return;

        // Check if player has the required berry
        if (!this.hasRequiredBerry) {
            // Show warning message
            this.showBerryWarning();
            return;
        }

        this.gameWon = true;
        this.gameOver = true;

        // Calculate final score
        this.score += SCORE.LEVEL_COMPLETE;

        // Time bonus (if completed under threshold)
        if (this.elapsedTime < SCORE.TIME_BONUS_THRESHOLD) {
            const timeBonus = Math.floor((SCORE.TIME_BONUS_THRESHOLD - this.elapsedTime) * SCORE.TIME_BONUS_PER_SECOND);
            this.score += timeBonus;
        }

        // Flash screen green
        this.cameras.main.flash(500, 0, 255, 0);

        // Stop all movement
        this.rabbit.body.setVelocity(0, 0);
        this.wolves.forEach(wolf => wolf.body.setVelocity(0, 0));

        // Show win screen
        this.time.delayedCall(1000, () => {
            this.scene.start('GameOverScene', {
                won: true,
                floor: this.currentFloor,
                time: this.elapsedTime,
                score: this.score,
                bonusBerries: this.bonusBerriesCollected
            });
        });
    }

    showBerryWarning() {
        if (this.berryWarning) return;

        this.berryWarning = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 50,
            'Collect the KEY BERRY first!',
            {
                fontFamily: UI.FONT_FAMILY,
                fontSize: '24px',
                color: '#ffdd00',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5).setScrollFactor(0);

        // Flash and remove warning
        this.tweens.add({
            targets: this.berryWarning,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                if (this.berryWarning) {
                    this.berryWarning.destroy();
                    this.berryWarning = null;
                }
            }
        });
    }

    wolfCatchesRabbit(rabbit, wolf) {
        if (this.gameOver || this.gameWon) return;
        if (rabbit.takeDamage() === false) return; // Invulnerable

        this.gameOver = true;

        // Screen shake
        this.cameras.main.shake(300, 0.02);

        // Flash screen red
        this.cameras.main.flash(300, 255, 0, 0);

        // Stop all movement
        this.rabbit.body.setVelocity(0, 0);
        this.wolves.forEach(w => w.body.setVelocity(0, 0));

        // Show death effect
        this.createDeathEffect(rabbit.x, rabbit.y);

        // Show game over screen - roguelike resets to floor 1 on death
        this.time.delayedCall(1500, () => {
            this.scene.start('GameOverScene', {
                won: false,
                floor: this.currentFloor,
                time: this.elapsedTime,
                score: this.score,
                bonusBerries: this.bonusBerriesCollected
            });
        });
    }

    createDeathEffect(x, y) {
        // Particle burst
        for (let i = 0; i < 20; i++) {
            const particle = this.add.circle(
                x, y,
                Phaser.Math.Between(3, 8),
                Phaser.Math.Between(0, 1) ? 0xff0000 : 0xffffff
            );

            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const speed = Phaser.Math.Between(100, 300);

            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0,
                duration: 800,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }

        // Hide rabbit
        this.rabbit.setVisible(false);
    }

    update(time, delta) {
        if (this.gameOver) return;

        // Update timer
        this.elapsedTime = (time - this.startTime) / 1000;
        const minutes = Math.floor(this.elapsedTime / 60);
        const seconds = Math.floor(this.elapsedTime % 60);
        this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);

        // Update player
        this.rabbit.update(this.cursors, this.wasd, time, delta);

        // Update wolf pack AI
        this.wolfPackAI.update(time, delta);

        // Update home glow animation
        this.updateHomeGlow(time);

        // Debug visualization
        if (this.debugMode) {
            this.debugGraphics.clear();
            this.wolfPackAI.drawDebug(this.debugGraphics);
        } else {
            this.debugGraphics.clear();
        }
    }

    updateHomeGlow(time) {
        this.homeGlow.clear();
        const pulse = Math.sin(time * 0.005) * 0.3 + 0.5;
        this.homeGlow.lineStyle(2, COLORS.NEON_GREEN, pulse);
        this.homeGlow.strokeEllipse(0, 0, 80 + pulse * 10, 60 + pulse * 10);
    }

}
