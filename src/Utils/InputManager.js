/**
 * InputManager - Handles keyboard input for car controls
 */
export class InputManager {
    constructor() {
        // Track key states
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('Input Manager initialized');
    }

    /**
     * Set up keyboard event listeners
     */
    setupEventListeners() {
        // Key down event
        window.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });
        
        // Key up event
        window.addEventListener('keyup', (event) => {
            this.handleKeyUp(event);
        });
    }

    /**
     * Handle key down events
     */
    handleKeyDown(event) {
        switch (event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.keys.forward = true;
                break;
            case 's':
            case 'arrowdown':
                this.keys.backward = true;
                break;
            case 'a':
            case 'arrowleft':
                this.keys.left = true;
                break;
            case 'd':
            case 'arrowright':
                this.keys.right = true;
                break;
        }
    }

    /**
     * Handle key up events
     */
    handleKeyUp(event) {
        switch (event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.keys.forward = false;
                break;
            case 's':
            case 'arrowdown':
                this.keys.backward = false;
                break;
            case 'a':
            case 'arrowleft':
                this.keys.left = false;
                break;
            case 'd':
            case 'arrowright':
                this.keys.right = false;
                break;
        }
    }

    /**
     * Get current key states
     * @returns {Object} Current state of all keys
     */
    getKeys() {
        return this.keys;
    }

    /**
     * Check if a specific key is pressed
     * @param {string} key - Key name to check
     * @returns {boolean}
     */
    isKeyPressed(key) {
        return this.keys[key] || false;
    }

    /**
     * Reset all key states
     */
    reset() {
        this.keys.forward = false;
        this.keys.backward = false;
        this.keys.left = false;
        this.keys.right = false;
    }
}
