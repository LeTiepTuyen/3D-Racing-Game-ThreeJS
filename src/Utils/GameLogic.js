import * as THREE from 'three';

/**
 * GameLogic - Manages lap counting, timer, and checkpoint detection
 */
export class GameLogic {
    constructor(car, environment) {
        this.car = car;
        this.environment = environment;
        this.checkpoints = environment.getCheckpoints();
        
        // Game state
        this.lapCount = 0;
        this.currentCheckpoint = 0;
        this.startTime = null;
        this.elapsedTime = 0;
        this.isGameActive = false;
        
        // Checkpoint detection
        this.checkpointThreshold = 8; // Distance threshold for checkpoint detection
        this.lastCheckpointTime = 0;
        this.checkpointCooldown = 1000; // ms - prevent multiple triggers
        
        console.log('Game Logic initialized with', this.checkpoints.length, 'checkpoints');
    }

    /**
     * Start the game
     */
    start() {
        this.isGameActive = true;
        this.startTime = Date.now();
        this.lapCount = 0;
        this.currentCheckpoint = 0;
        this.elapsedTime = 0;
        
        // Reset all checkpoints
        this.checkpoints.forEach(checkpoint => {
            checkpoint.passed = false;
        });
        
        console.log('Game started');
    }

    /**
     * Stop/Pause the game
     */
    stop() {
        this.isGameActive = false;
        console.log('Game stopped');
    }

    /**
     * Reset the game
     */
    reset() {
        this.stop();
        this.lapCount = 0;
        this.currentCheckpoint = 0;
        this.elapsedTime = 0;
        this.startTime = null;
        
        this.checkpoints.forEach(checkpoint => {
            checkpoint.passed = false;
        });
        
        this.car.reset();
        console.log('Game reset');
    }

    /**
     * Update game logic
     */
    update(deltaTime) {
        if (!this.isGameActive) return;
        
        // Update timer
        if (this.startTime) {
            this.elapsedTime = Date.now() - this.startTime;
        }
        
        // Check for checkpoint detection
        this.checkForCheckpoints();
    }

    /**
     * Check if car has passed through any checkpoints
     */
    checkForCheckpoints() {
        const carPosition = this.car.getPosition();
        const currentTime = Date.now();
        
        // Only check the next expected checkpoint
        const nextCheckpoint = this.checkpoints[this.currentCheckpoint];
        
        // Calculate distance to checkpoint
        const dx = carPosition.x - nextCheckpoint.position.x;
        const dz = carPosition.z - nextCheckpoint.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // Check if car is close enough to checkpoint and cooldown has passed
        if (distance < this.checkpointThreshold && 
            currentTime - this.lastCheckpointTime > this.checkpointCooldown) {
            
            this.onCheckpointPassed(nextCheckpoint);
            this.lastCheckpointTime = currentTime;
        }
    }

    /**
     * Handle checkpoint passed event
     */
    onCheckpointPassed(checkpoint) {
        checkpoint.passed = true;
        
        // Visual feedback - flash the checkpoint
        const originalColor = checkpoint.mesh.material.color.getHex();
        checkpoint.mesh.material.color.setHex(0x00ff00);
        checkpoint.mesh.material.opacity = 0.7;
        
        setTimeout(() => {
            checkpoint.mesh.material.color.setHex(originalColor);
            checkpoint.mesh.material.opacity = 0.3;
        }, 200);
        
        console.log('Checkpoint', checkpoint.id, 'passed');
        
        // Move to next checkpoint
        this.currentCheckpoint++;
        
        // Check if lap is completed
        if (this.currentCheckpoint >= this.checkpoints.length) {
            this.onLapCompleted();
        }
    }

    /**
     * Handle lap completion
     */
    onLapCompleted() {
        this.lapCount++;
        this.currentCheckpoint = 0;
        
        // Reset checkpoint states
        this.checkpoints.forEach(checkpoint => {
            checkpoint.passed = false;
        });
        
        console.log('Lap completed! Total laps:', this.lapCount);
        
        // Optional: Add celebration effect or sound here
        this.showLapCompleteNotification();
    }

    /**
     * Show lap complete notification
     */
    showLapCompleteNotification() {
        // Create a temporary notification element
        const notification = document.createElement('div');
        notification.textContent = `LAP ${this.lapCount} COMPLETED!`;
        notification.style.position = 'fixed';
        notification.style.top = '50%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.fontSize = '48px';
        notification.style.fontWeight = 'bold';
        notification.style.color = '#00ff00';
        notification.style.textShadow = '0 0 20px #00ff00';
        notification.style.zIndex = '1000';
        notification.style.animation = 'fadeInOut 2s ease-in-out';
        
        document.body.appendChild(notification);
        
        // Add CSS animation if not already present
        if (!document.getElementById('lapNotificationStyle')) {
            const style = document.createElement('style');
            style.id = 'lapNotificationStyle';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                    80% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remove notification after animation
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 2000);
    }

    /**
     * Get current lap count
     * @returns {number}
     */
    getLapCount() {
        return this.lapCount;
    }

    /**
     * Get formatted elapsed time
     * @returns {string} Time in format MM:SS
     */
    getFormattedTime() {
        const totalSeconds = Math.floor(this.elapsedTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Get elapsed time in milliseconds
     * @returns {number}
     */
    getElapsedTime() {
        return this.elapsedTime;
    }

    /**
     * Check if game is active
     * @returns {boolean}
     */
    isActive() {
        return this.isGameActive;
    }

    /**
     * Get progress to next checkpoint (0-1)
     * @returns {number}
     */
    getCheckpointProgress() {
        const totalCheckpoints = this.checkpoints.length;
        return this.currentCheckpoint / totalCheckpoints;
    }

    /**
     * Get current checkpoint index
     * @returns {number}
     */
    getCurrentCheckpoint() {
        return this.currentCheckpoint;
    }
}
