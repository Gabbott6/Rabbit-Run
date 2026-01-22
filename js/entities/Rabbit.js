// Player Character - Rabbit
class Rabbit extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);

        this.scene = scene;
        this.speed = PLAYER.SPEED;
        this.isDashing = false;
        this.canDash = true;
        this.dashCooldownTimer = null;
        this.isInvulnerable = false;
        this.facingRight = true;

        // Create rabbit body graphics
        this.createGraphics();

        // Add physics body
        scene.physics.add.existing(this);
        this.body.setSize(PLAYER.SIZE - 8, PLAYER.SIZE - 4);
        this.body.setOffset(-PLAYER.SIZE / 2 + 4, -PLAYER.SIZE / 2 + 2);
        this.body.setCollideWorldBounds(true);

        // Add to scene
        scene.add.existing(this);

        // Dash trail particles
        this.dashTrail = [];
    }

    createGraphics() {
        // Body (oval shape)
        this.bodySprite = this.scene.add.graphics();
        this.bodySprite.fillStyle(0xffffff, 1);
        this.bodySprite.fillEllipse(0, 4, PLAYER.SIZE - 8, PLAYER.SIZE - 4);

        // Head
        this.bodySprite.fillEllipse(8, -8, 16, 14);

        // Ears
        this.bodySprite.fillStyle(0xffffff, 1);
        this.bodySprite.fillEllipse(4, -22, 6, 16);
        this.bodySprite.fillEllipse(12, -22, 6, 16);

        // Inner ears (pink)
        this.bodySprite.fillStyle(0xffaaaa, 1);
        this.bodySprite.fillEllipse(4, -22, 3, 12);
        this.bodySprite.fillEllipse(12, -22, 3, 12);

        // Eye
        this.bodySprite.fillStyle(0x000000, 1);
        this.bodySprite.fillCircle(12, -10, 3);

        // Eye highlight
        this.bodySprite.fillStyle(0xffffff, 1);
        this.bodySprite.fillCircle(13, -11, 1);

        // Nose
        this.bodySprite.fillStyle(0xffaaaa, 1);
        this.bodySprite.fillCircle(18, -6, 2);

        // Tail (fluffy circle)
        this.bodySprite.fillStyle(0xffffff, 1);
        this.bodySprite.fillCircle(-14, 4, 8);

        this.add(this.bodySprite);
    }

    update(cursors, wasd, time, delta) {
        if (!this.body) return;

        let velocityX = 0;
        let velocityY = 0;

        const currentSpeed = this.isDashing ? PLAYER.DASH_SPEED : this.speed;

        // Handle input
        if (cursors.left.isDown || wasd.left.isDown) {
            velocityX = -currentSpeed;
            this.facingRight = false;
        } else if (cursors.right.isDown || wasd.right.isDown) {
            velocityX = currentSpeed;
            this.facingRight = true;
        }

        if (cursors.up.isDown || wasd.up.isDown) {
            velocityY = -currentSpeed;
        } else if (cursors.down.isDown || wasd.down.isDown) {
            velocityY = currentSpeed;
        }

        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            const factor = Math.SQRT1_2;
            velocityX *= factor;
            velocityY *= factor;
        }

        this.body.setVelocity(velocityX, velocityY);

        // Update sprite direction
        this.bodySprite.setScale(this.facingRight ? 1 : -1, 1);

        // Handle dash
        if (Phaser.Input.Keyboard.JustDown(wasd.shift) ||
            Phaser.Input.Keyboard.JustDown(cursors.space)) {
            this.dash();
        }

        // Dash trail effect
        if (this.isDashing) {
            this.createDashTrail();
        }

        // Clean up old trail particles
        this.updateDashTrail(delta);
    }

    dash() {
        if (!this.canDash || this.isDashing) return;

        this.isDashing = true;
        this.canDash = false;
        this.isInvulnerable = true;

        // Visual feedback - tint cyan during dash
        this.bodySprite.setAlpha(0.7);

        // End dash after duration
        this.scene.time.delayedCall(PLAYER.DASH_DURATION, () => {
            this.isDashing = false;
            this.bodySprite.setAlpha(1);

            // Brief invulnerability after dash
            this.scene.time.delayedCall(PLAYER.INVULNERABILITY_FRAMES, () => {
                this.isInvulnerable = false;
            });
        });

        // Start cooldown
        this.scene.time.delayedCall(PLAYER.DASH_COOLDOWN, () => {
            this.canDash = true;
            if (this.scene.events) {
                this.scene.events.emit('dashReady');
            }
        });

        if (this.scene.events) {
            this.scene.events.emit('dashUsed');
        }
    }

    createDashTrail() {
        const trail = this.scene.add.graphics();
        trail.fillStyle(COLORS.NEON_CYAN, 0.5);
        trail.fillCircle(0, 0, PLAYER.SIZE / 3);
        trail.setPosition(this.x, this.y);
        trail.alpha = 0.6;
        trail.life = 200;

        this.dashTrail.push(trail);
    }

    updateDashTrail(delta) {
        for (let i = this.dashTrail.length - 1; i >= 0; i--) {
            const trail = this.dashTrail[i];
            trail.life -= delta;
            trail.alpha = trail.life / 200 * 0.6;

            if (trail.life <= 0) {
                trail.destroy();
                this.dashTrail.splice(i, 1);
            }
        }
    }

    takeDamage() {
        if (this.isInvulnerable) return false;
        return true;
    }

    getDashProgress() {
        return this.canDash ? 1 : 0;
    }

    destroy() {
        this.dashTrail.forEach(trail => trail.destroy());
        super.destroy();
    }
}
