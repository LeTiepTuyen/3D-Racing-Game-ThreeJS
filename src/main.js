import * as THREE from 'three';
import { PhysicsWorld } from './World/PhysicsWorld.js';
import { Environment } from './World/Environment.js';
import { CarController } from './Car/CarController.js';
import { InputManager } from './Utils/InputManager.js';
import { GameLogic } from './Utils/GameLogic.js';

/**
 * Main Game Class
 */
class RacingGame {
    constructor() {
        // Initialize core components
        this.initScene();
        this.initLighting();
        this.initPhysics();
        this.initGameObjects();
        this.initCamera();
        this.initRenderer();
        this.initHUD();
        this.initMenuUI();
        
        // Game state
        this.clock = new THREE.Clock();
        this.isGameStarted = false;
        
        // Start button handler
        this.setupStartButton();
        
        // Setup game over callback
        this.gameLogic.setOnGameOver((result) => this.showGameOver(result));
        
        console.log('Racing Game initialized');
    }

    /**
     * Initialize Three.js scene
     */
    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
        this.scene.fog = new THREE.Fog(0x87ceeb, 50, 200);
        
        console.log('Scene initialized');
    }

    /**
     * Initialize lighting
     */
    initLighting() {
        // Ambient light for overall illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun) with shadows
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        
        // Configure shadow properties
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        
        this.scene.add(directionalLight);
        
        // Add a subtle hemisphere light for more natural lighting
        const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x444444, 0.4);
        this.scene.add(hemisphereLight);
        
        console.log('Lighting initialized');
    }

    /**
     * Initialize physics world
     */
    initPhysics() {
        this.physicsWorld = new PhysicsWorld();
        console.log('Physics world initialized');
    }

    /**
     * Initialize game objects
     */
    initGameObjects() {
        // Create input manager
        this.inputManager = new InputManager();
        
        // Create environment
        this.environment = new Environment(this.scene, this.physicsWorld);
        
        // Create car
        this.car = new CarController(this.scene, this.physicsWorld, this.inputManager);
        
        // Create game logic
        this.gameLogic = new GameLogic(this.car, this.environment);
        
        console.log('Game objects initialized');
    }

    /**
     * Initialize camera
     */
    initCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75, // Field of view
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near plane
            1000 // Far plane
        );
        
        // Camera orbit parameters (spherical coordinates)
        this.cameraDistance = 18;        // Distance from car
        this.cameraAzimuth = Math.PI;    // Horizontal angle (radians) - start behind car
        this.cameraPolar = Math.PI / 3;  // Vertical angle (radians) - ~60 degrees from top
        this.cameraSmoothing = 0.08;     // Camera position smoothing (lower = smoother but laggier)
        this.targetSmoothing = 0.12;     // Target/lookAt position smoothing
        
        // Camera orbit constraints
        this.minPolar = 0.2;             // Minimum vertical angle (prevent going under car)
        this.maxPolar = Math.PI / 2.2;   // Maximum vertical angle (prevent going too low)
        this.minDistance = 8;            // Minimum zoom distance
        this.maxDistance = 40;           // Maximum zoom distance
        
        // Mouse control state
        this.isMouseDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.mouseSensitivity = 0.005;   // Mouse movement sensitivity
        
        // Look at offset (slight offset above car center)
        this.cameraLookAtOffset = new THREE.Vector3(0, 1.5, 0);
        
        // Smooth target position (to prevent jitter)
        this.smoothTargetPosition = new THREE.Vector3(0, 0, 0);
        this.smoothLookAtPosition = new THREE.Vector3(0, 0, 0);
        
        // Set initial camera position
        this.camera.position.set(0, 10, -20);
        this.camera.lookAt(0, 0, 0);
        
        console.log('Camera initialized with orbit controls');
    }

    /**
     * Initialize renderer
     */
    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        document.body.appendChild(this.renderer.domElement);
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Initialize mouse controls for camera orbit
        this.initMouseControls();
        
        console.log('Renderer initialized');
    }

    /**
     * Initialize mouse controls for camera orbit
     */
    initMouseControls() {
        const canvas = this.renderer.domElement;
        
        // Mouse down - start dragging
        canvas.addEventListener('mousedown', (event) => {
            // Only respond to left mouse button
            if (event.button === 0) {
                this.isMouseDragging = true;
                this.previousMousePosition = {
                    x: event.clientX,
                    y: event.clientY
                };
                canvas.style.cursor = 'grabbing';
            }
        });
        
        // Mouse move - rotate camera if dragging
        canvas.addEventListener('mousemove', (event) => {
            if (this.isMouseDragging && this.isGameStarted) {
                const deltaX = event.clientX - this.previousMousePosition.x;
                const deltaY = event.clientY - this.previousMousePosition.y;
                
                // Update azimuth (horizontal rotation)
                this.cameraAzimuth -= deltaX * this.mouseSensitivity;
                
                // Update polar (vertical rotation) with constraints
                this.cameraPolar += deltaY * this.mouseSensitivity;
                this.cameraPolar = Math.max(this.minPolar, Math.min(this.maxPolar, this.cameraPolar));
                
                // Store current mouse position
                this.previousMousePosition = {
                    x: event.clientX,
                    y: event.clientY
                };
            }
        });
        
        // Mouse up - stop dragging
        canvas.addEventListener('mouseup', () => {
            this.isMouseDragging = false;
            canvas.style.cursor = 'grab';
        });
        
        // Mouse leave - stop dragging if mouse leaves canvas
        canvas.addEventListener('mouseleave', () => {
            this.isMouseDragging = false;
            canvas.style.cursor = 'grab';
        });
        
        // Mouse wheel - zoom in/out
        canvas.addEventListener('wheel', (event) => {
            event.preventDefault();
            
            // Adjust camera distance based on scroll direction
            const zoomSpeed = 2;
            this.cameraDistance += event.deltaY > 0 ? zoomSpeed : -zoomSpeed;
            
            // Clamp distance within min/max bounds
            this.cameraDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.cameraDistance));
        }, { passive: false });
        
        // Set initial cursor style
        canvas.style.cursor = 'grab';
        
        console.log('Mouse controls initialized for camera orbit');
    }

    /**
     * Initialize HUD elements
     */
    initHUD() {
        this.speedElement = document.getElementById('speed');
        this.lapElement = document.getElementById('lap');
        this.timerElement = document.getElementById('timer');
        this.scoreElement = document.getElementById('score');
        
        console.log('HUD initialized');
    }

    /**
     * Initialize Menu UI
     */
    initMenuUI() {
        // Get UI elements
        this.menuButton = document.getElementById('menuButton');
        this.menuDropdown = document.getElementById('menuDropdown');
        this.restartBtn = document.getElementById('restartBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.pauseOverlay = document.getElementById('pauseOverlay');
        this.continueBtn = document.getElementById('continueBtn');
        this.gameOverOverlay = document.getElementById('gameOverOverlay');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        
        // Menu toggle
        this.menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.menuDropdown.contains(e.target) && e.target !== this.menuButton) {
                this.menuDropdown.classList.remove('show');
            }
        });
        
        // Restart button
        this.restartBtn.addEventListener('click', () => {
            this.restartGame();
            this.menuDropdown.classList.remove('show');
        });
        
        // Pause button
        this.pauseBtn.addEventListener('click', () => {
            this.pauseGame();
            this.menuDropdown.classList.remove('show');
        });
        
        // Continue button (from pause overlay)
        this.continueBtn.addEventListener('click', () => {
            this.resumeGame();
        });
        
        // Play again button (from game over screen)
        this.playAgainBtn.addEventListener('click', () => {
            this.restartGame();
            this.gameOverOverlay.classList.remove('show');
        });
        
        // ESC key to pause/resume
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.isGameStarted && !this.gameLogic.getIsGameOver()) {
                    if (this.gameLogic.getIsPaused()) {
                        this.resumeGame();
                    } else {
                        this.pauseGame();
                    }
                }
            }
        });
        
        console.log('Menu UI initialized');
    }

    /**
     * Toggle menu dropdown
     */
    toggleMenu() {
        this.menuDropdown.classList.toggle('show');
        
        // Update pause button text based on current state
        if (this.gameLogic.getIsPaused()) {
            this.pauseBtn.textContent = '▶ Continue';
        } else {
            this.pauseBtn.textContent = '⏸ Pause';
        }
    }

    /**
     * Pause the game
     */
    pauseGame() {
        if (this.isGameStarted && !this.gameLogic.getIsGameOver()) {
            this.gameLogic.pause();
            this.clock.stop();
            
            // Update pause overlay stats
            document.getElementById('pauseLap').textContent = this.gameLogic.getLapCount();
            document.getElementById('pauseScore').textContent = this.gameLogic.getScore();
            document.getElementById('pauseTime').textContent = this.gameLogic.getFormattedTime();
            
            this.pauseOverlay.classList.add('show');
            console.log('Game paused');
        }
    }

    /**
     * Resume the game
     */
    resumeGame() {
        this.gameLogic.resume();
        this.clock.start();
        this.pauseOverlay.classList.remove('show');
        console.log('Game resumed');
    }

    /**
     * Restart the game
     */
    restartGame() {
        // Hide overlays
        this.pauseOverlay.classList.remove('show');
        this.gameOverOverlay.classList.remove('show');
        
        // Reset game logic
        this.gameLogic.reset();
        
        // Reset car position
        this.car.reset();
        
        // Reset camera to default orbit position
        this.resetCameraOrbit();
        
        // Restart game
        this.gameLogic.start();
        this.clock.start();
        this.isGameStarted = true;
        
        console.log('Game restarted');
    }

    /**
     * Show game over screen
     */
    showGameOver(result) {
        // Update game over stats
        document.getElementById('finalScore').textContent = result.score;
        document.getElementById('finalLaps').textContent = result.laps;
        document.getElementById('finalTime').textContent = this.formatTime(result.totalTime);
        document.getElementById('bestLapTime').textContent = result.bestLapTime ? this.formatTime(result.bestLapTime) : '--:--';
        
        // Update title based on win/lose
        const gameOverTitle = document.getElementById('gameOverTitle');
        const gameOverMessage = document.getElementById('gameOverMessage');
        
        if (result.isWinner) {
            gameOverTitle.textContent = '🏆 RACE COMPLETE!';
            gameOverTitle.style.color = '#ffd700';
            gameOverMessage.textContent = 'Congratulations! You finished the race!';
        } else {
            gameOverTitle.textContent = '💥 GAME OVER';
            gameOverTitle.style.color = '#ff4444';
            gameOverMessage.textContent = 'Better luck next time!';
        }
        
        // Show overlay
        this.gameOverOverlay.classList.add('show');
        
        // Stop clock
        this.clock.stop();
        
        console.log('Game over displayed', result);
    }

    /**
     * Format time from ms to MM:SS
     */
    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Setup start button
     */
    setupStartButton() {
        const startButton = document.getElementById('startButton');
        const instructionsOverlay = document.getElementById('instructions');
        
        startButton.addEventListener('click', () => {
            this.startGame();
            instructionsOverlay.classList.add('hidden');
        });
    }

    /**
     * Start the game
     */
    startGame() {
        this.isGameStarted = true;
        this.gameLogic.start();
        this.clock.start();
        
        // Initialize smooth camera positions to car's starting position
        const carPos = this.car.getPosition();
        this.smoothTargetPosition.set(carPos.x, carPos.y, carPos.z);
        this.smoothLookAtPosition.set(
            carPos.x + this.cameraLookAtOffset.x,
            carPos.y + this.cameraLookAtOffset.y,
            carPos.z + this.cameraLookAtOffset.z
        );
        
        console.log('Game started');
    }

    /**
     * Update camera to follow the car with orbit controls
     */
    updateCamera() {
        // Get car position from physics body
        const carPosition = this.car.getPosition();
        
        // First, smooth the target position (car position) to reduce jitter
        // This creates a "virtual" target that moves smoothly
        this.smoothTargetPosition.lerp(
            new THREE.Vector3(carPosition.x, carPosition.y, carPosition.z),
            this.targetSmoothing
        );
        
        // Calculate camera position using spherical coordinates around smoothed target
        const offsetX = this.cameraDistance * Math.sin(this.cameraPolar) * Math.sin(this.cameraAzimuth);
        const offsetY = this.cameraDistance * Math.cos(this.cameraPolar);
        const offsetZ = this.cameraDistance * Math.sin(this.cameraPolar) * Math.cos(this.cameraAzimuth);
        
        // Calculate desired camera position relative to smoothed target
        const desiredCameraPosition = new THREE.Vector3(
            this.smoothTargetPosition.x + offsetX,
            this.smoothTargetPosition.y + offsetY,
            this.smoothTargetPosition.z + offsetZ
        );
        
        // Smoothly interpolate camera position
        this.camera.position.lerp(desiredCameraPosition, this.cameraSmoothing);
        
        // Smooth the look-at position as well
        const desiredLookAt = new THREE.Vector3(
            this.smoothTargetPosition.x + this.cameraLookAtOffset.x,
            this.smoothTargetPosition.y + this.cameraLookAtOffset.y,
            this.smoothTargetPosition.z + this.cameraLookAtOffset.z
        );
        this.smoothLookAtPosition.lerp(desiredLookAt, this.targetSmoothing);
        
        // Make camera look at the smoothed position
        this.camera.lookAt(this.smoothLookAtPosition);
    }

    /**
     * Reset camera to default position behind car
     */
    resetCameraOrbit() {
        this.cameraAzimuth = Math.PI;    // Behind car
        this.cameraPolar = Math.PI / 3;  // ~60 degrees from top
        this.cameraDistance = 18;        // Default distance
        
        // Reset smooth positions to car's current position
        const carPos = this.car.getPosition();
        this.smoothTargetPosition.set(carPos.x, carPos.y, carPos.z);
        this.smoothLookAtPosition.set(
            carPos.x + this.cameraLookAtOffset.x,
            carPos.y + this.cameraLookAtOffset.y,
            carPos.z + this.cameraLookAtOffset.z
        );
    }

    /**
     * Update HUD display
     */
    updateHUD() {
        // Update speed
        const speed = this.car.getSpeed();
        this.speedElement.textContent = speed;
        
        // Update lap count (with total laps)
        this.lapElement.textContent = this.gameLogic.getLapCount();
        
        // Update timer
        if (this.gameLogic.isActive()) {
            this.timerElement.textContent = this.gameLogic.getFormattedTime();
        }
        
        // Update score
        if (this.scoreElement) {
            this.scoreElement.textContent = this.gameLogic.getScore();
        }
    }

    /**
     * Animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Get delta time
        const deltaTime = this.clock.getDelta();
        
        if (this.isGameStarted && !this.gameLogic.getIsPaused() && !this.gameLogic.getIsGameOver()) {
            // 1. First: Car sets its intended velocity based on input
            this.car.update(deltaTime);
            
            // 2. Then: Physics engine processes movement AND collisions
            this.physicsWorld.update(deltaTime);
            
            // 3. Finally: Sync visual position with physics result
            this.car.syncVisualWithPhysics();
            
            // Update game logic and environment
            this.gameLogic.update(deltaTime);
            this.environment.update(deltaTime);
            
            // Update camera
            this.updateCamera();
            
            // Update HUD
            this.updateHUD();
        } else {
            // Still update physics for gravity/settling when not playing
            this.physicsWorld.update(deltaTime);
            
            if (this.isGameStarted) {
                // Still update camera and HUD when paused
                this.updateCamera();
                this.updateHUD();
            }
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Initialize and start the game
const game = new RacingGame();
game.animate();

console.log('='.repeat(50));
console.log('3D Racing Game - Challenge 1');
console.log('Student: Le Tiep Tuyen (ID: 22020015)');
console.log('='.repeat(50));
