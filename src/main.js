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
        
        // Game state
        this.clock = new THREE.Clock();
        this.isGameStarted = false;
        
        // Start button handler
        this.setupStartButton();
        
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
        
        // Camera follow parameters
        this.cameraOffset = new THREE.Vector3(0, 8, -15);
        this.cameraLookAtOffset = new THREE.Vector3(0, 0, 10);
        this.cameraSmoothing = 0.1;
        
        // Set initial camera position
        this.camera.position.set(0, 10, -20);
        this.camera.lookAt(0, 0, 0);
        
        console.log('Camera initialized');
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
        
        console.log('Renderer initialized');
    }

    /**
     * Initialize HUD elements
     */
    initHUD() {
        this.speedElement = document.getElementById('speed');
        this.lapElement = document.getElementById('lap');
        this.timerElement = document.getElementById('timer');
        
        console.log('HUD initialized');
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
        console.log('Game started');
    }

    /**
     * Update camera to follow the car
     */
    updateCamera() {
        // Get car position
        const carPosition = this.car.getPosition();
        
        // Calculate desired camera position (fixed behind and above the car in world space)
        // The camera offset is NOT rotated with the car - it stays fixed
        const desiredCameraPosition = new THREE.Vector3(
            carPosition.x + this.cameraOffset.x,
            carPosition.y + this.cameraOffset.y,
            carPosition.z + this.cameraOffset.z
        );
        
        // Smoothly interpolate camera position for smooth following
        this.camera.position.lerp(desiredCameraPosition, this.cameraSmoothing);
        
        // Calculate look-at position (car center + slight forward offset)
        const lookAtPosition = new THREE.Vector3(
            carPosition.x,
            carPosition.y + this.cameraLookAtOffset.y,
            carPosition.z + this.cameraLookAtOffset.z
        );
        
        // Make camera look at the target position
        this.camera.lookAt(lookAtPosition);
    }

    /**
     * Update HUD display
     */
    updateHUD() {
        // Update speed
        const speed = this.car.getSpeed();
        this.speedElement.textContent = speed;
        
        // Update lap count
        this.lapElement.textContent = this.gameLogic.getLapCount();
        
        // Update timer
        if (this.gameLogic.isActive()) {
            this.timerElement.textContent = this.gameLogic.getFormattedTime();
        }
    }

    /**
     * Animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Get delta time
        const deltaTime = this.clock.getDelta();
        
        // Update physics
        this.physicsWorld.update(deltaTime);
        
        if (this.isGameStarted) {
            // Update game objects
            this.car.update(deltaTime);
            this.gameLogic.update(deltaTime);
            this.environment.update(deltaTime);
            
            // Update camera
            this.updateCamera();
            
            // Update HUD
            this.updateHUD();
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
