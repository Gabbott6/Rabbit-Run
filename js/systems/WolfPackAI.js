// Wolf Pack AI - Flanking Coordination System
class WolfPackAI {
    constructor(scene) {
        this.scene = scene;
        this.wolves = [];
        this.rabbit = null;
        this.lastRecalcTime = 0;
        this.recalcInterval = WOLF.RECALC_INTERVAL;
    }

    setRabbit(rabbit) {
        this.rabbit = rabbit;
    }

    addWolf(wolf) {
        this.wolves.push(wolf);
        this.assignRoles();
    }

    removeWolf(wolf) {
        const index = this.wolves.indexOf(wolf);
        if (index > -1) {
            this.wolves.splice(index, 1);
            this.assignRoles();
        }
    }

    assignRoles() {
        // First 2 wolves are chasers, rest are flankers
        this.wolves.forEach((wolf, index) => {
            wolf.setRole(index < 2 ? 'chaser' : 'flanker');
        });
    }

    update(time, delta) {
        if (!this.rabbit || this.wolves.length === 0) return;

        // Recalculate positions periodically
        if (time - this.lastRecalcTime >= this.recalcInterval) {
            this.calculateTargetPositions();
            this.lastRecalcTime = time;
        }

        // Update all wolves
        this.wolves.forEach(wolf => wolf.update(time, delta));
    }

    calculateTargetPositions() {
        const rabbitPos = { x: this.rabbit.x, y: this.rabbit.y };
        const rabbitVel = this.rabbit.body
            ? { x: this.rabbit.body.velocity.x, y: this.rabbit.body.velocity.y }
            : { x: 0, y: 0 };

        // Predict rabbit's future position
        const predictionTime = 0.5; // seconds
        const predictedPos = {
            x: rabbitPos.x + rabbitVel.x * predictionTime,
            y: rabbitPos.y + rabbitVel.y * predictionTime
        };

        // Calculate flanking positions
        const flankPositions = this.calculateFlankPositions(rabbitPos, predictedPos, rabbitVel);

        // Assign targets to wolves
        let flankerIndex = 0;

        this.wolves.forEach(wolf => {
            if (wolf.role === 'chaser') {
                // Chasers go directly for rabbit with some prediction
                const chaseTarget = {
                    x: rabbitPos.x + rabbitVel.x * 0.2,
                    y: rabbitPos.y + rabbitVel.y * 0.2
                };
                wolf.setTargetPosition(chaseTarget.x, chaseTarget.y);
            } else {
                // Flankers use calculated flank positions
                if (flankerIndex < flankPositions.length) {
                    const flankTarget = flankPositions[flankerIndex];
                    wolf.setTargetPosition(flankTarget.x, flankTarget.y);
                    flankerIndex++;
                } else {
                    // Extra flankers spread out around predicted position
                    const angle = (flankerIndex / (this.wolves.length - 2)) * Math.PI * 2;
                    const distance = 150;
                    wolf.setTargetPosition(
                        predictedPos.x + Math.cos(angle) * distance,
                        predictedPos.y + Math.sin(angle) * distance
                    );
                    flankerIndex++;
                }
            }
        });

        // Apply pack spacing to avoid bunching
        this.applyPackSpacing();
    }

    calculateFlankPositions(rabbitPos, predictedPos, rabbitVel) {
        const positions = [];
        const speed = Math.sqrt(rabbitVel.x * rabbitVel.x + rabbitVel.y * rabbitVel.y);

        if (speed > 50) {
            // Rabbit is moving - calculate intercept points
            const moveAngle = Math.atan2(rabbitVel.y, rabbitVel.x);

            // Flankers position ahead and to the sides
            const flankDistance = 200;
            const spreadAngle = Math.PI / 3; // 60 degrees

            // Left flank
            positions.push({
                x: predictedPos.x + Math.cos(moveAngle + spreadAngle) * flankDistance,
                y: predictedPos.y + Math.sin(moveAngle + spreadAngle) * flankDistance
            });

            // Right flank
            positions.push({
                x: predictedPos.x + Math.cos(moveAngle - spreadAngle) * flankDistance,
                y: predictedPos.y + Math.sin(moveAngle - spreadAngle) * flankDistance
            });

            // Far ahead intercept
            positions.push({
                x: predictedPos.x + Math.cos(moveAngle) * flankDistance * 1.5,
                y: predictedPos.y + Math.sin(moveAngle) * flankDistance * 1.5
            });

            // Cut off retreat
            positions.push({
                x: rabbitPos.x - Math.cos(moveAngle) * flankDistance * 0.8,
                y: rabbitPos.y - Math.sin(moveAngle) * flankDistance * 0.8
            });
        } else {
            // Rabbit is stationary - surround it
            const numPositions = 4;
            const surroundDistance = 180;

            for (let i = 0; i < numPositions; i++) {
                const angle = (i / numPositions) * Math.PI * 2 + Math.PI / 4;
                positions.push({
                    x: rabbitPos.x + Math.cos(angle) * surroundDistance,
                    y: rabbitPos.y + Math.sin(angle) * surroundDistance
                });
            }
        }

        return positions;
    }

    applyPackSpacing() {
        // Push wolves apart if they're too close to each other
        const minSpacing = WOLF.MIN_PACK_SPACING;

        for (let i = 0; i < this.wolves.length; i++) {
            for (let j = i + 1; j < this.wolves.length; j++) {
                const wolf1 = this.wolves[i];
                const wolf2 = this.wolves[j];

                const dx = wolf2.x - wolf1.x;
                const dy = wolf2.y - wolf1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < minSpacing && distance > 0) {
                    // Adjust target positions to maintain spacing
                    const pushDistance = (minSpacing - distance) / 2;
                    const pushX = (dx / distance) * pushDistance;
                    const pushY = (dy / distance) * pushDistance;

                    wolf1.targetPosition.x -= pushX;
                    wolf1.targetPosition.y -= pushY;
                    wolf2.targetPosition.x += pushX;
                    wolf2.targetPosition.y += pushY;
                }
            }
        }

        // Clamp targets to world bounds
        const bounds = this.scene.physics.world.bounds;
        this.wolves.forEach(wolf => {
            wolf.targetPosition.x = Phaser.Math.Clamp(
                wolf.targetPosition.x,
                bounds.x + WOLF.SIZE,
                bounds.x + bounds.width - WOLF.SIZE
            );
            wolf.targetPosition.y = Phaser.Math.Clamp(
                wolf.targetPosition.y,
                bounds.y + WOLF.SIZE,
                bounds.y + bounds.height - WOLF.SIZE
            );
        });
    }

    // Debug visualization
    drawDebug(graphics) {
        if (!this.rabbit) return;

        graphics.lineStyle(1, COLORS.NEON_MAGENTA, 0.3);

        this.wolves.forEach(wolf => {
            // Draw line to target
            graphics.lineBetween(
                wolf.x, wolf.y,
                wolf.targetPosition.x, wolf.targetPosition.y
            );

            // Draw target point
            graphics.fillStyle(wolf.role === 'chaser' ? 0xff0000 : 0xff6600, 0.5);
            graphics.fillCircle(wolf.targetPosition.x, wolf.targetPosition.y, 5);
        });
    }
}
