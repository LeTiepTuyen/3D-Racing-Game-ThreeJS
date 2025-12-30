import * as CANNON from 'cannon-es';

/**
 * PhysicsWorld - Manages the Cannon.js physics simulation
 */
export class PhysicsWorld {
    constructor() {
        // Initialize Cannon.js World with gravity
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0); // Earth's gravity
        
        // Configure broadphase for better performance
        this.world.broadphase = new CANNON.NaiveBroadphase();
        
        // Allow bodies to sleep when not moving (performance optimization)
        this.world.allowSleep = true;
        
        // Set up default contact material to prevent endless sliding
        this.setupContactMaterial();
        
        console.log('Physics World initialized with gravity:', this.world.gravity);
    }

    /**
     * Set up default contact material properties
     * This controls friction and restitution (bounciness) between objects
     */
    setupContactMaterial() {
        // Create default material
        const defaultMaterial = new CANNON.Material('default');
        
        // Define contact properties between materials
        const defaultContactMaterial = new CANNON.ContactMaterial(
            defaultMaterial,
            defaultMaterial,
            {
                friction: 0.3,        // Friction coefficient (0 = ice, 1 = rubber)
                restitution: 0.2,     // Bounciness (0 = no bounce, 1 = perfect bounce)
                contactEquationStiffness: 1e8,
                contactEquationRelaxation: 3
            }
        );
        
        // Add contact material to world
        this.world.addContactMaterial(defaultContactMaterial);
        this.world.defaultContactMaterial = defaultContactMaterial;
        
        // Store reference for use by other objects
        this.defaultMaterial = defaultMaterial;
        
        console.log('Contact material configured with friction:', 0.3, 'restitution:', 0.2);
    }

    /**
     * Update physics simulation
     * @param {number} deltaTime - Time step for physics simulation
     */
    update(deltaTime) {
        // Fixed time step for stable physics simulation
        const fixedTimeStep = 1 / 60; // 60 FPS
        this.world.step(fixedTimeStep, deltaTime, 3);
    }

    /**
     * Add a body to the physics world
     * @param {CANNON.Body} body - Physics body to add
     */
    addBody(body) {
        this.world.addBody(body);
    }

    /**
     * Remove a body from the physics world
     * @param {CANNON.Body} body - Physics body to remove
     */
    removeBody(body) {
        this.world.removeBody(body);
    }

    /**
     * Get the default material for creating physics bodies
     * @returns {CANNON.Material}
     */
    getDefaultMaterial() {
        return this.defaultMaterial;
    }
}
