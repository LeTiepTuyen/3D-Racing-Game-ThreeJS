import * as THREE from 'three';

/**
 * GameLogic - Manages lap counting, timer, scoring, and checkpoint detection
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
        this.isPaused = false;
        this.pausedTime = 0;        // Time when paused
        this.totalPausedTime = 0;   // Total time spent paused
        
        // Scoring system
        this.score = 0;
        this.checkpointPoints = 100;  // Points per checkpoint
        this.lapBonusPoints = 500;    // Bonus points per lap
        this.speedBonusMultiplier = 2; // Extra multiplier for high speed
        
        // Game completion settings
        this.totalLaps = 2;           // Laps to complete the race (demo mode)
        this.isGameOver = false;
        this.isWinner = false;
        
        // Lap timing
        this.lapTimes = [];           // Array to store each lap time
        this.lapStartTime = null;     // Start time of current lap
        this.bestLapTime = null;      // Best lap time
        
        // Checkpoint detection
        this.checkpointThreshold = 8; // Distance threshold for checkpoint detection
        this.lastCheckpointTime = 0;
        this.checkpointCooldown = 1000; // ms - prevent multiple triggers
        
        // Callbacks for game events
        this.onGameOverCallback = null;
        
        console.log('Game Logic initialized with', this.checkpoints.length, 'checkpoints');
    }

    /**
     * Set callback for game over event
     */
    setOnGameOver(callback) {
        this.onGameOverCallback = callback;
    }

    /**
     * Start the game
     */
    start() {
        this.isGameActive = true;
        this.isPaused = false;
        this.isGameOver = false;
        this.isWinner = false;
        this.startTime = Date.now();
        this.lapStartTime = Date.now();
        this.lapCount = 0;
        this.currentCheckpoint = 0;
        this.elapsedTime = 0;
        this.score = 0;
        this.lapTimes = [];
        this.bestLapTime = null;
        this.totalPausedTime = 0;
        
        // Reset all checkpoints
        this.checkpoints.forEach(checkpoint => {
            checkpoint.passed = false;
        });
        
        console.log('Game started - Complete', this.totalLaps, 'laps to win!');
    }

    /**
     * Pause the game
     */
    pause() {
        if (this.isGameActive && !this.isPaused && !this.isGameOver) {
            this.isPaused = true;
            this.pausedTime = Date.now();
            console.log('Game paused');
        }
    }

    /**
     * Resume the game
     */
    resume() {
        if (this.isPaused) {
            // Calculate time spent paused and add to total
            this.totalPausedTime += Date.now() - this.pausedTime;
            this.isPaused = false;
            console.log('Game resumed');
        }
    }

    /**
     * Stop the game (without reset)
     */
    stop() {
        this.isGameActive = false;
        console.log('Game stopped');
    }

    /**
     * Reset the game completely
     */
    reset() {
        this.stop();
        this.lapCount = 0;
        this.currentCheckpoint = 0;
        this.elapsedTime = 0;
        this.startTime = null;
        this.lapStartTime = null;
        this.score = 0;
        this.lapTimes = [];
        this.bestLapTime = null;
        this.isPaused = false;
        this.isGameOver = false;
        this.isWinner = false;
        this.totalPausedTime = 0;
        
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
        if (!this.isGameActive || this.isPaused || this.isGameOver) return;
        
        // Update timer (excluding paused time)
        if (this.startTime) {
            this.elapsedTime = Date.now() - this.startTime - this.totalPausedTime;
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
        
        // Calculate points with speed bonus
        const currentSpeed = this.car.getSpeed();
        let points = this.checkpointPoints;
        
        // Speed bonus: if going fast (>100 km/h), multiply points
        if (currentSpeed > 100) {
            points *= this.speedBonusMultiplier;
            this.showPointsNotification(`+${points} (SPEED BONUS!)`, '#ffff00');
        } else {
            this.showPointsNotification(`+${points}`, '#00ff00');
        }
        
        this.score += points;
        
        // Visual feedback - flash the checkpoint
        const originalColor = checkpoint.mesh.material.color.getHex();
        checkpoint.mesh.material.color.setHex(0x00ff00);
        checkpoint.mesh.material.opacity = 0.7;
        
        setTimeout(() => {
            checkpoint.mesh.material.color.setHex(originalColor);
            checkpoint.mesh.material.opacity = 0.3;
        }, 200);
        
        console.log('Checkpoint', checkpoint.id, 'passed. Score:', this.score);
        
        // Move to next checkpoint
        this.currentCheckpoint++;
        
        // Check if lap is completed
        if (this.currentCheckpoint >= this.checkpoints.length) {
            this.onLapCompleted();
        }
    }

    /**
     * Show points notification
     */
    showPointsNotification(text, color) {
        const notification = document.createElement('div');
        notification.textContent = text;
        notification.style.position = 'fixed';
        notification.style.top = '30%';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.fontSize = '32px';
        notification.style.fontWeight = 'bold';
        notification.style.color = color;
        notification.style.textShadow = `0 0 15px ${color}`;
        notification.style.zIndex = '500';
        notification.style.animation = 'pointsFadeUp 1s ease-out forwards';
        notification.style.pointerEvents = 'none';
        
        document.body.appendChild(notification);
        
        // Add animation if not present
        if (!document.getElementById('pointsNotificationStyle')) {
            const style = document.createElement('style');
            style.id = 'pointsNotificationStyle';
            style.textContent = `
                @keyframes pointsFadeUp {
                    0% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    100% { opacity: 0; transform: translateX(-50%) translateY(-50px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 1000);
    }

    /**
     * Handle lap completion
     */
    onLapCompleted() {
        // Calculate lap time
        const currentLapTime = Date.now() - this.lapStartTime - this.totalPausedTime;
        this.lapTimes.push(currentLapTime);
        
        // Check for best lap
        if (!this.bestLapTime || currentLapTime < this.bestLapTime) {
            this.bestLapTime = currentLapTime;
        }
        
        // Add lap bonus points
        this.score += this.lapBonusPoints;
        
        this.lapCount++;
        this.currentCheckpoint = 0;
        this.lapStartTime = Date.now();
        
        // Reset checkpoint states
        this.checkpoints.forEach(checkpoint => {
            checkpoint.passed = false;
        });
        
        console.log('Lap', this.lapCount, 'completed! Time:', this.formatTime(currentLapTime));
        
        // Check if race is complete
        if (this.lapCount >= this.totalLaps) {
            this.onRaceComplete();
        } else {
            this.showLapCompleteNotification();
        }
    }

    /**
     * Handle race completion (WIN)
     */
    onRaceComplete() {
        this.isGameOver = true;
        this.isWinner = true;
        this.isGameActive = false;
        
        console.log('RACE COMPLETE! Final Score:', this.score);
        
        // Trigger game over callback
        if (this.onGameOverCallback) {
            this.onGameOverCallback({
                isWinner: true,
                score: this.score,
                laps: this.lapCount,
                totalTime: this.elapsedTime,
                bestLapTime: this.bestLapTime,
                lapTimes: this.lapTimes
            });
        }
    }

    /**
     * Show lap complete notification
     */
    showLapCompleteNotification() {
        const remainingLaps = this.totalLaps - this.lapCount;
        
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div>LAP ${this.lapCount} COMPLETED!</div>
            <div style="font-size: 24px; margin-top: 10px;">${remainingLaps} lap${remainingLaps > 1 ? 's' : ''} remaining</div>
            <div style="font-size: 20px; margin-top: 5px; color: #00ff00;">+${this.lapBonusPoints} BONUS</div>
        `;
        notification.style.position = 'fixed';
        notification.style.top = '50%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.fontSize = '48px';
        notification.style.fontWeight = 'bold';
        notification.style.color = '#ffa500';
        notification.style.textShadow = '0 0 20px #ffa500';
        notification.style.zIndex = '1000';
        notification.style.textAlign = 'center';
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
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 2000);
    }

    /**
     * Format time in ms to MM:SS
     */
    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Get current score
     */
    getScore() {
        return this.score;
    }

    /**
     * Get current lap count
     */
    getLapCount() {
        return this.lapCount;
    }

    /**
     * Get total laps required
     */
    getTotalLaps() {
        return this.totalLaps;
    }

    /**
     * Get formatted elapsed time
     */
    getFormattedTime() {
        return this.formatTime(this.elapsedTime);
    }

    /**
     * Get elapsed time in milliseconds
     */
    getElapsedTime() {
        return this.elapsedTime;
    }

    /**
     * Get best lap time formatted
     */
    getBestLapTime() {
        return this.bestLapTime ? this.formatTime(this.bestLapTime) : '--:--';
    }

    /**
     * Check if game is active
     */
    isActive() {
        return this.isGameActive && !this.isPaused && !this.isGameOver;
    }

    /**
     * Check if game is paused
     */
    getIsPaused() {
        return this.isPaused;
    }

    /**
     * Check if game is over
     */
    getIsGameOver() {
        return this.isGameOver;
    }

    /**
     * Get progress to next checkpoint (0-1)
     */
    getCheckpointProgress() {
        const totalCheckpoints = this.checkpoints.length;
        return this.currentCheckpoint / totalCheckpoints;
    }

    /**
     * Get current checkpoint index
     */
    getCurrentCheckpoint() {
        return this.currentCheckpoint;
    }
}
