/**
 * Neural Network AR Experience
 * Main application controller
 */

document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const startButton = document.getElementById('start-button');
    const backButton = document.getElementById('back-button');
    const permissionButton = document.getElementById('permission-button');
    const startScreen = document.getElementById('start-screen');
    const arOverlay = document.getElementById('ar-overlay');
    const permissionDialog = document.getElementById('permission-dialog');
    const arContainer = document.getElementById('ar-container');
    const surfaceDetectionMessage = document.getElementById('surface-detection-message');
    
    // Instance variables
    let arManager = null;
    let neuralNetwork = null;
    
    // Check if WebXR is supported
    function checkARSupport() {
        if ('xr' in navigator) {
            navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
                if (!supported) {
                    alert('WebXR AR not supported on this device or browser. Please use an ARKit-compatible iOS device with Safari.');
                }
            });
        } else {
            alert('WebXR not supported on this device or browser. Please use an ARKit-compatible iOS device with Safari.');
        }
    }
    
    // Initialize AR experience
    function initAR() {
        // Hide start screen and show AR overlay
        startScreen.classList.add('hidden');
        arOverlay.classList.remove('hidden');
        arContainer.classList.remove('hidden');
        
        // Create AR manager if it doesn't exist
        if (!arManager) {
            arManager = new ARManager(arContainer);
            
            // Surface detection callback
            arManager.onSurfaceDetected = () => {
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
                console.error('AR error:', error);
                resetToStartScreen();
                alert('An error occurred with the AR experience: ' + error);
            };
        }
        
        // Initialize AR
        arManager.initialize().catch(error => {
            console.error('Failed to initialize AR:', error);
            resetToStartScreen();
            alert('Failed to initialize AR. Please ensure you are using Safari on an ARKit-compatible iOS device.');
        });
    }
    
    // Request camera permission
    function requestCameraPermission() {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                // Stop the stream immediately, we just needed permission
                stream.getTracks().forEach(track => track.stop());
                
                // Hide permission dialog
                permissionDialog.classList.add('hidden');
                
                // Initialize AR experience
                initAR();
            })
            .catch(error => {
                console.error('Camera permission denied:', error);
                alert('Camera access is required for this AR experience. Please allow camera access and try again.');
            });
    }
    
    // Reset to start screen
    function resetToStartScreen() {
        // Hide AR elements
        arOverlay.classList.add('hidden');
        arContainer.classList.add('hidden');
        permissionDialog.classList.add('hidden');
        
        // Show start screen
        startScreen.classList.remove('hidden');
        
        // Stop AR if running
        if (arManager) {
            arManager.stop();
        }
        
        // Reset neural network
        if (neuralNetwork) {
            neuralNetwork.dispose();
            neuralNetwork = null;
        }
    }
    
    // Event listeners
    startButton.addEventListener('click', () => {
        // Show permission dialog
        permissionDialog.classList.remove('hidden');
    });
    
    permissionButton.addEventListener('click', () => {
        requestCameraPermission();
    });
    
    backButton.addEventListener('click', () => {
        resetToStartScreen();
    });
    
    // Check AR support when the page loads
    checkARSupport();
    
    // Handle iOS-specific issues
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && arManager) {
            // Page became visible again, restart AR if it was active
            arManager.resume();
        } else if (document.visibilityState === 'hidden' && arManager) {
            // Page is hidden, pause AR
            arManager.pause();
        }
    });
    
    // Prevent default touch behavior
    document.addEventListener('touchmove', (e) => {
        if (arContainer.classList.contains('hidden') === false) {
            e.preventDefault();
        }
    }, { passive: false });
}); 