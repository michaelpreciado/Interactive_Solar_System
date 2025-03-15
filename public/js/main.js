/**
 * Neural Network AR Experience
 * Main application controller
 */

document.addEventListener('DOMContentLoaded', () => {
    // Check for Three.js first
    if (typeof THREE === 'undefined') {
        alert('Three.js library not loaded. Please check your internet connection and try again.');
        return;
    }
    
    // Get DOM elements
    const startButton = document.getElementById('start-button');
    const fallbackButton = document.getElementById('fallback-button');
    const backButton = document.getElementById('back-button');
    const fallbackBackButton = document.getElementById('fallback-back-button');
    const permissionButton = document.getElementById('permission-button');
    const startScreen = document.getElementById('start-screen');
    const arOverlay = document.getElementById('ar-overlay');
    const fallbackContainer = document.getElementById('fallback-container');
    const permissionDialog = document.getElementById('permission-dialog');
    const arContainer = document.getElementById('ar-container');
    const surfaceDetectionMessage = document.getElementById('surface-detection-message');
    
    // Device and capability detection
    const deviceInfo = {
        isIOS: /iPhone|iPad|iPod/i.test(navigator.userAgent),
        isIOSSafari: /(iPhone|iPad|iPod).*AppleWebKit(?!.*Chrome)/i.test(navigator.userAgent),
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        hasWebXR: 'xr' in navigator,
        hasWebGL: (function() {
            try {
                return !!window.WebGLRenderingContext && 
                       !!document.createElement('canvas').getContext('webgl');
            } catch(e) {
                return false;
            }
        })(),
        arSupported: false
    };
    
    // Instance variables
    let arManager = null;
    let fallbackView = null;
    let neuralNetwork = null;
    let debugInfo = null;
    
    // Create debug info panel
    function createDebugPanel() {
        debugInfo = document.createElement('div');
        debugInfo.className = 'debug-panel';
        document.body.appendChild(debugInfo);
        return debugInfo;
    }
    
    // Add a log to debug panel
    function debugLog(message, isError = false) {
        if (!debugInfo) {
            debugInfo = createDebugPanel();
        }
        
        const logItem = document.createElement('div');
        logItem.textContent = message;
        if (isError) {
            logItem.style.color = '#ff5252';
        }
        debugInfo.appendChild(logItem);
        
        // Scroll to bottom
        debugInfo.scrollTop = debugInfo.scrollHeight;
        
        // Log to console
        isError ? console.error(message) : console.log(message);
    }
    
    // Check for dependencies
    function checkDependencies() {
        let missingDeps = [];
        
        if (typeof THREE === 'undefined') missingDeps.push('Three.js');
        if (typeof THREE !== 'undefined' && typeof THREE.OrbitControls === 'undefined') {
            debugLog("OrbitControls not available. Fallback mode will use basic controls.", true);
        }
        
        if (missingDeps.length > 0) {
            const message = `Missing dependencies: ${missingDeps.join(', ')}. Some features may not work correctly.`;
            debugLog(message, true);
            return false;
        }
        
        return true;
    }
    
    // Update UI based on device capabilities
    function updateUIForDevice() {
        debugLog(`Device detection: ${JSON.stringify(deviceInfo)}`);
        
        const compatibilityNotice = document.querySelector('.compatibility-notice');
        
        if (deviceInfo.isIOS) {
            if (deviceInfo.isIOSSafari) {
                compatibilityNotice.innerHTML = 
                    'For AR experience, enable WebXR in Safari settings:<br>' +
                    'Settings > Safari > Advanced > Experimental Features > WebXR';
                startButton.disabled = false;
                startButton.classList.remove('disabled');
            } else {
                compatibilityNotice.innerHTML = 
                    'For AR experience, please use Safari browser.<br>' +
                    'The 3D model is available in any browser.';
                startButton.disabled = true;
                startButton.classList.add('disabled');
            }
        } else if (deviceInfo.isMobile) {
            compatibilityNotice.innerHTML = 
                'AR experience is only available on iOS devices.<br>' +
                'A 3D model is available for your device.';
            startButton.disabled = true;
            startButton.classList.add('disabled');
        } else {
            // Desktop device
            compatibilityNotice.innerHTML = 
                'Use mouse to rotate the 3D model. Scroll to zoom.<br>' +
                'For AR experience, visit on an iOS device using Safari.';
            startButton.disabled = true;
            startButton.classList.add('disabled');
        }
        
        // Update button labels based on device
        if (!deviceInfo.isMobile) {
            // Desktop specific labels
            fallbackButton.innerText = 'View 3D Model';
        }
    }
    
    // Check if WebXR is supported
    function checkARSupport() {
        let debugInfo = createDebugPanel();
        
        // Check dependencies first
        if (!checkDependencies()) {
            debugLog("Required libraries missing. Try refreshing the page or check console for details.", true);
        }
        
        // Check for browser details
        const browserInfo = `Browser: ${navigator.userAgent}`;
        debugLog(browserInfo);
        
        // Check if WebGL is supported (required for Three.js)
        if (!deviceInfo.hasWebGL) {
            debugLog("WebGL not supported in this browser. 3D experiences will not work.", true);
            alert("Your browser doesn't support WebGL, which is required for this application. Please try a different browser.");
            return;
        }
        
        // Check if xr object exists in navigator
        if (deviceInfo.hasWebXR) {
            debugLog("WebXR API found in navigator ✓");
            
            // Try to detect AR support
            navigator.xr.isSessionSupported('immersive-ar')
                .then((supported) => {
                    deviceInfo.arSupported = supported;
                    
                    if (supported) {
                        debugLog("AR Session supported ✓");
                        
                        // Hide debug after 5 seconds if successful
                        setTimeout(() => {
                            if (debugInfo) {
                                debugInfo.style.display = 'none';
                            }
                        }, 5000);
                    } else {
                        debugLog("AR Session NOT supported ✗", true);
                        debugLog("Possible causes:", true);
                        debugLog("- Not using Safari browser", true);
                        debugLog("- WebXR not enabled in Safari settings", true);
                        debugLog("- Device not ARKit compatible", true);
                        
                        // Update UI to reflect AR not being available
                        if (deviceInfo.isIOSSafari) {
                            // Show hint for enabling in settings
                            startButton.title = "WebXR needs to be enabled in Safari settings";
                        }
                    }
                    
                    // Update UI based on capabilities
                    updateUIForDevice();
                })
                .catch(error => {
                    debugLog(`AR Session check error: ${error} ✗`, true);
                    updateUIForDevice();
                });
        } else {
            debugLog("WebXR API NOT found in navigator ✗", true);
            if (deviceInfo.isIOS) {
                debugLog("On iOS, make sure you're using Safari with WebXR enabled in settings.", true);
            } else {
                debugLog("WebXR is primarily supported on iOS Safari with ARKit.", true);
            }
            debugLog("The non-AR fallback view is available for all devices with WebGL support.", false);
            
            // Update UI based on capabilities
            updateUIForDevice();
        }
    }
    
    // Initialize AR experience
    function initAR() {
        debugLog("Initializing AR experience...");
        
        // Hide start screen and show AR overlay
        startScreen.classList.add('hidden');
        arOverlay.classList.remove('hidden');
        arContainer.classList.remove('hidden');
        
        // Create AR manager if it doesn't exist
        if (!arManager) {
            try {
                arManager = new ARManager(arContainer);
                
                // Surface detection callback
                arManager.onSurfaceDetected = () => {
                    debugLog("Surface detected ✓");
                    surfaceDetectionMessage.classList.add('hidden');
                    
                    // Create neural network visualization if it doesn't exist
                    if (!neuralNetwork) {
                        neuralNetwork = new NeuralNetwork();
                        arManager.addToScene(neuralNetwork.getMesh());
                        
                        // Start neural network animations
                        neuralNetwork.startAnimations();
                    }
                };
                
                // Error callback
                arManager.onError = (error) => {
                    debugLog(`AR error: ${error}`, true);
                    resetToStartScreen();
                    alert('An error occurred with the AR experience: ' + error);
                };
            } catch (error) {
                debugLog(`Failed to create AR manager: ${error}`, true);
                resetToStartScreen();
                alert('Failed to initialize AR experience: ' + error);
                return;
            }
        }
        
        // Initialize AR
        arManager.initialize()
            .then(() => {
                debugLog("AR initialized successfully ✓");
            })
            .catch(error => {
                debugLog(`Failed to initialize AR: ${error}`, true);
                resetToStartScreen();
                
                if (error.toString().includes("Permission denied")) {
                    alert('Camera permission denied. Please allow camera access to use the AR experience.');
                } else {
                    alert('Failed to initialize AR. Please ensure you are using Safari on an ARKit-compatible iOS device.');
                }
            });
    }
    
    // Initialize fallback 3D view for non-AR devices
    function initFallbackView() {
        debugLog("Initializing fallback 3D view...");
        
        // Hide start screen and show fallback container
        startScreen.classList.add('hidden');
        fallbackContainer.classList.remove('hidden');
        arContainer.classList.remove('hidden');
        
        // Create fallback view if it doesn't exist
        if (!fallbackView) {
            try {
                fallbackView = new FallbackView(arContainer);
            } catch (error) {
                debugLog(`Failed to create fallback view: ${error}`, true);
                resetToStartScreen();
                alert('Failed to initialize 3D view: ' + error);
                return;
            }
        }
        
        // Initialize fallback view
        try {
            fallbackView.initialize();
            debugLog("Fallback view initialized ✓");
            
            // Add instructions for desktop users
            if (!deviceInfo.isMobile) {
                const instructions = document.createElement('div');
                instructions.className = 'info-message desktop-instructions';
                instructions.style.bottom = '20px';
                instructions.style.top = 'auto';
                instructions.innerHTML = '<p>Mouse: Rotate model | Scroll: Zoom</p>';
                fallbackContainer.appendChild(instructions);
            }
        } catch (error) {
            debugLog(`Failed to initialize fallback view: ${error}`, true);
            resetToStartScreen();
            alert('Failed to initialize 3D view: ' + error);
        }
    }
    
    // Request camera permission
    function requestCameraPermission() {
        debugLog("Requesting camera permission...");
        
        // Check if MediaDevices API is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            debugLog("Camera API not available in this browser", true);
            resetToStartScreen();
            alert('Camera access is not supported in this browser. Try using the non-AR view.');
            return;
        }
        
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                // Stop the stream immediately, we just needed permission
                stream.getTracks().forEach(track => track.stop());
                debugLog("Camera permission granted ✓");
                
                // Hide permission dialog
                permissionDialog.classList.add('hidden');
                
                // Initialize AR experience
                initAR();
            })
            .catch(error => {
                debugLog(`Camera permission denied: ${error}`, true);
                resetToStartScreen();
                alert('Camera access is required for this AR experience. Please allow camera access and try again.');
            });
    }
    
    // Reset to start screen
    function resetToStartScreen() {
        debugLog("Resetting to start screen...");
        
        // Hide containers
        arOverlay.classList.add('hidden');
        fallbackContainer.classList.add('hidden');
        arContainer.classList.add('hidden');
        permissionDialog.classList.add('hidden');
        
        // Remove any dynamically added instructions
        const desktopInstructions = document.querySelector('.desktop-instructions');
        if (desktopInstructions) {
            desktopInstructions.remove();
        }
        
        // Show start screen
        startScreen.classList.remove('hidden');
        
        // Stop AR if running
        if (arManager) {
            arManager.stop();
        }
        
        // Stop fallback view if running
        if (fallbackView) {
            fallbackView.stop();
        }
        
        // Reset neural network
        if (neuralNetwork) {
            neuralNetwork.dispose();
            neuralNetwork = null;
        }
    }
    
    // Event listeners
    startButton.addEventListener('click', () => {
        // Don't do anything if button is disabled
        if (startButton.disabled) {
            alert('AR is not supported on this device. Please use the 3D Model view instead.');
            return;
        }
        
        debugLog("Start AR button clicked");
        // Show permission dialog
        permissionDialog.classList.remove('hidden');
    });
    
    fallbackButton.addEventListener('click', () => {
        debugLog("Fallback button clicked");
        initFallbackView();
    });
    
    permissionButton.addEventListener('click', () => {
        debugLog("Permission button clicked");
        requestCameraPermission();
    });
    
    backButton.addEventListener('click', () => {
        debugLog("Back button clicked (AR)");
        resetToStartScreen();
    });
    
    fallbackBackButton.addEventListener('click', () => {
        debugLog("Back button clicked (Fallback)");
        resetToStartScreen();
    });
    
    // Add AR help button
    const helpButton = document.createElement('button');
    helpButton.innerText = 'AR Troubleshooting';
    helpButton.className = 'secondary-button';
    helpButton.style.top = 'auto';
    helpButton.style.bottom = '20px';
    helpButton.style.left = '50%';
    helpButton.style.transform = 'translateX(-50%)';
    startScreen.appendChild(helpButton);
    
    helpButton.addEventListener('click', () => {
        // Show detailed instructions based on device
        let instructions = '';
        
        if (deviceInfo.isIOS) {
            instructions = 
                'AR Troubleshooting for iOS:\n\n' +
                '1. Make sure you\'re using Safari browser\n' +
                '2. Go to Settings > Safari > Advanced > Experimental Features\n' +
                '3. Enable "WebXR Device API" and "WebXR AR Module"\n' +
                '4. Make sure your device supports ARKit (iPhone 6s or newer)\n' +
                '5. Make sure you\'re running iOS 11 or newer\n' +
                '6. Allow camera permissions when prompted\n\n' +
                'If you still have issues, use the "View 3D Model" button.';
        } else {
            instructions = 
                'AR Experience Information:\n\n' +
                'AR is currently only supported on iOS devices with Safari.\n' +
                'On your current device, you can view the interactive 3D model instead.\n\n' +
                'If you have an iOS device:\n' +
                '1. Open this page in Safari on iOS\n' +
                '2. Enable WebXR in Safari settings\n' +
                '3. Try the AR experience there';
        }
        
        alert(instructions);
    });
    
    // Toggle debug panel button
    const toggleDebugButton = document.createElement('button');
    toggleDebugButton.innerText = 'Debug Info';
    toggleDebugButton.className = 'secondary-button';
    toggleDebugButton.style.top = 'auto';
    toggleDebugButton.style.bottom = '70px';
    toggleDebugButton.style.left = '50%';
    toggleDebugButton.style.transform = 'translateX(-50%)';
    startScreen.appendChild(toggleDebugButton);
    
    toggleDebugButton.addEventListener('click', () => {
        if (debugInfo) {
            debugInfo.style.display = debugInfo.style.display === 'none' ? 'block' : 'none';
        } else {
            checkARSupport();
        }
    });
    
    // Automatically suggest appropriate view based on device
    function suggestAppropriateView() {
        // On desktop, automatically focus on the fallback button since AR won't work
        if (!deviceInfo.isMobile) {
            fallbackButton.focus();
            // Add subtle animation to draw attention
            fallbackButton.classList.add('pulse');
            setTimeout(() => fallbackButton.classList.remove('pulse'), 2000);
        }
    }
    
    // Check AR support when the page loads
    checkARSupport();
    
    // Suggest appropriate view after a short delay
    setTimeout(suggestAppropriateView, 1000);
    
    // Handle iOS-specific issues
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            if (arManager) {
                // Page became visible again, restart AR if it was active
                arManager.resume();
            }
        } else if (document.visibilityState === 'hidden') {
            if (arManager) {
                // Page is hidden, pause AR
                arManager.pause();
            }
        }
    });
    
    // Prevent default touch behavior
    document.addEventListener('touchmove', (e) => {
        if (arContainer.classList.contains('hidden') === false) {
            e.preventDefault();
        }
    }, { passive: false });
}); 