# 3D Racing Game Prototype - Challenge 1

**Author:** Le Tiep Tuyen  
**Student ID:** 22020015  
**Project:** 3D Car Racing Game using Three.js and Cannon.js

## 📋 Project Overview

This is a 3D car racing game prototype built with Three.js for rendering and Cannon.js (cannon-es) for physics simulation. The game features a circular racing track, realistic car physics, lap counting, and a heads-up display (HUD) showing speed, lap count, and elapsed time.

## ✨ Features

### Core Features
- ✅ **3D Environment**: Fully rendered 3D scene with ground, walls, and racing track
- ✅ **Physics Simulation**: Realistic physics powered by Cannon.js with gravity and collisions
- ✅ **Car Controls**: Smooth car movement with WASD/Arrow key controls
- ✅ **Camera Follow**: Dynamic camera that follows the car from behind
- ✅ **Lap Detection**: Checkpoint system for automatic lap counting
- ✅ **HUD Display**: Real-time display of speed (km/h), lap count, and timer
- ✅ **Visual Polish**: Shadows, textures, and lighting effects

### Technical Implementation
- Modular architecture with separate classes for different components
- Physics-visual synchronization for accurate representation
- Fixed time-step physics simulation for stability
- Smooth camera interpolation
- Checkpoint-based lap detection system

## 🛠️ Technologies Used

| Library | Version | Purpose |
|---------|---------|---------|
| **Three.js** | ^0.160.0 | 3D rendering engine |
| **Cannon-es** | ^0.20.0 | Physics simulation |
| **Vite** | ^5.0.0 | Build tool and dev server |

## 📁 Project Structure

```
3D-Challenge1/
├── src/
│   ├── Car/
│   │   └── CarController.js      # Car visual model and physics
│   ├── World/
│   │   ├── PhysicsWorld.js       # Cannon.js physics world setup
│   │   └── Environment.js        # Track, ground, walls, checkpoints
│   ├── Utils/
│   │   ├── InputManager.js       # Keyboard input handling
│   │   └── GameLogic.js          # Lap counting and game state
│   └── main.js                   # Main entry point and game loop
├── assets/
│   ├── textures/                 # Texture files (optional)
│   └── models/                   # 3D models (optional)
├── index.html                    # HTML entry with HUD
├── style.css                     # HUD and UI styling
├── package.json                  # Dependencies and scripts
├── README.md                     # This file
└── challenge-1-requirements.md   # Original requirements
```

## 🚀 Installation and Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)

### Installation Steps

1. **Navigate to the project directory:**
   ```bash
   cd "d:\DevTools\Projects\3D Programming\3D-Challenge1"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Vite will display a local URL (typically `http://localhost:5173`)
   - Open this URL in your browser

5. **Build for production (optional):**
   ```bash
   npm run build
   ```

## 🎮 Controls Guide

### Keyboard Controls

| Key | Action |
|-----|--------|
| **W** or **↑** | Accelerate forward |
| **S** or **↓** | Brake / Reverse |
| **A** or **←** | Steer left |
| **D** or **→** | Steer right |

### Gameplay Instructions

1. Click the **"START GAME"** button to begin
2. Drive through the **yellow checkpoints** in order
3. The **green checkpoint** marks the start/finish line
4. Complete full laps by passing through all checkpoints
5. Monitor your speed, lap count, and time in the HUD

## 🎯 Game Mechanics

### Physics
- **Gravity**: -9.82 m/s² (realistic Earth gravity)
- **Car Mass**: 1000 kg (heavy for better stability)
- **Friction**: 0.3 (ground-car interaction)
- **Air Resistance**: Linear and angular damping applied

### Car Behavior
- **Acceleration**: Gradual speed increase (25 units/second) for realistic feel
- **Braking**: Strong deceleration (40 units/second) when pressing S while moving forward
- **Reverse**: Separate reverse mode (max 20 m/s) when stopped or moving backward
- **Idle Deceleration**: Natural slowdown (15 units/second) when no input
- **Steering**: Speed-dependent turning - faster speed = less steering influence
- **Max Forward Speed**: 50 m/s (~180 km/h)
- **Max Reverse Speed**: 20 m/s (~72 km/h)

### Lap Detection
- **4 Checkpoints**: Evenly distributed around the track
- **Sequential Detection**: Must pass checkpoints in order
- **Distance Threshold**: 8 units from checkpoint center
- **Visual Feedback**: Checkpoints flash green when passed
- **Lap Completion**: Full notification when lap is completed

## 🏗️ Architecture Details

### Class Overview

#### `PhysicsWorld` (src/World/PhysicsWorld.js)
- Initializes Cannon.js world with gravity
- Manages contact materials for friction/restitution
- Provides fixed time-step physics updates

#### `Environment` (src/World/Environment.js)
- Creates ground plane with checkerboard texture
- Generates circular track walls (inner and outer)
- Places checkpoint markers for lap detection
- Maintains physics-visual synchronization

#### `CarController` (src/Car/CarController.js)
- Visual car model (chassis + 4 wheels + front indicator)
- Physics body with 1000kg mass for stability
- **Simplified arcade-style physics**:
  - Internal speed tracking (not relying on physics velocity)
  - Direct position updates for reliable movement
  - Gradual acceleration/deceleration for smooth driving
- Input-driven movement and steering
- Speed-dependent steering (faster = less turning)
- Smooth wheel rotation animation

#### `InputManager` (src/Utils/InputManager.js)
- Captures keyboard events
- Maintains key state map
- Provides clean interface for control queries

#### `GameLogic` (src/Utils/GameLogic.js)
- Lap counting and checkpoint management
- Timer functionality
- Game state control (start/stop/reset)
- Visual notifications for lap completion

#### `RacingGame` (src/main.js)
- Main orchestrator class
- Scene, lighting, and renderer setup
- Camera follow logic
- HUD updates
- Animation loop

## 🎨 Customization Options

### Modify Car Properties
Edit [src/Car/CarController.js](src/Car/CarController.js):
```javascript
// Speed settings
this.maxForwardSpeed = 50;    // Max forward speed (m/s)
this.maxReverseSpeed = 20;    // Max reverse speed (m/s)

// Acceleration/Deceleration rates
this.accelerationRate = 25;   // How fast to accelerate (units/second)
this.brakeRate = 40;          // How fast to brake (units/second)
this.idleDeceleration = 15;   // Natural slowdown when no input

// Steering
this.steeringSpeed = 2.5;     // Turning speed
```

### Modify Track Dimensions
Edit [src/World/Environment.js](src/World/Environment.js):
```javascript
this.trackRadius = 50;       // Track circle radius
this.trackWidth = 20;        // Track width
this.wallHeight = 5;         // Wall height
```

### Modify Physics
Edit [src/World/PhysicsWorld.js](src/World/PhysicsWorld.js):
```javascript
this.world.gravity.set(0, -9.82, 0);  // Gravity strength
friction: 0.3,                         // Surface friction
restitution: 0.2,                      // Bounciness
```

## 📊 Performance Considerations

- **Fixed Time Step**: 1/60 second for stable physics
- **Shadow Maps**: 2048x2048 resolution
- **Pixel Ratio**: Capped at 2 for performance
- **Fog**: Reduces distant rendering load
- **Efficient Collision**: Uses NaiveBroadphase for small scene

## 🐛 Troubleshooting

### Issue: Game doesn't start
- **Solution**: Check browser console for errors
- Ensure all dependencies are installed (`npm install`)
- Try clearing browser cache

### Issue: Car is too fast/slow
- **Solution**: Adjust `maxForwardSpeed`, `accelerationRate`, and `idleDeceleration` in CarController.js

### Issue: Steering is unresponsive
- **Solution**: Increase `steeringSpeed` value in CarController.js
- Note: Steering only works when car is moving (speed > 0.5)
- Check if keyboard events are being captured

### Issue: Physics feels weird
- **Solution**: The car uses simplified arcade-style physics with direct position updates
- Adjust `linearDamping` and `angularDamping` in createPhysicsCar() method
- Modify contact material friction/restitution in PhysicsWorld.js

### Issue: Speed display jumps erratically
- **Solution**: The car now uses internal `currentSpeed` tracking for stable HUD display
- This is independent of physics velocity calculations

## 🎓 Learning Outcomes

This project demonstrates:
- Integration of 3D rendering (Three.js) with physics simulation (Cannon.js)
- Modular JavaScript architecture with ES6 modules
- Real-time synchronization between visual and physics representations
- Game state management and user input handling
- Camera control and following mechanics
- Performance optimization techniques

## 📝 Future Enhancements (Optional)

Potential improvements based on bonus features:
- 🏎️ **Drifting Mechanics**: Adjust friction when turning sharply
- 🚧 **Dynamic Obstacles**: Add moving objects on track
- 🔊 **Audio**: Engine sounds and background music
- 🎮 **UI Menu**: Start screen and game over states
- 🏆 **Best Lap Time**: Track and display personal records
- 🎨 **Better Models**: Import actual 3D car models
- 🌟 **Particle Effects**: Tire smoke, dust trails

## 📄 License

MIT License - Free to use for educational purposes

## 👨‍💻 Author Information

**Name:** Le Tiep Tuyen  
**Student ID:** 22020015  
**Course:** 3D Programming - Three.js  
**Project:** Challenge 1 - 3D Racing Game Prototype

---

**Note:** This project was created as part of the "3D Programming - Three JS - Challenge 1" assignment. All requirements from the original specification document have been implemented.

## 🔗 References

- [Three.js Documentation](https://threejs.org/docs/)
- [Cannon-es Documentation](https://pmndrs.github.io/cannon-es/)
- [Vite Documentation](https://vitejs.dev/)
- Challenge 1 Requirements Document

---

**Last Updated:** December 30, 2025
