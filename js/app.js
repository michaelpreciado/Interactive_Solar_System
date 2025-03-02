/**
 * Neural Network AR Visualizer - Main Application
 * 
 * This file initializes the application, sets up event handlers,
 * and manages the overall application state.
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Neural Network AR Visualizer initializing...');
    
    // DOM elements
    const loadingScreen = document.getElementById('loadingScreen');
    const infoPanel = document.getElementById('infoPanel');
    const infoBtn = document.getElementById('infoBtn');
    const infoCloseBtn = document.getElementById('infoCloseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const tutorial = document.getElementById('tutorial');
    const tutorialSteps = Array.from(document.querySelectorAll('.tutorial-step'));
    const placeBtn = document.getElementById('placeBtn');
    const resetPositionBtn = document.getElementById('resetPositionBtn');
    
    // Application state
    let neuralNetwork = null;
    let arVisualizer = null;
    let currentTutorialStep = 0;
    let arInitialized = false;
    let isMarkerMode = false; // Default to markerless mode
    
    // Check if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Initialize neural network
    function initializeNeuralNetwork() {
        console.log('Initializing neural network...');
        neuralNetwork = new NeuralNetwork();
        console.log('Neural network initialized with architecture:', neuralNetwork.architecture);
        return neuralNetwork;
    }
    
    // Function to ensure proper AR canvas sizing
    function ensureProperCanvasSizing() {
        const canvas = document.querySelector('canvas.a-canvas');
        const video = document.querySelector('#arjs-video');
        
        if (canvas) {
            console.log('Fixing canvas sizing');
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.position = 'absolute';
            canvas.style.left = '0';
            canvas.style.top = '0';
            canvas.style.right = '0'; // Ensure right side is properly constrained
        }
        
        if (video) {
            console.log('Fixing video sizing');
            video.style.width = '100%';
            video.style.height = '100%';
            video.style.objectFit = 'cover'; // Ensure video covers the entire screen
            video.style.position = 'absolute';
            video.style.left = '0';
            video.style.top = '0';
            video.style.right = '0'; // Ensure right side is properly constrained
        }
        
        // Fix for body element
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed'; // Prevent scrolling on mobile
        
        // For mobile devices, we need to handle orientation changes
        if (isMobile) {
            window.addEventListener('resize', () => {
                if (canvas) {
                    canvas.style.width = '100%';
                    canvas.style.height = '100%';
                    canvas.style.right = '0'; // Ensure right side is properly constrained
                }
                if (video) {
                    video.style.width = '100%';
                    video.style.height = '100%';
                    video.style.right = '0'; // Ensure right side is properly constrained
                }
                
                // Reapply body fixes
                document.body.style.width = '100%';
                document.body.style.height = '100%';
                document.body.style.overflow = 'hidden';
                document.body.style.position = 'fixed';
            });
            
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    if (canvas) {
                        canvas.style.width = '100%';
                        canvas.style.height = '100%';
                        canvas.style.right = '0'; // Ensure right side is properly constrained
                    }
                    if (video) {
                        video.style.width = '100%';
                        video.style.height = '100%';
                        video.style.right = '0'; // Ensure right side is properly constrained
                    }
                    
                    // Reapply body fixes
                    document.body.style.width = '100%';
                    document.body.style.height = '100%';
                    document.body.style.overflow = 'hidden';
                    document.body.style.position = 'fixed';
                }, 200);
            });
        }
    }
    
    // Initialize AR visualization
    function initializeARVisualization() {
        if (!neuralNetwork) {
            console.error('Neural network must be initialized first');
            return;
        }
        
        console.log('Setting up AR visualization...');
        arVisualizer = new ARNeuralNetworkVisualizer(neuralNetwork);
        
        // Wait for AR.js to initialize
        document.addEventListener('arjs-video-loaded', () => {
            console.log('AR.js video loaded - camera access successful');
            hideLoadingScreen();
            showTutorial();
            showInfoPanel(); // Show info panel by default to guide users
            ensureProperCanvasSizing(); // Ensure canvas is properly sized
            
            // In markerless mode, we can initialize immediately
            if (!isMarkerMode) {
                setTimeout(() => {
                    initializeMarkerlessAR();
                }, 1000);
            }
        });
        
        // Also listen for scene loaded event
        document.querySelector('a-scene').addEventListener('loaded', () => {
            console.log('A-Frame scene loaded');
            ensureProperCanvasSizing(); // Ensure canvas is properly sized
        });
        
        // Add a timeout to hide loading screen even if AR.js doesn't initialize properly
        setTimeout(() => {
            console.log('Timeout reached - forcing loading screen to hide');
            hideLoadingScreen();
            showTutorial();
            showInfoPanel();
        }, 5000);
        
        // Wait for marker detection (only in marker mode)
        document.addEventListener('markerFound', () => {
            console.log('AR marker found - Hiro marker detected');
            if (isMarkerMode && !arInitialized) {
                console.log('Initializing AR visualization for the first time with marker');
                arVisualizer.initialize(document.querySelector('#hiroMarker'));
                arInitialized = true;
                advanceTutorial();
            }
        });
    }
    
    // Initialize markerless AR
    function initializeMarkerlessAR() {
        console.log('Initializing markerless AR visualization');
        const container = document.querySelector('#neuralNetworkContainer');
        if (container && !arInitialized) {
            arVisualizer.initialize(container);
            arInitialized = true;
            advanceTutorial();
        }
    }
    
    // Place neural network at current camera position
    function placeNeuralNetwork() {
        console.log('Placing neural network at current position');
        
        // Get camera position and direction
        const camera = document.querySelector('[camera]');
        const cameraPosition = camera.getAttribute('position');
        const cameraRotation = camera.getAttribute('rotation');
        
        // Calculate position in front of the camera
        const container = document.querySelector('#neuralNetworkContainer');
        if (container) {
            // Position the network 1 meter in front of the camera
            container.setAttribute('position', {
                x: cameraPosition.x,
                y: cameraPosition.y - 0.5, // Slightly below eye level
                z: cameraPosition.z - 1.5  // In front of the camera
            });
            
            // Reset rotation to face the camera
            container.setAttribute('rotation', {
                x: 0,
                y: cameraRotation.y,
                z: 0
            });
            
            // If not initialized yet, initialize now
            if (!arInitialized) {
                initializeMarkerlessAR();
            } else {
                // If already initialized, just update the position
                arVisualizer.updatePosition(container);
            }
        }
    }
    
    // Reset neural network position
    function resetNetworkPosition() {
        console.log('Resetting neural network position');
        
        const container = document.querySelector('#neuralNetworkContainer');
        if (container) {
            // Reset to default position
            container.setAttribute('position', '0 0 -1.5');
            container.setAttribute('rotation', '0 0 0');
            
            // Update visualizer position
            if (arInitialized) {
                arVisualizer.updatePosition(container);
            }
        }
    }
    
    // Hide loading screen
    function hideLoadingScreen() {
        console.log('Hiding loading screen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
    
    // Show info panel
    function showInfoPanel() {
        console.log('Showing info panel');
        infoPanel.style.display = 'block';
    }
    
    // Hide info panel
    function hideInfoPanel() {
        console.log('Hiding info panel');
        infoPanel.style.display = 'none';
    }
    
    // Show tutorial
    function showTutorial() {
        console.log('Showing tutorial');
        tutorial.style.display = 'block';
        updateTutorialStep();
    }
    
    // Hide tutorial
    function hideTutorial() {
        console.log('Hiding tutorial');
        tutorial.style.display = 'none';
    }
    
    // Update tutorial step
    function updateTutorialStep() {
        console.log(`Updating tutorial to step ${currentTutorialStep + 1}`);
        tutorialSteps.forEach((step, index) => {
            if (index === currentTutorialStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }
    
    // Advance to next tutorial step
    function advanceTutorial() {
        currentTutorialStep++;
        console.log(`Advanced to tutorial step ${currentTutorialStep + 1}`);
        
        if (currentTutorialStep >= tutorialSteps.length) {
            // End of tutorial
            console.log('Tutorial completed');
            setTimeout(() => {
                hideTutorial();
            }, 3000);
            return;
        }
        
        updateTutorialStep();
    }
    
    // Reset visualization
    function resetVisualization() {
        console.log('Resetting visualization');
        if (arVisualizer) {
            arVisualizer.dispose();
        }
        
        if (neuralNetwork) {
            neuralNetwork.stopInferenceAnimation();
        }
        
        // Reinitialize
        neuralNetwork = initializeNeuralNetwork();
        arVisualizer = new ARNeuralNetworkVisualizer(neuralNetwork);
        arInitialized = false;
        
        // Show first tutorial step
        currentTutorialStep = 0;
        showTutorial();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        console.log('Setting up event listeners');
        
        // Info button
        infoBtn.addEventListener('click', () => {
            showInfoPanel();
        });
        
        // Info close button
        infoCloseBtn.addEventListener('click', () => {
            hideInfoPanel();
        });
        
        // Reset button
        resetBtn.addEventListener('click', () => {
            resetVisualization();
        });
        
        // Place button
        placeBtn.addEventListener('click', () => {
            placeNeuralNetwork();
        });
        
        // Reset position button
        resetPositionBtn.addEventListener('click', () => {
            resetNetworkPosition();
        });
        
        // Handle device orientation changes
        window.addEventListener('orientationchange', () => {
            console.log('Device orientation changed');
            // Give the browser time to adjust
            setTimeout(() => {
                if (arVisualizer && arInitialized) {
                    // Reinitialize AR visualization on orientation change
                    console.log('Reinitializing AR visualization after orientation change');
                    arVisualizer.dispose();
                    arVisualizer = new ARNeuralNetworkVisualizer(neuralNetwork);
                    arVisualizer.initialize();
                }
            }, 500);
        });
        
        // Handle clicks on neurons for future interaction
        document.addEventListener('click', (event) => {
            // Check if we clicked on a neuron
            if (event.target.tagName === 'A-SPHERE' && event.target.dataset.layerIndex) {
                const layerIndex = parseInt(event.target.dataset.layerIndex);
                const neuronIndex = parseInt(event.target.dataset.neuronIndex);
                
                console.log(`Clicked on neuron: Layer ${layerIndex}, Neuron ${neuronIndex}`);
                
                // Advance tutorial if we're on the last step
                if (currentTutorialStep === 2) {
                    advanceTutorial();
                }
            }
        });
    }
    
    // Handle errors
    function handleErrors() {
        console.log('Setting up error handlers');
        
        window.addEventListener('error', (event) => {
            console.error('Application error:', event.error);
            
            // Show error message
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.innerHTML = `
                <h2>Something went wrong</h2>
                <p>Error: ${event.error ? event.error.message : 'Unknown error'}</p>
                <p>Please try refreshing the page or use a different device.</p>
                <button id="errorCloseBtn">Close</button>
            `;
            
            document.body.appendChild(errorMessage);
            
            // Close error message
            document.getElementById('errorCloseBtn').addEventListener('click', () => {
                document.body.removeChild(errorMessage);
            });
        });
    }
    
    // Check device compatibility
    function checkCompatibility() {
        console.log('Checking device compatibility');
        
        // Check for WebGL support
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            // WebGL not supported
            console.error('WebGL not supported');
            loadingScreen.innerHTML = `
                <div class="loading-content">
                    <h1>Device Not Compatible</h1>
                    <p>Your device does not support WebGL, which is required for this AR experience.</p>
                    <p>Please try using a different device or browser.</p>
                </div>
            `;
            return false;
        }
        
        // Check for camera access
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            // Camera access not supported
            console.error('Camera access not supported');
            loadingScreen.innerHTML = `
                <div class="loading-content">
                    <h1>Camera Access Required</h1>
                    <p>This AR experience requires camera access, which is not supported by your browser.</p>
                    <p>Please try using a different device or browser.</p>
                </div>
            `;
            return false;
        }
        
        console.log('Device compatibility check passed');
        return true;
    }
    
    // Initialize application
    function initializeApp() {
        console.log('Starting application initialization');
        
        // Check device compatibility
        if (!checkCompatibility()) {
            return;
        }
        
        // Initialize components
        initializeNeuralNetwork();
        initializeARVisualization();
        
        // Set up event listeners
        setupEventListeners();
        
        // Handle errors
        handleErrors();
        
        // Add a slight delay to ensure proper canvas sizing
        setTimeout(ensureProperCanvasSizing, 1000);
        
        // Fix AR.js camera feed
        fixARJSCameraFeed();
        
        console.log('Application initialization complete');
    }
    
    // Fix AR.js camera feed
    function fixARJSCameraFeed() {
        // Wait for AR.js to initialize
        setTimeout(() => {
            const video = document.querySelector('#arjs-video');
            if (video) {
                console.log('Fixing AR.js camera feed');
                
                // Force video to use the correct size
                video.style.width = '100vw';
                video.style.height = '100vh';
                video.style.objectFit = 'cover';
                video.style.backgroundColor = 'transparent';
                video.style.position = 'fixed'; // Use fixed positioning for better stability
                video.style.top = '0';
                video.style.left = '0';
                video.style.right = '0';
                video.style.bottom = '0';
                video.style.zIndex = '-1';
                
                // Center the video in all modes
                video.style.objectPosition = '50% 50%';
                video.style.margin = '0 auto'; // Center horizontally
                video.style.display = 'block'; // Ensure it's displayed as block
                video.style.visibility = 'visible'; // Ensure it's visible
                video.style.opacity = '1'; // Ensure it's not transparent
                
                // Check if we're in portrait mode
                const isPortrait = window.innerHeight > window.innerWidth;
                // Check if we're on a narrow viewport
                const isNarrow = window.innerWidth < 480;
                
                // Apply specific fixes for narrow viewports
                if (isNarrow) {
                    console.log('Applying narrow viewport fixes');
                    video.style.minWidth = '100vw';
                    video.style.minHeight = '100vh';
                    video.style.width = '100vw';
                    video.style.height = '100vh';
                    video.style.position = 'fixed';
                    video.style.left = '0';
                    video.style.right = '0';
                    video.style.margin = '0 auto'; // Center horizontally
                    
                    // Ensure video is visible
                    video.style.display = 'block';
                    video.style.visibility = 'visible';
                    video.style.opacity = '1';
                    
                    // Force video to play
                    if (video.paused) {
                        video.play().catch(err => {
                            console.error('Error playing video on narrow viewport:', err);
                        });
                    }
                }
                
                if (isPortrait) {
                    // Scale the video slightly to prevent bottom cutoff
                    video.style.transform = 'scale(1.05)';
                    video.style.webkitTransform = 'scale(1.05)';
                    // Adjust position to ensure center alignment
                    video.style.transformOrigin = 'center center';
                    video.style.webkitTransformOrigin = 'center center';
                    // Ensure video is centered horizontally
                    video.style.left = '0';
                    video.style.right = '0';
                    video.style.margin = '0 auto';
                }
                
                // iOS specific fixes
                if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                    console.log('Applying iOS-specific fixes');
                    video.style.position = 'fixed';
                    video.style.left = '0';
                    video.style.right = '0';
                    video.style.margin = '0 auto'; // Center horizontally
                    
                    // For iOS in portrait mode, apply additional scaling
                    if (isPortrait) {
                        video.style.transform = 'scale(1.1)';
                        video.style.webkitTransform = 'scale(1.1)';
                        video.style.transformOrigin = 'center center';
                        video.style.webkitTransformOrigin = 'center center';
                    } else {
                        video.style.transform = 'none';
                        video.style.webkitTransform = 'none';
                    }
                    
                    // Force layout recalculation
                    document.body.style.display = 'none';
                    setTimeout(() => {
                        document.body.style.display = '';
                    }, 10);
                }
                
                // Try to restart the video element if it's paused
                if (video.paused) {
                    video.play().catch(err => {
                        console.error('Error playing video:', err);
                    });
                }
                
                // Fix canvas and scene elements as well
                const canvas = document.querySelector('canvas.a-canvas');
                const scene = document.querySelector('a-scene');
                
                if (canvas) {
                    canvas.style.width = '100vw';
                    canvas.style.height = '100vh';
                    canvas.style.position = 'fixed'; // Use fixed positioning for better stability
                    canvas.style.top = '0';
                    canvas.style.left = '0';
                    canvas.style.right = '0';
                    canvas.style.bottom = '0';
                    canvas.style.margin = '0 auto'; // Center horizontally
                    
                    // In portrait mode, make canvas slightly taller to prevent bottom cutoff
                    if (isPortrait) {
                        canvas.style.height = '105vh';
                    }
                    
                    // Apply specific fixes for narrow viewports
                    if (isNarrow) {
                        canvas.style.minWidth = '100vw';
                        canvas.style.minHeight = '100vh';
                        canvas.style.width = '100vw';
                        canvas.style.height = '100vh';
                        canvas.style.position = 'fixed';
                        canvas.style.left = '0';
                        canvas.style.right = '0';
                        canvas.style.margin = '0 auto'; // Center horizontally
                    }
                }
                
                if (scene) {
                    scene.style.width = '100vw';
                    scene.style.height = '100vh';
                    scene.style.position = 'fixed'; // Use fixed positioning for better stability
                    scene.style.top = '0';
                    scene.style.left = '0';
                    scene.style.right = '0';
                    scene.style.bottom = '0';
                    scene.style.margin = '0 auto'; // Center horizontally
                    
                    // In portrait mode, make scene slightly taller to prevent bottom cutoff
                    if (isPortrait) {
                        scene.style.height = '105vh';
                    }
                    
                    // Apply specific fixes for narrow viewports
                    if (isNarrow) {
                        scene.style.minWidth = '100vw';
                        scene.style.minHeight = '100vh';
                        scene.style.width = '100vw';
                        scene.style.height = '100vh';
                        scene.style.position = 'fixed';
                        scene.style.left = '0';
                        scene.style.right = '0';
                        scene.style.margin = '0 auto'; // Center horizontally
                    }
                }
                
                // Center camera in portrait mode
                if (isPortrait) {
                    console.log('Applying portrait mode camera centering');
                    const camera = document.querySelector('.a-camera');
                    if (camera) {
                        camera.style.position = 'absolute';
                        camera.style.left = '50%';
                        camera.style.top = '50%';
                        camera.style.transform = 'translate(-50%, -50%)';
                        
                        // Adjust camera position to prevent bottom cutoff
                        const cameraEntity = document.querySelector('[camera]');
                        if (cameraEntity) {
                            // Move camera up slightly to prevent bottom cutoff
                            const currentPosition = cameraEntity.getAttribute('position') || {x: 0, y: 0, z: 0};
                            cameraEntity.setAttribute('position', {
                                x: currentPosition.x,
                                y: currentPosition.y + 0.1, // Move up slightly
                                z: currentPosition.z
                            });
                        }
                    }
                } else {
                    // Center camera in landscape mode too
                    console.log('Applying landscape mode camera centering');
                    const camera = document.querySelector('.a-camera');
                    if (camera) {
                        camera.style.position = 'absolute';
                        camera.style.left = '50%';
                        camera.style.top = '50%';
                        camera.style.transform = 'translate(-50%, -50%)';
                    }
                }
                
                // Fix for narrow viewports - ensure body and html are properly sized
                if (isNarrow) {
                    document.documentElement.style.width = '100vw';
                    document.documentElement.style.height = '100vh';
                    document.documentElement.style.minWidth = '100vw';
                    document.documentElement.style.minHeight = '100vh';
                    document.documentElement.style.overflow = 'hidden';
                    document.documentElement.style.margin = '0'; // Remove any margin
                    document.documentElement.style.padding = '0'; // Remove any padding
                    
                    document.body.style.width = '100vw';
                    document.body.style.height = '100vh';
                    document.body.style.minWidth = '100vw';
                    document.body.style.minHeight = '100vh';
                    document.body.style.overflow = 'hidden';
                    document.body.style.position = 'fixed';
                    document.body.style.top = '0';
                    document.body.style.left = '0';
                    document.body.style.right = '0';
                    document.body.style.bottom = '0';
                    document.body.style.margin = '0'; // Remove any margin
                    document.body.style.padding = '0'; // Remove any padding
                }
            }
        }, 1000);
        
        // Run a second check after a longer delay to ensure fixes are applied
        setTimeout(() => {
            const video = document.querySelector('#arjs-video');
            if (video) {
                console.log('Running secondary camera feed fix check');
                
                // Check if video is visible and playing
                if (video.paused || video.style.display === 'none' || video.offsetWidth === 0) {
                    console.log('Video still not playing properly, applying additional fixes');
                    
                    // Force video to play
                    video.play().catch(err => {
                        console.error('Error playing video on second attempt:', err);
                    });
                    
                    // Ensure video is visible
                    video.style.display = 'block';
                    video.style.visibility = 'visible';
                    video.style.opacity = '1';
                    
                    // Force correct sizing
                    video.style.width = '100vw';
                    video.style.height = '100vh';
                    video.style.minWidth = '100vw';
                    video.style.minHeight = '100vh';
                    video.style.position = 'fixed';
                    video.style.top = '0';
                    video.style.left = '0';
                    video.style.right = '0';
                    video.style.bottom = '0';
                    video.style.margin = '0 auto'; // Center horizontally
                    video.style.objectPosition = '50% 50%'; // Center the video precisely
                }
                
                // Recheck portrait mode camera centering
                const isPortrait = window.innerHeight > window.innerWidth;
                if (isPortrait) {
                    console.log('Reapplying portrait mode camera centering');
                    const camera = document.querySelector('.a-camera');
                    if (camera) {
                        camera.style.position = 'absolute';
                        camera.style.left = '50%';
                        camera.style.top = '50%';
                        camera.style.transform = 'translate(-50%, -50%)';
                    }
                    
                    // Recheck video scaling to prevent bottom cutoff
                    if (video) {
                        video.style.transform = 'scale(1.05)';
                        video.style.webkitTransform = 'scale(1.05)';
                        video.style.transformOrigin = 'center center';
                        video.style.webkitTransformOrigin = 'center center';
                        video.style.left = '0';
                        video.style.right = '0';
                        video.style.margin = '0 auto'; // Center horizontally
                        video.style.objectPosition = '50% 50%'; // Center the video precisely
                    }
                } else {
                    // Center camera in landscape mode too
                    console.log('Reapplying landscape mode camera centering');
                    const camera = document.querySelector('.a-camera');
                    if (camera) {
                        camera.style.position = 'absolute';
                        camera.style.left = '50%';
                        camera.style.top = '50%';
                        camera.style.transform = 'translate(-50%, -50%)';
                    }
                    
                    // Center video in landscape mode
                    if (video) {
                        video.style.left = '0';
                        video.style.right = '0';
                        video.style.margin = '0 auto'; // Center horizontally
                        video.style.objectPosition = '50% 50%'; // Center the video precisely
                    }
                }
                
                // Check if we're on a narrow viewport
                const isNarrow = window.innerWidth < 480;
                if (isNarrow) {
                    // Reapply narrow viewport fixes
                    console.log('Reapplying narrow viewport fixes');
                    
                    // Fix video element
                    if (video) {
                        video.style.minWidth = '100vw';
                        video.style.minHeight = '100vh';
                        video.style.width = '100vw';
                        video.style.height = '100vh';
                        video.style.position = 'fixed';
                        video.style.display = 'block';
                        video.style.visibility = 'visible';
                        video.style.opacity = '1';
                        video.style.left = '0';
                        video.style.right = '0';
                        video.style.margin = '0 auto'; // Center horizontally
                        video.style.objectPosition = '50% 50%'; // Center the video precisely
                        // Remove any transforms that might affect centering
                        video.style.transform = 'none';
                        video.style.webkitTransform = 'none';
                    }
                    
                    // Fix canvas and scene elements
                    const canvas = document.querySelector('canvas.a-canvas');
                    const scene = document.querySelector('a-scene');
                    
                    if (canvas) {
                        canvas.style.minWidth = '100vw';
                        canvas.style.minHeight = '100vh';
                        canvas.style.width = '100vw';
                        canvas.style.height = '100vh';
                        canvas.style.position = 'fixed';
                        canvas.style.left = '0';
                        canvas.style.right = '0';
                        canvas.style.margin = '0 auto'; // Center horizontally
                    }
                    
                    if (scene) {
                        scene.style.minWidth = '100vw';
                        scene.style.minHeight = '100vh';
                        scene.style.width = '100vw';
                        scene.style.height = '100vh';
                        scene.style.position = 'fixed';
                        scene.style.left = '0';
                        scene.style.right = '0';
                        scene.style.margin = '0 auto'; // Center horizontally
                    }
                    
                    // Fix body and html elements
                    document.documentElement.style.width = '100vw';
                    document.documentElement.style.height = '100vh';
                    document.documentElement.style.minWidth = '100vw';
                    document.documentElement.style.minHeight = '100vh';
                    document.documentElement.style.overflow = 'hidden';
                    document.documentElement.style.margin = '0'; // Remove any margin
                    document.documentElement.style.padding = '0'; // Remove any padding
                    
                    document.body.style.width = '100vw';
                    document.body.style.height = '100vh';
                    document.body.style.minWidth = '100vw';
                    document.body.style.minHeight = '100vh';
                    document.body.style.overflow = 'hidden';
                    document.body.style.position = 'fixed';
                    document.body.style.margin = '0'; // Remove any margin
                    document.body.style.padding = '0'; // Remove any padding
                }
            }
        }, 3000);
        
        // Add orientation change handler for camera centering
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                const isPortrait = window.innerHeight > window.innerWidth;
                const video = document.querySelector('#arjs-video');
                
                if (video) {
                    // Always center the video regardless of orientation
                    video.style.position = 'fixed';
                    video.style.width = '100vw';
                    video.style.height = '100vh';
                    video.style.left = '0';
                    video.style.right = '0';
                    video.style.margin = '0 auto'; // Center horizontally
                    video.style.objectPosition = '50% 50%'; // Center the video precisely
                    
                    if (isPortrait) {
                        console.log('Orientation changed to portrait, centering camera');
                        // Scale the video slightly to prevent bottom cutoff
                        video.style.transform = 'scale(1.05)';
                        video.style.webkitTransform = 'scale(1.05)';
                        video.style.transformOrigin = 'center center';
                        video.style.webkitTransformOrigin = 'center center';
                    } else {
                        // Reset scaling for landscape mode
                        video.style.transform = 'none';
                        video.style.webkitTransform = 'none';
                    }
                }
                
                // Center camera regardless of orientation
                const camera = document.querySelector('.a-camera');
                if (camera) {
                    camera.style.position = 'absolute';
                    camera.style.left = '50%';
                    camera.style.top = isPortrait ? '45%' : '50%'; // Move up slightly in portrait mode
                    camera.style.transform = 'translate(-50%, -50%)';
                }
                
                // Adjust canvas and scene elements
                const canvas = document.querySelector('canvas.a-canvas');
                const scene = document.querySelector('a-scene');
                
                if (canvas) {
                    canvas.style.position = 'fixed';
                    canvas.style.width = '100vw';
                    canvas.style.height = isPortrait ? '105vh' : '100vh';
                    canvas.style.left = '0';
                    canvas.style.right = '0';
                    canvas.style.margin = '0 auto'; // Center horizontally
                }
                
                if (scene) {
                    scene.style.position = 'fixed';
                    scene.style.width = '100vw';
                    scene.style.height = isPortrait ? '105vh' : '100vh';
                    scene.style.left = '0';
                    scene.style.right = '0';
                    scene.style.margin = '0 auto'; // Center horizontally
                }
                
                // Check if we're on a narrow viewport
                const isNarrow = window.innerWidth < 480;
                if (isNarrow) {
                    console.log('Orientation changed on narrow viewport, applying fixes');
                    
                    // Fix video element
                    if (video) {
                        video.style.minWidth = '100vw';
                        video.style.minHeight = '100vh';
                        video.style.width = '100vw';
                        video.style.height = '100vh';
                        video.style.position = 'fixed';
                        video.style.display = 'block';
                        video.style.visibility = 'visible';
                        video.style.opacity = '1';
                        video.style.left = '0';
                        video.style.right = '0';
                        video.style.margin = '0 auto'; // Center horizontally
                        video.style.objectPosition = '50% 50%'; // Center the video precisely
                        // Remove any transforms that might affect centering
                        video.style.transform = 'none';
                        video.style.webkitTransform = 'none';
                    }
                    
                    // Fix canvas and scene elements
                    if (canvas) {
                        canvas.style.minWidth = '100vw';
                        canvas.style.minHeight = '100vh';
                        canvas.style.width = '100vw';
                        canvas.style.height = '100vh';
                        canvas.style.position = 'fixed';
                        canvas.style.left = '0';
                        canvas.style.right = '0';
                        canvas.style.margin = '0 auto'; // Center horizontally
                    }
                    
                    if (scene) {
                        scene.style.minWidth = '100vw';
                        scene.style.minHeight = '100vh';
                        scene.style.width = '100vw';
                        scene.style.height = '100vh';
                        scene.style.position = 'fixed';
                        scene.style.left = '0';
                        scene.style.right = '0';
                        scene.style.margin = '0 auto'; // Center horizontally
                    }
                    
                    // Fix body and html elements
                    document.documentElement.style.width = '100vw';
                    document.documentElement.style.height = '100vh';
                    document.documentElement.style.minWidth = '100vw';
                    document.documentElement.style.minHeight = '100vh';
                    document.documentElement.style.overflow = 'hidden';
                    document.documentElement.style.margin = '0'; // Remove any margin
                    document.documentElement.style.padding = '0'; // Remove any padding
                    
                    document.body.style.width = '100vw';
                    document.body.style.height = '100vh';
                    document.body.style.minWidth = '100vw';
                    document.body.style.minHeight = '100vh';
                    document.body.style.overflow = 'hidden';
                    document.body.style.position = 'fixed';
                    document.body.style.margin = '0'; // Remove any margin
                    document.body.style.padding = '0'; // Remove any padding
                }
            }, 500);
        });
        
        // Add resize handler for narrow viewport detection
        window.addEventListener('resize', () => {
            const video = document.querySelector('#arjs-video');
            const isPortrait = window.innerHeight > window.innerWidth;
            const isNarrow = window.innerWidth < 480;
            
            // Always center the video regardless of viewport size
            if (video) {
                video.style.position = 'fixed';
                video.style.width = '100vw';
                video.style.height = '100vh';
                video.style.left = '0';
                video.style.right = '0';
                video.style.margin = '0 auto'; // Center horizontally
                video.style.objectPosition = '50% 50%'; // Center the video precisely
                
                if (isPortrait) {
                    // Scale the video slightly to prevent bottom cutoff
                    video.style.transform = 'scale(1.05)';
                    video.style.webkitTransform = 'scale(1.05)';
                    video.style.transformOrigin = 'center center';
                    video.style.webkitTransformOrigin = 'center center';
                } else {
                    // Reset scaling for landscape mode
                    video.style.transform = 'none';
                    video.style.webkitTransform = 'none';
                }
            }
            
            // Center camera regardless of viewport size
            const camera = document.querySelector('.a-camera');
            if (camera) {
                camera.style.position = 'absolute';
                camera.style.left = '50%';
                camera.style.top = isPortrait ? '45%' : '50%'; // Move up slightly in portrait mode
                camera.style.transform = 'translate(-50%, -50%)';
            }
            
            if (isNarrow) {
                console.log('Detected narrow viewport on resize, applying fixes');
                
                // Fix video element
                if (video) {
                    video.style.minWidth = '100vw';
                    video.style.minHeight = '100vh';
                    video.style.width = '100vw';
                    video.style.height = '100vh';
                    video.style.position = 'fixed';
                    video.style.display = 'block';
                    video.style.visibility = 'visible';
                    video.style.opacity = '1';
                    video.style.left = '0';
                    video.style.right = '0';
                    video.style.margin = '0 auto'; // Center horizontally
                    video.style.objectPosition = '50% 50%'; // Center the video precisely
                    // Remove any transforms that might affect centering in narrow viewports
                    video.style.transform = 'none';
                    video.style.webkitTransform = 'none';
                }
                
                // Fix canvas and scene elements
                const canvas = document.querySelector('canvas.a-canvas');
                const scene = document.querySelector('a-scene');
                
                if (canvas) {
                    canvas.style.minWidth = '100vw';
                    canvas.style.minHeight = '100vh';
                    canvas.style.width = '100vw';
                    canvas.style.height = '100vh';
                    canvas.style.position = 'fixed';
                    canvas.style.left = '0';
                    canvas.style.right = '0';
                    canvas.style.margin = '0 auto'; // Center horizontally
                }
                
                if (scene) {
                    scene.style.minWidth = '100vw';
                    scene.style.minHeight = '100vh';
                    scene.style.width = '100vw';
                    scene.style.height = '100vh';
                    scene.style.position = 'fixed';
                    scene.style.left = '0';
                    scene.style.right = '0';
                    scene.style.margin = '0 auto'; // Center horizontally
                }
                
                // Fix body and html elements
                document.documentElement.style.width = '100vw';
                document.documentElement.style.height = '100vh';
                document.documentElement.style.minWidth = '100vw';
                document.documentElement.style.minHeight = '100vh';
                document.documentElement.style.overflow = 'hidden';
                document.documentElement.style.margin = '0'; // Remove any margin
                document.documentElement.style.padding = '0'; // Remove any padding
                
                document.body.style.width = '100vw';
                document.body.style.height = '100vh';
                document.body.style.minWidth = '100vw';
                document.body.style.minHeight = '100vh';
                document.body.style.overflow = 'hidden';
                document.body.style.position = 'fixed';
                document.body.style.margin = '0'; // Remove any margin
                document.body.style.padding = '0'; // Remove any padding
            }
        });
    }
    
    // Start the application
    initializeApp();
});

// Add a custom marker detection event for AR.js
AFRAME.registerComponent('markerhandler', {
    init: function() {
        console.log('Marker handler component initialized');
        
        // Add debug message to confirm component is attached
        console.log('Marker handler attached to:', this.el.id);
        
        this.el.addEventListener('markerFound', () => {
            console.log('Marker found event triggered');
            document.dispatchEvent(new Event('markerFound'));
        });
        
        this.el.addEventListener('markerLost', () => {
            console.log('Marker lost event triggered');
        });
    }
}); 