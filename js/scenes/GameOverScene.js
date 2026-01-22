// Game Over Scene - Win/Lose Screens (Roguelike)
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.won = data.won || false;
        this.floor = data.floor || 1;
        this.completionTime = data.time || 0;
        this.score = data.score || 0;
        this.bonusBerries = data.bonusBerries || 0;
        this.initialsEntered = false;
        this.initials = '';
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, COLORS.BACKGROUND);

        // Animated background
        this.createBackgroundEffect(width, height);

        if (this.won) {
            this.createWinScreen(width, height);
            this.setupInput();
        } else {
            // Check if this is a high score
            if (Leaderboard.isHighScore(this.score) && this.score > 0) {
                this.createHighScoreEntry(width, height);
            } else {
                this.createLoseScreen(width, height);
                this.setupInput();
            }
        }

        // Fade in
        this.cameras.main.fadeIn(300);
    }

    createBackgroundEffect(width, height) {
        this.particles = [];

        const color = this.won ? COLORS.NEON_GREEN : 0xff0000;
        const particleCount = 30;

        for (let i = 0; i < particleCount; i++) {
            const particle = this.add.circle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.Between(2, 6),
                color,
                Phaser.Math.FloatBetween(0.1, 0.4)
            );
            particle.speed = Phaser.Math.FloatBetween(0.5, 2);
            this.particles.push(particle);
        }
    }

    createWinScreen(width, height) {
        // Victory title
        this.add.text(width / 2, 100, 'FLOOR CLEARED!', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: '48px',
            color: '#00ff00',
            stroke: '#004400',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Floor number
        this.add.text(width / 2, 160, `Floor ${this.floor} Complete`, {
            fontFamily: UI.FONT_FAMILY,
            fontSize: UI.MENU_SIZE,
            color: '#88ff88'
        }).setOrigin(0.5);

        // Stats
        const minutes = Math.floor(this.completionTime / 60);
        const seconds = Math.floor(this.completionTime % 60);
        const ms = Math.floor((this.completionTime % 1) * 100);

        this.add.text(width / 2, 210, `Time: ${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`, {
            fontFamily: UI.FONT_FAMILY,
            fontSize: UI.HUD_SIZE,
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, 240, `Bonus Berries: ${this.bonusBerries}/3`, {
            fontFamily: UI.FONT_FAMILY,
            fontSize: UI.HUD_SIZE,
            color: '#ff3366'
        }).setOrigin(0.5);

        // Score
        this.add.text(width / 2, 290, `SCORE: ${this.score}`, {
            fontFamily: UI.FONT_FAMILY,
            fontSize: '36px',
            color: '#ffff00',
            stroke: '#444400',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Next floor preview
        const nextFloor = this.floor + 1;
        const nextWolves = Math.min(Math.floor(LEVEL_GEN.BASE_WOLF_COUNT + (nextFloor - 1) * LEVEL_GEN.WOLF_INCREMENT), LEVEL_GEN.MAX_WOLVES);

        this.add.text(width / 2, 350, `Next: Floor ${nextFloor}`, {
            fontFamily: UI.FONT_FAMILY,
            fontSize: UI.MENU_SIZE,
            color: '#ff00ff'
        }).setOrigin(0.5);

        this.add.text(width / 2, 380, `${nextWolves} wolves await...`, {
            fontFamily: UI.FONT_FAMILY,
            fontSize: '16px',
            color: '#aa00aa'
        }).setOrigin(0.5);

        // Happy rabbit
        this.createHappyRabbit(width / 2, 460);

        // Continue button
        this.selectedOption = 0;
        this.options = [];

        const continueText = this.add.text(width / 2, 560, '> Continue to Floor ' + nextFloor, {
            fontFamily: UI.FONT_FAMILY,
            fontSize: UI.MENU_SIZE,
            color: '#00ffff'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        continueText.action = 'continue';
        continueText.on('pointerover', () => this.selectOption(0));
        continueText.on('pointerdown', () => this.executeOption('continue'));
        this.options.push(continueText);

        const menuText = this.add.text(width / 2, 605, 'Main Menu', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: UI.MENU_SIZE,
            color: '#888888'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        menuText.action = 'menu';
        menuText.on('pointerover', () => this.selectOption(1));
        menuText.on('pointerdown', () => this.executeOption('menu'));
        this.options.push(menuText);

        this.updateOptionColors();
    }

    createLoseScreen(width, height) {
        // Game Over title
        this.add.text(width / 2, 100, 'RUN ENDED', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: '48px',
            color: '#ff0000',
            stroke: '#440000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Floor reached
        this.add.text(width / 2, 160, `Reached Floor ${this.floor}`, {
            fontFamily: UI.FONT_FAMILY,
            fontSize: UI.MENU_SIZE,
            color: '#ff8888'
        }).setOrigin(0.5);

        // Stats
        const minutes = Math.floor(this.completionTime / 60);
        const seconds = Math.floor(this.completionTime % 60);

        this.add.text(width / 2, 210, `Survived: ${minutes}:${seconds.toString().padStart(2, '0')}`, {
            fontFamily: UI.FONT_FAMILY,
            fontSize: UI.HUD_SIZE,
            color: '#ffffff'
        }).setOrigin(0.5);

        // Total berries collected this floor
        const totalBerries = this.bonusBerries + (this.score >= SCORE.REQUIRED_BERRY ? 1 : 0);
        this.add.text(width / 2, 240, `Berries This Floor: ${totalBerries}/4`, {
            fontFamily: UI.FONT_FAMILY,
            fontSize: UI.HUD_SIZE,
            color: '#ff3366'
        }).setOrigin(0.5);

        // Final score
        this.add.text(width / 2, 290, `FINAL SCORE: ${this.score}`, {
            fontFamily: UI.FONT_FAMILY,
            fontSize: '32px',
            color: '#ffff00',
            stroke: '#444400',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Death message
        const deathMessages = [
            "The wolves caught up...",
            "So close, yet so far...",
            "The pack was too fast...",
            "Better luck next time...",
            "The hunt is over..."
        ];
        const randomMessage = deathMessages[Math.floor(Math.random() * deathMessages.length)];

        this.add.text(width / 2, 340, randomMessage, {
            fontFamily: UI.FONT_FAMILY,
            fontSize: '18px',
            color: '#666666',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // Wolf silhouettes
        this.createWolfSilhouettes(width / 2, 430);

        // Options
        this.selectedOption = 0;
        this.options = [];

        const retryText = this.add.text(width / 2, 540, '> New Run (Floor 1)', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: UI.MENU_SIZE,
            color: '#00ffff'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        retryText.action = 'retry';
        retryText.on('pointerover', () => this.selectOption(0));
        retryText.on('pointerdown', () => this.executeOption('retry'));
        this.options.push(retryText);

        const menuText = this.add.text(width / 2, 585, 'Main Menu', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: UI.MENU_SIZE,
            color: '#888888'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        menuText.action = 'menu';
        menuText.on('pointerover', () => this.selectOption(1));
        menuText.on('pointerdown', () => this.executeOption('menu'));
        this.options.push(menuText);

        this.updateOptionColors();
    }

    createHappyRabbit(x, y) {
        const rabbit = this.add.graphics();
        rabbit.setPosition(x, y);

        // Body
        rabbit.fillStyle(0xffffff, 1);
        rabbit.fillEllipse(0, 20, 50, 38);

        // Head
        rabbit.fillEllipse(0, -10, 38, 32);

        // Ears
        rabbit.fillEllipse(-10, -45, 10, 28);
        rabbit.fillEllipse(10, -45, 10, 28);

        // Inner ears
        rabbit.fillStyle(0xffaaaa, 1);
        rabbit.fillEllipse(-10, -45, 5, 20);
        rabbit.fillEllipse(10, -45, 5, 20);

        // Eyes (happy closed)
        rabbit.lineStyle(3, 0x000000, 1);
        rabbit.arc(-10, -12, 6, Math.PI * 0.8, Math.PI * 0.2, true);
        rabbit.stroke();
        rabbit.beginPath();
        rabbit.arc(10, -12, 6, Math.PI * 0.8, Math.PI * 0.2, true);
        rabbit.stroke();

        // Blush
        rabbit.fillStyle(0xffcccc, 0.6);
        rabbit.fillCircle(-18, -4, 6);
        rabbit.fillCircle(18, -4, 6);

        // Nose
        rabbit.fillStyle(0xffaaaa, 1);
        rabbit.fillCircle(0, -2, 4);

        // Animate hop
        this.tweens.add({
            targets: rabbit,
            y: y - 8,
            duration: 400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createWolfSilhouettes(x, y) {
        const wolves = this.add.graphics();

        // Three menacing wolf silhouettes
        for (let i = -1; i <= 1; i++) {
            const offsetX = i * 70;
            const offsetY = Math.abs(i) * 12;

            wolves.fillStyle(0x333333, 0.8);

            // Body
            wolves.fillEllipse(x + offsetX, y + offsetY + 12, 42, 25);

            // Head
            wolves.fillEllipse(x + offsetX + 12, y + offsetY - 4, 25, 18);

            // Snout
            wolves.fillEllipse(x + offsetX + 26, y + offsetY - 2, 13, 10);

            // Ears
            wolves.fillTriangle(
                x + offsetX + 4, y + offsetY - 12,
                x + offsetX, y + offsetY - 28,
                x + offsetX + 12, y + offsetY - 14
            );
            wolves.fillTriangle(
                x + offsetX + 15, y + offsetY - 12,
                x + offsetX + 12, y + offsetY - 28,
                x + offsetX + 23, y + offsetY - 14
            );

            // Glowing eyes
            wolves.fillStyle(0xffff00, 1);
            wolves.fillCircle(x + offsetX + 16, y + offsetY - 6, 3);
        }
    }

    createHighScoreEntry(width, height) {
        // High score title
        this.add.text(width / 2, 80, 'NEW HIGH SCORE!', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: '48px',
            color: '#ffff00',
            stroke: '#444400',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Score display
        this.add.text(width / 2, 150, `SCORE: ${this.score}`, {
            fontFamily: UI.FONT_FAMILY,
            fontSize: '36px',
            color: '#00ffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, 195, `Floor ${this.floor} Reached`, {
            fontFamily: UI.FONT_FAMILY,
            fontSize: '20px',
            color: '#888888'
        }).setOrigin(0.5);

        // Instructions
        this.add.text(width / 2, 270, 'ENTER YOUR INITIALS', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: '24px',
            color: '#ff00ff'
        }).setOrigin(0.5);

        // Initials display boxes
        this.initialBoxes = [];
        this.initialTexts = [];
        const boxWidth = 60;
        const boxSpacing = 20;
        const startX = width / 2 - (boxWidth * 1.5 + boxSpacing);

        for (let i = 0; i < 3; i++) {
            const x = startX + i * (boxWidth + boxSpacing);

            // Box background
            const box = this.add.rectangle(x, 350, boxWidth, 70, 0x2d1b4e)
                .setStrokeStyle(3, i === 0 ? COLORS.NEON_CYAN : COLORS.NEON_MAGENTA);
            this.initialBoxes.push(box);

            // Letter text
            const letterText = this.add.text(x, 350, '_', {
                fontFamily: UI.FONT_FAMILY,
                fontSize: '48px',
                color: '#ffffff'
            }).setOrigin(0.5);
            this.initialTexts.push(letterText);
        }

        this.currentInitialIndex = 0;

        // Keyboard hint
        this.add.text(width / 2, 430, 'Type A-Z, 0-9  |  BACKSPACE to delete', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: '14px',
            color: '#666666'
        }).setOrigin(0.5);

        this.add.text(width / 2, 455, 'Press ENTER when done', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: '16px',
            color: '#888888'
        }).setOrigin(0.5);

        // Trophy graphic
        this.createTrophy(width / 2, 550);

        // Setup keyboard input for initials
        this.setupInitialsInput();
    }

    createTrophy(x, y) {
        const trophy = this.add.graphics();
        trophy.setPosition(x, y);

        // Trophy cup
        trophy.fillStyle(0xffff00, 1);
        trophy.fillRect(-25, -20, 50, 40);
        trophy.fillRect(-35, -30, 70, 15);

        // Handles
        trophy.lineStyle(6, 0xffff00, 1);
        trophy.arc(-30, -10, 15, Math.PI * 0.5, Math.PI * 1.5, false);
        trophy.stroke();
        trophy.beginPath();
        trophy.arc(30, -10, 15, Math.PI * 1.5, Math.PI * 0.5, false);
        trophy.stroke();

        // Base
        trophy.fillStyle(0xffff00, 1);
        trophy.fillRect(-10, 20, 20, 15);
        trophy.fillRect(-20, 35, 40, 10);

        // Star
        trophy.fillStyle(0xffffff, 1);
        const starY = -5;
        trophy.fillTriangle(0, starY - 12, -4, starY, 4, starY);
        trophy.fillTriangle(0, starY + 8, -4, starY, 4, starY);
        trophy.fillTriangle(-10, starY - 3, 0, starY - 1, 0, starY + 1);
        trophy.fillTriangle(10, starY - 3, 0, starY - 1, 0, starY + 1);

        // Animate glow
        this.tweens.add({
            targets: trophy,
            alpha: 0.7,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    setupInitialsInput() {
        this.input.keyboard.on('keydown', (event) => {
            if (this.initialsEntered) return;

            const key = event.key.toUpperCase();

            // Check for valid character (A-Z, 0-9)
            if (/^[A-Z0-9]$/.test(key) && this.currentInitialIndex < 3) {
                this.initials += key;
                this.initialTexts[this.currentInitialIndex].setText(key);

                // Update box highlight
                this.initialBoxes[this.currentInitialIndex].setStrokeStyle(3, COLORS.NEON_MAGENTA);
                this.currentInitialIndex++;

                if (this.currentInitialIndex < 3) {
                    this.initialBoxes[this.currentInitialIndex].setStrokeStyle(3, COLORS.NEON_CYAN);
                }
            }
            // Backspace
            else if (event.keyCode === 8 && this.currentInitialIndex > 0) {
                if (this.currentInitialIndex < 3) {
                    this.initialBoxes[this.currentInitialIndex].setStrokeStyle(3, COLORS.NEON_MAGENTA);
                }
                this.currentInitialIndex--;
                this.initials = this.initials.slice(0, -1);
                this.initialTexts[this.currentInitialIndex].setText('_');
                this.initialBoxes[this.currentInitialIndex].setStrokeStyle(3, COLORS.NEON_CYAN);
            }
            // Enter to submit
            else if (event.keyCode === 13 && this.initials.length > 0) {
                this.submitHighScore();
            }
        });
    }

    submitHighScore() {
        this.initialsEntered = true;

        // Save to leaderboard
        const rank = Leaderboard.addScore(this.initials, this.score, this.floor);

        // Clear current UI elements
        this.initialBoxes.forEach(box => box.destroy());
        this.initialTexts.forEach(text => text.destroy());

        // Flash effect
        this.cameras.main.flash(200, 255, 255, 0);

        // Show rank achieved
        const width = this.cameras.main.width;

        this.add.text(width / 2, 350, `RANK #${rank}`, {
            fontFamily: UI.FONT_FAMILY,
            fontSize: '36px',
            color: '#00ff00',
            stroke: '#004400',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.add.text(width / 2, 400, this.initials, {
            fontFamily: UI.FONT_FAMILY,
            fontSize: '28px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Show continue options after delay
        this.time.delayedCall(1000, () => {
            this.showPostHighScoreOptions(width);
        });
    }

    showPostHighScoreOptions(width) {
        this.selectedOption = 0;
        this.options = [];

        const retryText = this.add.text(width / 2, 500, '> New Run (Floor 1)', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: UI.MENU_SIZE,
            color: '#00ffff'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        retryText.action = 'retry';
        retryText.on('pointerover', () => this.selectOption(0));
        retryText.on('pointerdown', () => this.executeOption('retry'));
        this.options.push(retryText);

        const menuText = this.add.text(width / 2, 545, 'Main Menu', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: UI.MENU_SIZE,
            color: '#888888'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        menuText.action = 'menu';
        menuText.on('pointerover', () => this.selectOption(1));
        menuText.on('pointerdown', () => this.executeOption('menu'));
        this.options.push(menuText);

        this.updateOptionColors();
        this.setupInput();
    }

    setupInput() {
        this.input.keyboard.on('keydown-UP', () => {
            this.selectOption(Math.max(0, this.selectedOption - 1));
        });

        this.input.keyboard.on('keydown-DOWN', () => {
            this.selectOption(Math.min(this.options.length - 1, this.selectedOption + 1));
        });

        this.input.keyboard.on('keydown-ENTER', () => {
            this.executeOption(this.options[this.selectedOption].action);
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            this.executeOption(this.options[this.selectedOption].action);
        });
    }

    selectOption(index) {
        this.selectedOption = index;
        this.updateOptionColors();
    }

    updateOptionColors() {
        this.options.forEach((option, i) => {
            if (i === this.selectedOption) {
                option.setColor('#00ffff');
                option.setText(`> ${option.text.replace(/^> /, '')}`);
            } else {
                option.setColor('#888888');
                option.setText(option.text.replace(/^> /, ''));
            }
        });
    }

    executeOption(action) {
        this.cameras.main.fade(300, 0, 0, 0);

        this.time.delayedCall(300, () => {
            switch (action) {
                case 'continue':
                    // Continue to next floor with score carried over
                    this.scene.start('GameScene', { floor: this.floor + 1, score: this.score });
                    break;
                case 'retry':
                    // Roguelike reset - back to floor 1, score 0
                    this.scene.start('GameScene', { floor: 1, score: 0 });
                    break;
                case 'menu':
                    this.scene.start('MenuScene');
                    break;
            }
        });
    }

    update(time) {
        // Animate background particles
        this.particles.forEach(particle => {
            particle.y -= particle.speed;
            if (particle.y < -10) {
                particle.y = this.cameras.main.height + 10;
                particle.x = Phaser.Math.Between(0, this.cameras.main.width);
            }
        });
    }
}
