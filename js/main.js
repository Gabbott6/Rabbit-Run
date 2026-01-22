// Main Game Configuration and Initialization
const config = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT,
    parent: 'game-container',
    backgroundColor: GAME_CONFIG.BACKGROUND_COLOR,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene],
    pixelArt: false,
    antialias: true,
    roundPixels: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// Create the game instance
const game = new Phaser.Game(config);

// Handle window focus/blur for pause functionality
window.addEventListener('blur', () => {
    if (game.scene.isActive('GameScene')) {
        game.scene.pause('GameScene');
    }
});

window.addEventListener('focus', () => {
    if (game.scene.isPaused('GameScene')) {
        game.scene.resume('GameScene');
    }
});

// Prevent arrow key scrolling
window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
});

console.log('Rabbit Run - Escape the Wolf Pack!');
console.log('Controls: WASD or Arrow Keys to move, SPACE or SHIFT to dash');
console.log('Reach the glowing green burrow to win!');
