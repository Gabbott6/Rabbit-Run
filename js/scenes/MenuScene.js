// Menu Scene - Title Screen
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, COLORS.BACKGROUND);

        // Animated background stars
        this.createStarfield();

        // Title with glow effect
        this.createTitle(width, height);

        // Menu options
        this.createMenu(width, height);

        // Leaderboard
        this.createLeaderboard(width, height);

        // Decorative rabbit
        this.createDecorativeRabbit(width, height);

        // Decorative wolves
        this.createDecorativeWolves(width, height);

        // Instructions
        this.createInstructions(width, height);

        // Input handling
        this.setupInput();
    }

    createStarfield() {
        this.stars = [];
        for (let i = 0; i < 50; i++) {
            const star = this.add.circle(
                Phaser.Math.Between(0, this.cameras.main.width),
                Phaser.Math.Between(0, this.cameras.main.height),
                Phaser.Math.Between(1, 3),
                Phaser.Math.Between(0, 1) ? COLORS.NEON_CYAN : COLORS.NEON_MAGENTA,
                Phaser.Math.FloatBetween(0.2, 0.6)
            );
            star.twinkleSpeed = Phaser.Math.FloatBetween(0.002, 0.005);
            star.twinkleOffset = Phaser.Math.FloatBetween(0, Math.PI * 2);
            this.stars.push(star);
        }
    }

    createTitle(width, height) {
        // Glow effect (multiple layers)
        for (let i = 3; i >= 0; i--) {
            this.add.text(width / 2, 100, 'RABBIT RUN', {
                fontFamily: UI.FONT_FAMILY,
                fontSize: '64px',
                color: i === 0 ? '#00ffff' : '#00ffff',
                stroke: '#ff00ff',
                strokeThickness: i === 0 ? 4 : 8 + i * 4
            }).setOrigin(0.5).setAlpha(i === 0 ? 1 : 0.1);
        }

        // Subtitle
        this.add.text(width / 2, 155, 'A Roguelike Escape', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: '20px',
            color: '#ff00ff'
        }).setOrigin(0.5);
    }

    createMenu(width, height) {
        const leftX = width * 0.3;

        // Start button
        this.startButton = this.add.text(leftX, 260, '[ START RUN ]', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: '28px',
            color: '#00ffff',
            stroke: '#004444',
            strokeThickness: 2
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.startButton.on('pointerover', () => {
            this.startButton.setColor('#ffffff');
            this.startButton.setScale(1.1);
        });

        this.startButton.on('pointerout', () => {
            this.startButton.setColor('#00ffff');
            this.startButton.setScale(1);
        });

        this.startButton.on('pointerdown', () => this.startGame());

        // Roguelike rules
        const rules = [
            'Collect the KEY BERRY',
            'to unlock the exit',
            '',
            'Grab bonus berries',
            'for extra points',
            '',
            'Each floor gets harder',
            '',
            'Death resets to Floor 1'
        ];

        rules.forEach((rule, i) => {
            this.add.text(leftX, 330 + i * 22, rule, {
                fontFamily: UI.FONT_FAMILY,
                fontSize: '13px',
                color: '#666666'
            }).setOrigin(0.5);
        });
    }

    createLeaderboard(width, height) {
        const rightX = width * 0.72;
        const startY = 220;

        // Leaderboard title
        this.add.text(rightX, startY, '- HIGH SCORES -', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: '20px',
            color: '#ffff00'
        }).setOrigin(0.5);

        // Leaderboard border
        const boardWidth = 280;
        const boardHeight = 200;
        const borderG = this.add.graphics();
        borderG.lineStyle(2, COLORS.NEON_YELLOW, 0.5);
        borderG.strokeRect(rightX - boardWidth / 2, startY + 20, boardWidth, boardHeight);

        // Column headers
        this.add.text(rightX - 100, startY + 40, 'RANK', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: '12px',
            color: '#888888'
        }).setOrigin(0.5);

        this.add.text(rightX - 40, startY + 40, 'NAME', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: '12px',
            color: '#888888'
        }).setOrigin(0.5);

        this.add.text(rightX + 30, startY + 40, 'FLOOR', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: '12px',
            color: '#888888'
        }).setOrigin(0.5);

        this.add.text(rightX + 100, startY + 40, 'SCORE', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: '12px',
            color: '#888888'
        }).setOrigin(0.5);

        // Get leaderboard data
        const scores = Leaderboard.getScores();

        // Display scores or empty slots
        for (let i = 0; i < 5; i++) {
            const y = startY + 70 + i * 28;
            const rankColors = ['#ffff00', '#cccccc', '#cc8844', '#888888', '#888888'];
            const color = i < scores.length ? rankColors[i] : '#444444';

            // Rank
            this.add.text(rightX - 100, y, `${i + 1}.`, {
                fontFamily: UI.FONT_FAMILY,
                fontSize: '16px',
                color: color
            }).setOrigin(0.5);

            if (i < scores.length) {
                const entry = scores[i];

                // Name
                this.add.text(rightX - 40, y, entry.initials, {
                    fontFamily: UI.FONT_FAMILY,
                    fontSize: '16px',
                    color: color
                }).setOrigin(0.5);

                // Floor
                this.add.text(rightX + 30, y, `F${entry.floor}`, {
                    fontFamily: UI.FONT_FAMILY,
                    fontSize: '16px',
                    color: color
                }).setOrigin(0.5);

                // Score
                this.add.text(rightX + 100, y, entry.score.toString(), {
                    fontFamily: UI.FONT_FAMILY,
                    fontSize: '16px',
                    color: color
                }).setOrigin(0.5);
            } else {
                // Empty slot
                this.add.text(rightX - 40, y, '---', {
                    fontFamily: UI.FONT_FAMILY,
                    fontSize: '16px',
                    color: '#444444'
                }).setOrigin(0.5);

                this.add.text(rightX + 30, y, '--', {
                    fontFamily: UI.FONT_FAMILY,
                    fontSize: '16px',
                    color: '#444444'
                }).setOrigin(0.5);

                this.add.text(rightX + 100, y, '-----', {
                    fontFamily: UI.FONT_FAMILY,
                    fontSize: '16px',
                    color: '#444444'
                }).setOrigin(0.5);
            }
        }
    }

    createDecorativeRabbit(width, height) {
        // Simple rabbit silhouette on the left
        const rabbitG = this.add.graphics();
        rabbitG.fillStyle(0xffffff, 0.3);
        rabbitG.fillEllipse(80, height - 100, 35, 26);
        rabbitG.fillEllipse(88, height - 122, 18, 16);
        rabbitG.fillEllipse(84, height - 148, 7, 18);
        rabbitG.fillEllipse(92, height - 148, 7, 18);
    }

    createDecorativeWolves(width, height) {
        // Wolf silhouettes on the right
        const wolfG = this.add.graphics();
        wolfG.fillStyle(0x666666, 0.3);

        for (let i = 0; i < 3; i++) {
            const x = width - 60 - i * 50;
            const y = height - 80 - i * 18;
            wolfG.fillEllipse(x, y, 38, 22);
            wolfG.fillEllipse(x + 12, y - 12, 22, 16);
            wolfG.fillTriangle(x + 4, y - 22, x, y - 38, x + 12, y - 22);
            wolfG.fillTriangle(x + 16, y - 22, x + 12, y - 38, x + 24, y - 22);
        }
    }

    createInstructions(width, height) {
        // Press enter to start
        this.startPrompt = this.add.text(width / 2, height - 80, 'Press ENTER or SPACE to Begin', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: UI.HUD_SIZE,
            color: '#ffff00'
        }).setOrigin(0.5);

        this.add.text(width / 2, height - 50, 'WASD / Arrows - Move  |  SPACE / SHIFT - Dash', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: '12px',
            color: '#555555'
        }).setOrigin(0.5);
    }

    setupInput() {
        this.input.keyboard.on('keydown-ENTER', () => {
            this.startGame();
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            this.startGame();
        });
    }

    startGame() {
        this.cameras.main.fade(500, 0, 0, 0);
        this.time.delayedCall(500, () => {
            this.scene.start('GameScene', { floor: 1, score: 0 });
        });
    }

    update(time) {
        // Animate stars
        this.stars.forEach(star => {
            star.alpha = 0.3 + Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3;
        });

        // Pulse start prompt
        if (this.startPrompt) {
            this.startPrompt.alpha = 0.5 + Math.sin(time * 0.005) * 0.5;
        }

        // Pulse start button
        if (this.startButton) {
            const pulse = Math.sin(time * 0.003) * 0.1 + 1;
            this.startButton.setScale(pulse);
        }
    }
}
