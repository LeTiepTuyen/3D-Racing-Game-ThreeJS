import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

/**
 * CarController - Manages the car's visual representation and physics
 * Simple arcade-style car controls with Bugatti car model
 */
export class CarController {
    constructor(scene, physicsWorld, inputManager) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.inputManager = inputManager;
        
        // Car dimensions (for physics body)
        this.carWidth = 2;
        this.carHeight = 1;
        this.carLength = 4;
        this.wheelRadius = 0.4;
        this.wheelWidth = 0.3;
        
        // Model loading state
        this.modelLoaded = false;
        this.carModel = null;
        
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
        
        // Create car group first
        this.carGroup = new THREE.Group();
        
        // Set initial position
        const startAngle = Math.PI / 2;
        const startRadius = 40;
        const startX = Math.cos(startAngle) * startRadius;
        const startZ = Math.sin(startAngle) * startRadius;
        const startY = 1; // Position car at ground level (y=1 is ground surface)
        this.carGroup.position.set(startX, startY, startZ);
        this.scene.add(this.carGroup);
        
        // Create placeholder car first (immediate feedback)
        this.createPlaceholderCar();
        
        // Then load the Bugatti model
        this.loadBugattiModel();
        
        // Create physics body
        this.createPhysicsCar();
        
        console.log('Car Controller initialized with Bugatti model loading...');
    }
    
    /**
     * Create a placeholder car while the model loads
     */
    createPlaceholderCar() {
        // Simple box as placeholder
        const geometry = new THREE.BoxGeometry(this.carWidth, this.carHeight, this.carLength);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x0088ff,
            roughness: 0.5,
            metalness: 0.7,
            transparent: true,
            opacity: 0.5
        });
        this.placeholderMesh = new THREE.Mesh(geometry, material);
        this.placeholderMesh.castShadow = true;
        this.carGroup.add(this.placeholderMesh);
    }
    
    /**
     * Load the Bugatti OBJ model with materials
     */
    loadBugattiModel() {
        const mtlLoader = new MTLLoader();
        const objLoader = new OBJLoader();
        
        // Load materials first
        mtlLoader.setPath('/assets/models/bugatti/');
        mtlLoader.load('bugatti.mtl', 
            (materials) => {
                materials.preload();
                console.log('Bugatti materials loaded');
                
                // Set materials and load OBJ
                objLoader.setMaterials(materials);
                objLoader.setPath('/assets/models/bugatti/');
                objLoader.load('bugatti.obj',
                    (object) => {
                        this.onModelLoaded(object);
                    },
                    (xhr) => {
                        const percent = (xhr.loaded / xhr.total * 100).toFixed(0);
                        console.log(`Loading Bugatti model: ${percent}%`);
                    },
                    (error) => {
                        console.error('Error loading Bugatti OBJ:', error);
                        this.createFallbackCar();
                    }
                );
            },
            (xhr) => {
                console.log(`Loading materials: ${(xhr.loaded / xhr.total * 100).toFixed(0)}%`);
            },
            (error) => {
                console.error('Error loading Bugatti MTL:', error);
                // Try loading OBJ without materials
                this.loadOBJWithoutMaterials(objLoader);
            }
        );
    }
    
    /**
     * Load OBJ without materials as fallback
     */
    loadOBJWithoutMaterials(objLoader) {
        objLoader.setPath('/assets/models/bugatti/');
        objLoader.load('bugatti.obj',
            (object) => {
                // Apply default material to all meshes
                object.traverse((child) => {
                    if (child.isMesh) {
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0x0044aa,
                            roughness: 0.3,
                            metalness: 0.8
                        });
                    }
                });
                this.onModelLoaded(object);
            },
            undefined,
            (error) => {
                console.error('Error loading Bugatti OBJ without materials:', error);
                this.createFallbackCar();
            }
        );
    }
    
    /**
     * Handle loaded model
     */
    onModelLoaded(object) {
        console.log('Bugatti model loaded successfully!');
        
        // Remove placeholder
        if (this.placeholderMesh) {
            this.carGroup.remove(this.placeholderMesh);
            this.placeholderMesh.geometry.dispose();
            this.placeholderMesh.material.dispose();
            this.placeholderMesh = null;
        }
        
        this.carModel = object;
        
        // List of unwanted materials/objects from Blender studio setup
        const unwantedMaterials = [
            'back_drop', 'Studio_Lights', 'sun', 'None',
            'back_drop.004', 'Studio_Lights.004', 'Studio_Lights.005'
        ];
        
        // Remove unwanted meshes (studio lights, backdrop, etc.)
        const meshesToRemove = [];
        object.traverse((child) => {
            if (child.isMesh) {
                const materialName = child.material?.name || '';
                const meshName = child.name || '';
                
                // Check if this mesh should be removed
                const shouldRemove = unwantedMaterials.some(unwanted => 
                    materialName.toLowerCase().includes(unwanted.toLowerCase()) ||
                    meshName.toLowerCase().includes(unwanted.toLowerCase()) ||
                    meshName.toLowerCase().includes('backdrop') ||
                    meshName.toLowerCase().includes('studio') ||
                    meshName.toLowerCase().includes('light') ||
                    meshName.toLowerCase().includes('plane') ||
                    meshName.toLowerCase().includes('ground')
                );
                
                if (shouldRemove) {
                    meshesToRemove.push(child);
                    console.log('Removing unwanted mesh:', meshName, 'material:', materialName);
                }
            }
        });
        
        // Remove the unwanted meshes
        meshesToRemove.forEach(mesh => {
            if (mesh.parent) {
                mesh.parent.remove(mesh);
            }
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(m => m.dispose());
                } else {
                    mesh.material.dispose();
                }
            }
        });
        
        console.log(`Removed ${meshesToRemove.length} unwanted meshes`);
        
        // Calculate model bounding box AFTER removing unwanted meshes
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        console.log('Model size after cleanup:', size);
        
        // Scale the model to be larger and more visible
        // Target car length is around 8 units for better visibility
        const targetCarLength = 8;
        const maxDimension = Math.max(size.x, size.y, size.z);
        const scaleFactor = targetCarLength / maxDimension;
        
        // Apply scale
        object.scale.setScalar(scaleFactor);
        
        // Recalculate after scaling
        const scaledBox = new THREE.Box3().setFromObject(object);
        const scaledSize = scaledBox.getSize(new THREE.Vector3());
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
        
        console.log('Model scaled size:', scaledSize);
        
        // Center the model and position exactly on ground level
        // The car group is positioned at carHeight/2 + 2 = 2.5 above world origin
        // So we need to offset the model within the group to sit on ground
        object.position.set(
            -scaledCenter.x,
            -scaledBox.min.y,  // Place bottom of car exactly at y=0 of carGroup
            -scaledCenter.z
        );
        
        // Rotate model if needed (Bugatti OBJ might face wrong direction)
        // Uncomment and adjust if car faces wrong way:
        // object.rotation.y = Math.PI; // Rotate 180 degrees
        
        // Enable shadows for all remaining meshes
        object.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        // Add model to car group
        this.carGroup.add(object);
        
        this.modelLoaded = true;
        console.log('Bugatti model added to scene');
    }
    
    /**
     * Create fallback car if model fails to load
     */
    createFallbackCar() {
        console.log('Creating fallback car model...');
        
        // Remove placeholder if exists
        if (this.placeholderMesh) {
            this.carGroup.remove(this.placeholderMesh);
            this.placeholderMesh.geometry.dispose();
            this.placeholderMesh.material.dispose();
        }
        
        // Create a more detailed fallback car
        this.createDetailedFallbackCar();
    }
    
    /**
     * Create a more detailed fallback car geometry
     */
    createDetailedFallbackCar() {
        // Main body
        const bodyGeometry = new THREE.BoxGeometry(this.carWidth, this.carHeight * 0.6, this.carLength);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x0044aa,
            roughness: 0.3,
            metalness: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = this.carHeight * 0.3;
        body.castShadow = true;
        this.carGroup.add(body);
        
        // Cabin/roof
        const cabinGeometry = new THREE.BoxGeometry(this.carWidth * 0.8, this.carHeight * 0.5, this.carLength * 0.5);
        const cabinMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x111111,
            roughness: 0.1,
            metalness: 0.9
        });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.y = this.carHeight * 0.85;
        cabin.position.z = -this.carLength * 0.1;
        cabin.castShadow = true;
        this.carGroup.add(cabin);
        
        // Wheels
        this.wheelMeshes = [];
        const wheelGeometry = new THREE.CylinderGeometry(this.wheelRadius, this.wheelRadius, this.wheelWidth, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const wheelPositions = [
            { x: -this.carWidth / 2 - 0.1, y: this.wheelRadius, z: this.carLength / 3 },
            { x: this.carWidth / 2 + 0.1, y: this.wheelRadius, z: this.carLength / 3 },
            { x: -this.carWidth / 2 - 0.1, y: this.wheelRadius, z: -this.carLength / 3 },
            { x: this.carWidth / 2 + 0.1, y: this.wheelRadius, z: -this.carLength / 3 }
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(pos.x, pos.y, pos.z);
            wheel.rotation.z = Math.PI / 2;
            wheel.castShadow = true;
            this.carGroup.add(wheel);
            this.wheelMeshes.push(wheel);
        });
        
        // Front lights
        const lightGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.1);
        const lightMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffaa,
            emissive: 0xffffaa,
            emissiveIntensity: 0.5
        });
        
        const leftLight = new THREE.Mesh(lightGeometry, lightMaterial);
        leftLight.position.set(-this.carWidth / 3, this.carHeight * 0.4, this.carLength / 2);
        this.carGroup.add(leftLight);
        
        const rightLight = new THREE.Mesh(lightGeometry, lightMaterial);
        rightLight.position.set(this.carWidth / 3, this.carHeight * 0.4, this.carLength / 2);
        this.carGroup.add(rightLight);
        
        // Rear lights (red)
        const rearLightMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });
        
        const rearLeftLight = new THREE.Mesh(lightGeometry, rearLightMaterial);
        rearLeftLight.position.set(-this.carWidth / 3, this.carHeight * 0.4, -this.carLength / 2);
        this.carGroup.add(rearLeftLight);
        
        const rearRightLight = new THREE.Mesh(lightGeometry, rearLightMaterial);
        rearRightLight.position.set(this.carWidth / 3, this.carHeight * 0.4, -this.carLength / 2);
        this.carGroup.add(rearRightLight);
        
        this.modelLoaded = true;
        console.log('Fallback detailed car created');
    }

    /**
     * Create the physics body for the car
     */
    createPhysicsCar() {
        // Create physics body with size matching the scaled Bugatti model
        // Model is scaled to targetCarLength = 8, so physics body should match
        const physicsWidth = 3;   // Slightly smaller than visual for better feel
        const physicsHeight = 1.5;
        const physicsLength = 6;  // Slightly smaller than visual
        
        const chassisShape = new CANNON.Box(
            new CANNON.Vec3(physicsWidth / 2, physicsHeight / 2, physicsLength / 2)
        );
        
        this.carBody = new CANNON.Body({
            mass: 1500, // kg - increased mass for better collision response
            shape: chassisShape,
            material: this.physicsWorld.getDefaultMaterial(),
            linearDamping: 0.3,  // Higher damping for better collision stopping
            angularDamping: 0.9  // High rotational damping to prevent spinning
        });
        
        // Set initial position matching visual car
        this.carBody.position.copy(this.carGroup.position);
        this.carBody.quaternion.setFromEuler(0, 0, 0);
        
        // Enable collision events
        this.carBody.addEventListener('collide', (event) => {
            this.onCollision(event);
        });
        
        this.physicsWorld.addBody(this.carBody);
        console.log('Physics car body created with dimensions:', physicsWidth, physicsHeight, physicsLength);
    }
    
    /**
     * Handle collision event
     */
    onCollision(event) {
        // Reduce speed on collision with walls
        const impactVelocity = event.contact.getImpactVelocityAlongNormal();
        if (Math.abs(impactVelocity) > 5) {
            // Significant collision - reduce speed
            this.currentSpeed *= 0.2;
            console.log('Collision! Impact velocity:', impactVelocity.toFixed(2));
        }
    }

    /**
     * Update car physics and controls - PHYSICS-BASED VERSION WITH COLLISION
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
        
        // === APPLY MOVEMENT USING PHYSICS VELOCITY (for proper collision) ===
        // Calculate forward direction based on current yaw
        const forwardX = Math.sin(this.currentYaw);
        const forwardZ = Math.cos(this.currentYaw);
        
        // Set velocity for physics engine to handle movement AND collisions
        // The physics engine will apply this velocity and handle wall collisions
        this.carBody.velocity.x = forwardX * this.currentSpeed;
        this.carBody.velocity.z = forwardZ * this.currentSpeed;
        
        // Prevent vertical velocity (keep car on ground)
        this.carBody.velocity.y = 0;
        
        // Keep car at ground level
        if (this.carBody.position.y < 1) {
            this.carBody.position.y = 1;
        }
        
        // === UPDATE ROTATION ===
        const quaternion = new CANNON.Quaternion();
        quaternion.setFromEuler(0, this.currentYaw, 0);
        this.carBody.quaternion.copy(quaternion);
        
        // Prevent rolling and pitching
        this.carBody.angularVelocity.set(0, 0, 0);
        
        // Note: Visual sync is called from main.js AFTER physics update
        // This ensures collision is processed before visual update
        
        // === ANIMATE WHEELS (only for fallback car) ===
        if (this.wheelMeshes && this.wheelMeshes.length > 0) {
            const wheelRotation = this.currentSpeed * deltaTime * 0.5;
            this.wheelMeshes.forEach(wheel => {
                wheel.rotation.x += wheelRotation;
            });
        }
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
        const startY = 0; // Ground level
        
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
        // Clean up model resources
        if (this.carModel) {
            this.carModel.traverse((child) => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                }
            });
        }
        
        // Clean up placeholder if exists
        if (this.placeholderMesh) {
            this.placeholderMesh.geometry.dispose();
            this.placeholderMesh.material.dispose();
        }
        
        this.scene.remove(this.carGroup);
        this.physicsWorld.removeBody(this.carBody);
    }
    
    /**
     * Get the car's visual group (for camera targeting)
     */
    getCarGroup() {
        return this.carGroup;
    }
}
