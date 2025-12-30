import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * CarController - Manages the car's visual representation and physics
 * Simple arcade-style car controls
 */
export class CarController {
    constructor(scene, physicsWorld, inputManager) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.inputManager = inputManager;
        
        // Car dimensions
        this.carWidth = 2;
        this.carHeight = 1;
        this.carLength = 4;
        this.wheelRadius = 0.4;
        this.wheelWidth = 0.3;
        
        // === SIMPLIFIED PHYSICS PROPERTIES ===
        // Speed is tracked internally (not relying on physics velocity)
        this.currentSpeed = 0;        // Current speed (positive = forward, negative = reverse)
        this.maxForwardSpeed = 50;    // Max forward speed (will show ~180 km/h)
        this.maxReverseSpeed = 20;    // Max reverse speed
        this.accelerationRate = 25;   // How fast to accelerate (units per second)
        this.brakeRate = 40;          // How fast to brake/decelerate
        this.idleDeceleration = 15;   // Natural slowdown when no input
        
        // Steering
        this.currentYaw = 0;          // Car rotation angle
        this.steeringSpeed = 2.5;     // How fast the car turns
        
        // Create car
        this.createVisualCar();
        this.createPhysicsCar();
        
        console.log('Car Controller initialized with simplified physics');
    }

    /**
     * Create the visual representation of the car
     */
    createVisualCar() {
        this.carGroup = new THREE.Group();
        
        // Chassis
        const chassisGeometry = new THREE.BoxGeometry(
            this.carWidth,
            this.carHeight,
            this.carLength
        );
        const chassisMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x0088ff,
            roughness: 0.5,
            metalness: 0.7
        });
        this.chassisMesh = new THREE.Mesh(chassisGeometry, chassisMaterial);
        this.chassisMesh.castShadow = true;
        this.chassisMesh.receiveShadow = true;
        this.carGroup.add(this.chassisMesh);
        
        // Wheels
        this.wheelMeshes = [];
        const wheelGeometry = new THREE.CylinderGeometry(
            this.wheelRadius,
            this.wheelRadius,
            this.wheelWidth,
            16
        );
        const wheelMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Wheel positions (relative to chassis)
        const wheelPositions = [
            { x: -this.carWidth / 2 - 0.3, y: -this.carHeight / 2, z: this.carLength / 3 },   // Front left
            { x: this.carWidth / 2 + 0.3, y: -this.carHeight / 2, z: this.carLength / 3 },    // Front right
            { x: -this.carWidth / 2 - 0.3, y: -this.carHeight / 2, z: -this.carLength / 3 },  // Rear left
            { x: this.carWidth / 2 + 0.3, y: -this.carHeight / 2, z: -this.carLength / 3 }    // Rear right
        ];
        
        wheelPositions.forEach(pos => {
            const wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheelMesh.position.set(pos.x, pos.y, pos.z);
            wheelMesh.rotation.z = Math.PI / 2;
            wheelMesh.castShadow = true;
            this.carGroup.add(wheelMesh);
            this.wheelMeshes.push(wheelMesh);
        });
        
        // Add a visual indicator for the front of the car
        const frontIndicatorGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.5);
        const frontIndicatorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });
        const frontIndicator = new THREE.Mesh(frontIndicatorGeometry, frontIndicatorMaterial);
        frontIndicator.position.set(0, 0.3, this.carLength / 2 + 0.3);
        this.carGroup.add(frontIndicator);
        
        // Set initial position (start on the track, well above ground to avoid sinking)
        const startAngle = Math.PI / 2;
        const startRadius = 40;
        const startX = Math.cos(startAngle) * startRadius;
        const startZ = Math.sin(startAngle) * startRadius;
        const startY = this.carHeight / 2 + 2; // Position car 2 units above ground initially
        this.carGroup.position.set(startX, startY, startZ);
        
        this.scene.add(this.carGroup);
        console.log('Visual car created at position:', startX, startZ);
    }

    /**
     * Create the physics body for the car
     */
    createPhysicsCar() {
        // Create physics body
        const chassisShape = new CANNON.Box(
            new CANNON.Vec3(this.carWidth / 2, this.carHeight / 2, this.carLength / 2)
        );
        
        this.carBody = new CANNON.Body({
            mass: 1000, // kg - increased mass for better stability
            shape: chassisShape,
            material: this.physicsWorld.getDefaultMaterial(),
            linearDamping: 0.1,  // Lower air resistance for better acceleration response
            angularDamping: 0.8  // Moderate rotational damping to prevent flipping
        });
        
        // Set initial position matching visual car
        this.carBody.position.copy(this.carGroup.position);
        this.carBody.quaternion.setFromEuler(0, 0, 0);
        
        this.physicsWorld.addBody(this.carBody);
        console.log('Physics car body created with mass:', this.carBody.mass);
    }

    /**
     * Update car physics and controls - SIMPLIFIED VERSION
     */
    update(deltaTime) {
        const keys = this.inputManager.getKeys();
        
        // === HANDLE ACCELERATION/DECELERATION ===
        if (keys.forward) {
            // W pressed - accelerate forward
            this.currentSpeed += this.accelerationRate * deltaTime;
            if (this.currentSpeed > this.maxForwardSpeed) {
                this.currentSpeed = this.maxForwardSpeed;
            }
        } else if (keys.backward) {
            // S pressed - reverse/brake
            if (this.currentSpeed > 0) {
                // If moving forward, brake first
                this.currentSpeed -= this.brakeRate * deltaTime;
                if (this.currentSpeed < 0) this.currentSpeed = 0;
            } else {
                // If stopped or reversing, accelerate backwards
                this.currentSpeed -= this.accelerationRate * deltaTime;
                if (this.currentSpeed < -this.maxReverseSpeed) {
                    this.currentSpeed = -this.maxReverseSpeed;
                }
            }
        } else {
            // No W or S - natural deceleration
            if (this.currentSpeed > 0) {
                this.currentSpeed -= this.idleDeceleration * deltaTime;
                if (this.currentSpeed < 0) this.currentSpeed = 0;
            } else if (this.currentSpeed < 0) {
                this.currentSpeed += this.idleDeceleration * deltaTime;
                if (this.currentSpeed > 0) this.currentSpeed = 0;
            }
        }
        
        // === HANDLE STEERING ===
        // Only steer when moving (speed > 0.5)
        const absSpeed = Math.abs(this.currentSpeed);
        if (absSpeed > 0.5) {
            // Steering influence based on speed (faster = less steering)
            const steerFactor = Math.max(0.3, 1 - (absSpeed / this.maxForwardSpeed) * 0.5);
            
            if (keys.left) {
                this.currentYaw += this.steeringSpeed * steerFactor * deltaTime;
            }
            if (keys.right) {
                this.currentYaw -= this.steeringSpeed * steerFactor * deltaTime;
            }
        }
        
        // === APPLY MOVEMENT DIRECTLY TO POSITION ===
        // Calculate forward direction based on current yaw
        const forwardX = Math.sin(this.currentYaw);
        const forwardZ = Math.cos(this.currentYaw);
        
        // Move car by updating position directly (more reliable than physics velocity)
        const moveX = forwardX * this.currentSpeed * deltaTime;
        const moveZ = forwardZ * this.currentSpeed * deltaTime;
        
        this.carBody.position.x += moveX;
        this.carBody.position.z += moveZ;
        
        // Also set velocity for physics interactions (collisions)
        this.carBody.velocity.x = forwardX * this.currentSpeed;
        this.carBody.velocity.z = forwardZ * this.currentSpeed;
        
        // Keep car on ground (limit vertical movement)
        if (this.carBody.position.y < 1) {
            this.carBody.position.y = 1;
            this.carBody.velocity.y = 0;
        }
        
        // === UPDATE ROTATION ===
        const quaternion = new CANNON.Quaternion();
        quaternion.setFromEuler(0, this.currentYaw, 0);
        this.carBody.quaternion.copy(quaternion);
        
        // Prevent rolling and pitching
        this.carBody.angularVelocity.set(0, 0, 0);
        
        // === SYNC VISUAL WITH PHYSICS ===
        this.syncVisualWithPhysics();
        
        // === ANIMATE WHEELS ===
        const wheelRotation = this.currentSpeed * deltaTime * 0.5;
        this.wheelMeshes.forEach(wheel => {
            wheel.rotation.x += wheelRotation;
        });
    }

    /**
     * Synchronize visual mesh with physics body
     */
    syncVisualWithPhysics() {
        this.carGroup.position.copy(this.carBody.position);
        this.carGroup.quaternion.copy(this.carBody.quaternion);
    }

    /**
     * Get car's current speed in km/h
     * @returns {number}
     */
    getSpeed() {
        // Use internal currentSpeed for stable display
        const speedKMH = Math.abs(this.currentSpeed) * 3.6; // Convert m/s to km/h
        return Math.round(speedKMH);
    }

    /**
     * Get car's position
     * @returns {CANNON.Vec3}
     */
    getPosition() {
        return this.carBody.position;
    }

    /**
     * Get car's rotation (quaternion)
     * @returns {CANNON.Quaternion}
     */
    getQuaternion() {
        return this.carBody.quaternion;
    }

    /**
     * Reset car to starting position
     */
    reset() {
        const startAngle = Math.PI / 2;
        const startRadius = 40;
        const startX = Math.cos(startAngle) * startRadius;
        const startZ = Math.sin(startAngle) * startRadius;
        const startY = this.carHeight / 2 + 2;
        
        this.carBody.position.set(startX, startY, startZ);
        this.carBody.velocity.set(0, 0, 0);
        this.carBody.angularVelocity.set(0, 0, 0);
        
        // Reset speed and rotation
        this.currentSpeed = 0;
        this.currentYaw = 0;
        
        const quaternion = new CANNON.Quaternion();
        quaternion.setFromEuler(0, 0, 0);
        this.carBody.quaternion.copy(quaternion);
        
        this.syncVisualWithPhysics();
        console.log('Car reset to starting position');
    }

    /**
     * Clean up resources
     */
    dispose() {
        this.scene.remove(this.carGroup);
        this.physicsWorld.removeBody(this.carBody);
    }
}
