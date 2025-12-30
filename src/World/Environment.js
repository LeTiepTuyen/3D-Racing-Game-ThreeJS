import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * Environment - Creates the racing track with ground, walls, and boundaries
 */
export class Environment {
    constructor(scene, physicsWorld) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.meshes = [];
        this.bodies = [];
        
        // Track dimensions
        this.trackRadius = 50;
        this.trackWidth = 20;
        this.wallHeight = 5;
        
        this.createGround();
        this.createTrackWalls();
        this.createCheckpoints();
        
        console.log('Environment created with track radius:', this.trackRadius);
    }

    /**
     * Create the ground plane
     */
    createGround() {
        // Visual ground (Three.js)
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        
        // Create checkerboard texture
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        const tileSize = 64;
        for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {
                ctx.fillStyle = (x + y) % 2 === 0 ? '#2a2a2a' : '#3a3a3a';
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
        }
        
        const groundTexture = new THREE.CanvasTexture(canvas);
        groundTexture.wrapS = THREE.RepeatWrapping;
        groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(10, 10);
        
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            map: groundTexture,
            roughness: 0.8,
            metalness: 0.2
        });
        
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.receiveShadow = true;
        this.scene.add(groundMesh);
        this.meshes.push(groundMesh);
        
        // Physics ground (Cannon.js)
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({
            mass: 0, // Static body
            shape: groundShape,
            material: this.physicsWorld.getDefaultMaterial()
        });
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.physicsWorld.addBody(groundBody);
        this.bodies.push(groundBody);
        
        console.log('Ground created');
    }

    /**
     * Create walls defining the racing track (circular track)
     */
    createTrackWalls() {
        const segments = 32;
        const angleStep = (Math.PI * 2) / segments;
        
        // Outer wall
        for (let i = 0; i < segments; i++) {
            const angle = i * angleStep;
            const nextAngle = (i + 1) * angleStep;
            
            const x = Math.cos(angle) * this.trackRadius;
            const z = Math.sin(angle) * this.trackRadius;
            const nextX = Math.cos(nextAngle) * this.trackRadius;
            const nextZ = Math.sin(nextAngle) * this.trackRadius;
            
            const wallLength = Math.sqrt(
                Math.pow(nextX - x, 2) + Math.pow(nextZ - z, 2)
            );
            
            const centerX = (x + nextX) / 2;
            const centerZ = (z + nextZ) / 2;
            
            this.createWallSegment(
                centerX,
                centerZ,
                wallLength,
                angle + angleStep / 2,
                '#ff6600'
            );
        }
        
        // Inner wall
        const innerRadius = this.trackRadius - this.trackWidth;
        for (let i = 0; i < segments; i++) {
            const angle = i * angleStep;
            const nextAngle = (i + 1) * angleStep;
            
            const x = Math.cos(angle) * innerRadius;
            const z = Math.sin(angle) * innerRadius;
            const nextX = Math.cos(nextAngle) * innerRadius;
            const nextZ = Math.sin(nextAngle) * innerRadius;
            
            const wallLength = Math.sqrt(
                Math.pow(nextX - x, 2) + Math.pow(nextZ - z, 2)
            );
            
            const centerX = (x + nextX) / 2;
            const centerZ = (z + nextZ) / 2;
            
            this.createWallSegment(
                centerX,
                centerZ,
                wallLength,
                angle + angleStep / 2,
                '#ff6600'
            );
        }
        
        console.log('Track walls created');
    }

    /**
     * Create a single wall segment
     */
    createWallSegment(x, z, length, rotation, color) {
        // Visual wall
        const wallGeometry = new THREE.BoxGeometry(length, this.wallHeight, 1);
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.7,
            metalness: 0.3
        });
        const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
        wallMesh.position.set(x, this.wallHeight / 2, z);
        wallMesh.rotation.y = rotation;
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        this.scene.add(wallMesh);
        this.meshes.push(wallMesh);
        
        // Physics wall
        const wallShape = new CANNON.Box(
            new CANNON.Vec3(length / 2, this.wallHeight / 2, 0.5)
        );
        const wallBody = new CANNON.Body({
            mass: 0, // Static
            shape: wallShape,
            material: this.physicsWorld.getDefaultMaterial()
        });
        wallBody.position.set(x, this.wallHeight / 2, z);
        wallBody.quaternion.setFromEuler(0, rotation, 0);
        this.physicsWorld.addBody(wallBody);
        this.bodies.push(wallBody);
    }

    /**
     * Create checkpoint markers for lap detection
     */
    createCheckpoints() {
        this.checkpoints = [];
        const numCheckpoints = 4;
        
        for (let i = 0; i < numCheckpoints; i++) {
            const angle = (i / numCheckpoints) * Math.PI * 2;
            const checkpointRadius = this.trackRadius - this.trackWidth / 2;
            
            const x = Math.cos(angle) * checkpointRadius;
            const z = Math.sin(angle) * checkpointRadius;
            
            // Visual checkpoint (transparent plane)
            const checkpointGeometry = new THREE.PlaneGeometry(
                this.trackWidth + 2,
                this.wallHeight
            );
            const checkpointMaterial = new THREE.MeshBasicMaterial({
                color: i === 0 ? 0x00ff00 : 0xffff00,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            const checkpointMesh = new THREE.Mesh(
                checkpointGeometry,
                checkpointMaterial
            );
            checkpointMesh.position.set(x, this.wallHeight / 2, z);
            checkpointMesh.rotation.y = angle + Math.PI / 2;
            this.scene.add(checkpointMesh);
            this.meshes.push(checkpointMesh);
            
            // Store checkpoint data
            this.checkpoints.push({
                id: i,
                position: new THREE.Vector3(x, 0, z),
                angle: angle,
                passed: false,
                mesh: checkpointMesh
            });
        }
        
        console.log('Checkpoints created:', numCheckpoints);
    }

    /**
     * Get all checkpoints
     */
    getCheckpoints() {
        return this.checkpoints;
    }

    /**
     * Update environment (if needed for animations)
     */
    update(deltaTime) {
        // Optional: Add animated elements here
    }

    /**
     * Clean up resources
     */
    dispose() {
        this.meshes.forEach(mesh => {
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
            this.scene.remove(mesh);
        });
        
        this.bodies.forEach(body => {
            this.physicsWorld.removeBody(body);
        });
    }
}
