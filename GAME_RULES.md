# 🏎️ 3D Racing Game - Rules & Mechanics

## 📋 Game Overview

A 3D car racing game where you navigate through a circular track, passing through checkpoints to earn points and complete laps. The goal is to complete **2 laps** to win the race!

---

## 🎮 Controls

### Keyboard Controls
| Key | Action |
|-----|--------|
| **W** / **↑** | Accelerate forward |
| **S** / **↓** | Brake / Reverse |
| **A** / **←** | Steer left |
| **D** / **→** | Steer right |
| **ESC** | Pause / Resume game |

### Camera Controls (Mouse)
| Action | Description |
|--------|-------------|
| **Hold Left Click + Drag** | Rotate camera around the car |
| **Mouse Wheel** | Zoom in/out |

> **Tip**: Use camera controls to get a better view of upcoming turns and checkpoints!

---

## 🏆 Scoring System

### Checkpoint Points
- **Base Points**: +100 points per checkpoint passed
- **Speed Bonus**: If traveling above 100 km/h when passing a checkpoint:
  - Points are **doubled** (×2 multiplier)
  - Total: +200 points per checkpoint at high speed

### Lap Bonus
- **Lap Completion**: +500 bonus points for each completed lap
- Points are cumulative throughout the race

### Score Calculation Example
```
Checkpoint at low speed:  100 points
Checkpoint at high speed: 200 points (100 × 2)
Lap completion bonus:     500 points

Sample race:
- 4 checkpoints × 100 pts (slow) = 400 pts
- Lap 1 bonus = 500 pts
- 4 checkpoints × 200 pts (fast) = 800 pts
- Lap 2 bonus = 500 pts
- 4 checkpoints × 150 pts (mixed) = 600 pts
- Lap 3 bonus = 500 pts
Total: 3,300 points
```

---

## 🏁 Win Condition

**Complete 2 full laps** to finish the race!

Each lap requires:
1. Pass through **all 4 checkpoints** in order
2. Checkpoints are marked with colored gates:
   - 🟢 **Green**: Start/Finish line (Checkpoint 1)
   - 🟡 **Yellow**: Intermediate checkpoints (2, 3, 4)
3. Checkpoints must be passed **sequentially**
4. When all checkpoints are passed, the lap is complete

---

## ❌ Game Over Conditions

Currently, the game ends when you **complete 2 laps** (WIN condition).

**Note**: There is no "lose" condition in this version. Future updates may include:
- Time limit challenges
- Car damage system
- Falling off the track penalty

---

## ⏸️ Menu Options

Access the menu by clicking **☰ MENU** (top-right corner):

| Option | Description |
|--------|-------------|
| **🔄 Restart** | Reset the race from the beginning |
| **⏸️ Pause** | Pause the current game |
| **▶️ Continue** | Resume from pause (shown in pause overlay) |
| **🔄 Play Again** | Start a new race (shown after race completion) |

---

## 💡 Tips for High Scores

1. **Maintain High Speed**: Try to pass checkpoints at 100+ km/h for double points
2. **Learn the Track**: Memorize checkpoint locations for optimal racing lines
3. **Smooth Steering**: Gentle turns at high speed prevent slowdowns
4. **Don't Crash**: Wall collisions slow you down significantly

---

## 📊 HUD Information

The Heads-Up Display shows:
- **Speed**: Current velocity in km/h
- **Lap**: Current lap / Total laps (e.g., 1/3)
- **Time**: Elapsed race time
- **Score**: Total accumulated points

---

## 🎯 Race Summary (Game Over Screen)

After completing the race, you'll see:
- **Final Score**: Total points earned
- **Laps Completed**: Number of laps finished
- **Total Time**: Overall race duration
- **Best Lap**: Your fastest lap time

---

**Good luck and race fast! 🏁**

*Author: Le Tiep Tuyen (Student ID: 22020015)*
