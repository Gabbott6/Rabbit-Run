// Enemy Character - Wolf
class Wolf extends Phaser.GameObjects.Container {
    constructor(scene, x, y, id) {
        super(scene, x, y);

        this.scene = scene;
        this.id = id;
        this.speed = WOLF.SPEED;
        this.role = 'chaser'; // 'chaser' or 'flanker'
        this.targetPosition = { x: x, y: y };
        this.facingRight = true;

        // Create wolf graphics
        this.createGraphics();

        // Add physics body
        scene.physics.add.existing(this);
        this.body.setSize(WOLF.SIZE - 8, WOLF.SIZE - 8);
        this.body.setOffset(-WOLF.SIZE / 2 + 4, -WOLF.SIZE / 2 + 4);
        this.body.setCollideWorldBounds(true);

        // Add to scene
        scene.add.existing(this);

        // Animation state
        this.animTimer = 0;
        this.breatheOffset = Math.random() * Math.PI * 2;
    }

    createGraphics() {
        this.bodySprite = this.scene.add.graphics();
        this.drawWolf();
        this.add(this.bodySprite);
    }

    drawWolf() {
        this.bodySprite.clear();

        // Body color based on role
        const bodyColor = this.role === 'chaser' ? 0x4a4a4a : 0x5a5a5a;

        // Body (larger oval)
        this.bodySprite.fillStyle(bodyColor, 1);
        this.bodySprite.fillEllipse(0, 4, WOLF.SIZE - 4, WOLF.SIZE - 10);

        // Head
        this.bodySprite.fillEllipse(12, -4, 20, 16);

        // Snout
        this.bodySprite.fillStyle(0x3a3a3a, 1);
        this.bodySprite.fillEllipse(24, -2, 12, 10);

        // Ears (pointed)
        this.bodySprite.fillStyle(bodyColor, 1);
        this.bodySprite.fillTriangle(6, -12, 2, -26, 14, -14);
        this.bodySprite.fillTriangle(16, -12, 12, -26, 24, -14);

        // Inner ears
        this.bodySprite.fillStyle(0x2a2a2a, 1);
        this.bodySprite.fillTriangle(7, -14, 4, -22, 12, -15);
        this.bodySprite.fillTriangle(17, -14, 14, -22, 22, -15);

        // Eye (menacing)
        this.bodySprite.fillStyle(0xffff00, 1);
        this.bodySprite.fillCircle(18, -6, 4);
        this.bodySprite.fillStyle(0x000000, 1);
        this.bodySprite.fillCircle(19, -6, 2);

        // Eye glow for flankers
        if (this.role === 'flanker') {
            this.bodySprite.fillStyle(0xff6600, 0.5);
            this.bodySprite.fillCircle(18, -6, 6);
            this.bodySprite.fillStyle(0xffff00, 1);
            this.bodySprite.fillCircle(18, -6, 4);
            this.bodySprite.fillStyle(0x000000, 1);
            this.bodySprite.fillCircle(19, -6, 2);
        }

        // Nose
        this.bodySprite.fillStyle(0x1a1a1a, 1);
        this.bodySprite.fillCircle(30, -2, 3);

        // Tail
        this.bodySprite.fillStyle(bodyColor, 1);
        this.bodySprite.fillEllipse(-18, 0, 14, 8);

        // Legs (simple)
        this.bodySprite.fillStyle(0x3a3a3a, 1);
        this.bodySprite.fillRect(-8, 8, 6, 12);
        this.bodySprite.fillRect(4, 8, 6, 12);
    }

    setRole(role) {
        if (this.role !== role) {
            this.role = role;
            this.drawWolf();
        }
    }

    setTargetPosition(x, y) {
        this.targetPosition = { x, y };
    }

    update(time, delta) {
        if (!this.body) return;

        // Move toward target position
        const dx = this.targetPosition.x - this.x;
        const dy = this.targetPosition.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            const velocityX = (dx / distance) * this.speed;
            const velocityY = (dy / distance) * this.speed;
            this.body.setVelocity(velocityX, velocityY);

            // Update facing direction
            this.facingRight = dx > 0;
            this.bodySprite.setScale(this.facingRight ? 1 : -1, 1);
        } else {
            this.body.setVelocity(0, 0);
        }

        // Breathing animation
        this.animTimer += delta;
        const breathe = Math.sin(this.animTimer / 300 + this.breatheOffset) * 0.05;
        this.bodySprite.setScale(
            (this.facingRight ? 1 : -1) * (1 + breathe),
            1 + breathe * 0.5
        );
    }

    // Get world position for collision detection
    getPosition() {
        return { x: this.x, y: this.y };
    }
}
