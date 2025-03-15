/**
 * Fallback View
 * A non-AR 3D visualization of the neural network for devices without AR support
 */

class FallbackView {
    constructor(containerElement) {
        this.container = containerElement;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.neuralNetwork = null;
        this.isActive = false;
        this.clock = new THREE.Clock();
        
        // Initialize Three.js scene
        this.initThreeJS();
    }
    
    // Initialize Three.js environment
    initThreeJS() {
        try {
            // Create scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0xf0f0f0);
            
            // Create camera
            this.camera = new THREE.PerspectiveCamera(
                70, // FOV
                window.innerWidth / window.innerHeight, // Aspect ratio
                0.01, // Near
                100 // Far
            );
            
            this.camera.position.z = 1.5;
            this.camera.position.y = 0.5;
            
            // Create renderer
            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true
            });
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.container.appendChild(this.renderer.domElement);
            
            // Add orbit controls if available
            if (typeof THREE.OrbitControls !== 'undefined') {
                this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
                this.controls.enableDamping = true;
                this.controls.dampingFactor = 0.1;
                this.controls.rotateSpeed = 0.5;
                this.controls.target.set(0, 0, 0);
            } else {
                console.warn('OrbitControls not available. Using static camera view.');
            }
            
            // Add lights
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            this.scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(1, 2, 3);
            this.scene.add(directionalLight);
            
            // Add a grid for reference
            const gridHelper = new THREE.GridHelper(10, 20, 0xcccccc, 0xcccccc);
            gridHelper.position.y = -0.5;
            this.scene.add(gridHelper);
            
            // Handle window resize
            window.addEventListener('resize', () => {
                if (!this.isActive) return;
                
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            });
        } catch (error) {
            console.error('Error initializing Three.js:', error);
            throw new Error('Failed to initialize 3D environment: ' + error.message);
        }
    }
    
    // Initialize and add neural network
    initialize() {
        try {
            if (!this.neuralNetwork) {
                // Create the neural network
                this.neuralNetwork = new NeuralNetwork({
                    size: 0.7, // Make it a bit larger for better visibility
                });
                
                // Add to scene
                const mesh = this.neuralNetwork.getMesh();
                mesh.position.set(0, 0, 0);
                mesh.visible = true;
                this.scene.add(mesh);
                
                // Start animations
                this.neuralNetwork.startAnimations();
            }
            
            // Add interactive controls if OrbitControls isn't available
            if (!this.controls) {
                this.setupBasicControls();
            }
            
            // Start rendering
            this.isActive = true;
            this.animate();
            
            return true;
        } catch (error) {
            console.error('Error initializing neural network:', error);
            throw new Error('Failed to initialize neural network: ' + error.message);
        }
    }
    
    // Setup basic keyboard/mouse controls if OrbitControls is not available
    setupBasicControls() {
        // Simple rotation with mouse movement
        let isMouseDown = false;
        let lastMouseX = 0;
        let lastMouseY = 0;
        
        this.container.addEventListener('mousedown', (event) => {
            isMouseDown = true;
            lastMouseX = event.clientX;
            lastMouseY = event.clientY;
        });
        
        this.container.addEventListener('mousemove', (event) => {
            if (!isMouseDown) return;
            const deltaX = event.clientX - lastMouseX;
            const deltaY = event.clientY - lastMouseY;
            
            if (this.neuralNetwork && this.neuralNetwork.group) {
                this.neuralNetwork.group.rotation.y += deltaX * 0.01;
                this.neuralNetwork.group.rotation.x += deltaY * 0.01;
            }
            
            lastMouseX = event.clientX;
            lastMouseY = event.clientY;
        });
        
        this.container.addEventListener('mouseup', () => {
            isMouseDown = false;
        });
        
        // Touch events for mobile
        this.container.addEventListener('touchstart', (event) => {
            if (event.touches.length === 1) {
                isMouseDown = true;
                lastMouseX = event.touches[0].clientX;
                lastMouseY = event.touches[0].clientY;
            }
        });
        
        this.container.addEventListener('touchmove', (event) => {
            if (!isMouseDown || event.touches.length !== 1) return;
            const deltaX = event.touches[0].clientX - lastMouseX;
            const deltaY = event.touches[0].clientY - lastMouseY;
            
            if (this.neuralNetwork && this.neuralNetwork.group) {
                this.neuralNetwork.group.rotation.y += deltaX * 0.01;
                this.neuralNetwork.group.rotation.x += deltaY * 0.01;
            }
            
            lastMouseX = event.touches[0].clientX;
            lastMouseY = event.touches[0].clientY;
        });
        
        this.container.addEventListener('touchend', () => {
            isMouseDown = false;
        });
    }
    
    // Animation loop
    animate() {
        if (!this.isActive) return;
        
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        
        // Update controls
        if (this.controls) {
            this.controls.update();
        }
        
        // Update neural network
        if (this.neuralNetwork && this.neuralNetwork.update) {
            this.neuralNetwork.update(delta);
        }
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }
    
    // Stop rendering
    stop() {
        this.isActive = false;
        
        // Clean up
        if (this.neuralNetwork) {
            this.neuralNetwork.dispose();
            this.neuralNetwork = null;
        }
        
        // Clear the container
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
    }
} 