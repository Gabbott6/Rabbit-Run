// Boot Scene - Asset Loading and Initialization
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Create loading bar
        this.createLoadingBar();

        // Since we're using programmatic graphics, we just need to
        // simulate a brief loading time for effect
        this.load.on('complete', () => {
            this.time.delayedCall(500, () => {
                this.scene.start('MenuScene');
            });
        });

        // Load a placeholder to trigger the loading system
        // In a real game, we'd load actual sprite sheets and audio here
        this.createPlaceholderAssets();
    }

    createLoadingBar() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, COLORS.BACKGROUND);

        // Title
        this.add.text(width / 2, height / 2 - 100, 'RABBIT RUN', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: UI.TITLE_SIZE,
            color: '#00ffff',
            stroke: '#ff00ff',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Loading text
        this.loadingText = this.add.text(width / 2, height / 2, 'Loading...', {
            fontFamily: UI.FONT_FAMILY,
            fontSize: UI.MENU_SIZE,
            color: '#ffffff'
        }).setOrigin(0.5);

        // Progress bar background
        const barWidth = 400;
        const barHeight = 20;
        this.add.rectangle(width / 2, height / 2 + 50, barWidth + 4, barHeight + 4, 0x333333);

        // Progress bar fill
        this.progressBar = this.add.rectangle(
            width / 2 - barWidth / 2,
            height / 2 + 50,
            0,
            barHeight,
            COLORS.NEON_CYAN
        ).setOrigin(0, 0.5);

        // Update progress bar
        this.load.on('progress', (value) => {
            this.progressBar.width = barWidth * value;
        });
    }

    createPlaceholderAssets() {
        // Create a simple texture for particles
        const particleGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        particleGraphics.fillStyle(0xffffff, 1);
        particleGraphics.fillCircle(4, 4, 4);
        particleGraphics.generateTexture('particle', 8, 8);
        particleGraphics.destroy();

        // Force completion after a brief delay
        this.time.delayedCall(100, () => {
            this.load.emit('complete');
        });
    }

    create() {
        // Scene transitions are handled in preload complete callback
    }
}
