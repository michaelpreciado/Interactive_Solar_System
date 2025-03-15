/**
 * AR Manager
 * Handles AR initialization and scene management using WebXR and Three.js
 */

class ARManager {
    constructor(containerElement) {
        this.container = containerElement;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.session = null;
        this.xrReferenceSpace = null;
        this.hitTestSource = null;
        this.hitTestSourceRequested = false;
        this.placementIndicator = null;
        this.surfaceDetected = false;
        this.placementMatrix = new THREE.Matrix4();
        this.raycaster = new THREE.Raycaster();
        
        // Callbacks
        this.onSurfaceDetected = null;
        this.onError = null;
        
        // Bind methods
        this.onXRFrame = this.onXRFrame.bind(this);
        this.onSelect = this.onSelect.bind(this);
        
        // Animation loop
        this.lastTime = 0;
        this.objects = [];
        
        // Initialize Three.js scene
        this.initThreeJS();
    }
    
    // Initialize Three.js environment
    initThreeJS() {
        // Create scene
        this.scene = new THREE.Scene();
        
        // Create camera (will be updated by XR)
        this.camera = new THREE.PerspectiveCamera(
            70, // FOV
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.01, // Near
            20 // Far
        );
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true;
        this.container.appendChild(this.renderer.domElement);
        
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 10, 0);
        this.scene.add(directionalLight);
        
        // Create placement indicator (ring)
        this.createPlacementIndicator();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    // Create placement indicator
    createPlacementIndicator() {
        const ringGeometry = new THREE.RingGeometry(0.15, 0.2, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x007AFF,
            opacity: 0.8,
            transparent: true,
            side: THREE.DoubleSide
        });
        this.placementIndicator = new THREE.Mesh(ringGeometry, ringMaterial);
        this.placementIndicator.rotation.x = -Math.PI / 2; // Flat on surface
        this.placementIndicator.visible = false;
        this.scene.add(this.placementIndicator);
    }
    
    // Initialize AR session
    async initialize() {
        if (!navigator.xr) {
            throw new Error('WebXR not supported');
        }
        
        try {
            // Request AR session
            this.session = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['hit-test', 'dom-overlay'],
                domOverlay: { root: document.getElementById('ui-container') }
            });
            
            // Setup session
            this.session.addEventListener('end', () => {
                this.onSessionEnd();
            });
            
            this.session.addEventListener('select', this.onSelect);
            
            // Initialize render loop
            await this.renderer.xr.setSession(this.session);
            
            // Get reference space
            this.xrReferenceSpace = await this.session.requestReferenceSpace('local');
            
            // Start render loop
            this.renderer.setAnimationLoop(this.onXRFrame);
            
            return true;
        } catch (error) {
            if (this.onError) {
                this.onError(error.message);
            }
            throw error;
        }
    }
    
    // XR frame update
    onXRFrame(time, frame) {
        if (!this.session || !frame) return;
        
        const delta = (time - this.lastTime) / 1000;
        this.lastTime = time;
        
        // Get viewer pose
        const pose = frame.getViewerPose(this.xrReferenceSpace);
        
        if (pose) {
            // Perform hit test
            if (!this.hitTestSourceRequested) {
                this.requestHitTestSource(frame);
            }
            
            if (this.hitTestSource) {
                const hitTestResults = frame.getHitTestResults(this.hitTestSource);
                
                if (hitTestResults.length > 0) {
                    const hit = hitTestResults[0];
                    const hitPose = hit.getPose(this.xrReferenceSpace);
                    
                    // Update placement indicator
                    this.placementIndicator.visible = true;
                    this.placementIndicator.position.set(
                        hitPose.transform.position.x,
                        hitPose.transform.position.y,
                        hitPose.transform.position.z
                    );
                    
                    // Rotate to face the camera
                    const camPosition = new THREE.Vector3().setFromMatrixPosition(pose.transform.matrix);
                    const direction = new THREE.Vector3().subVectors(
                        camPosition,
                        this.placementIndicator.position
                    ).normalize();
                    direction.y = 0; // Keep it flat on the surface
                    
                    if (direction.length() > 0) {
                        this.placementIndicator.lookAt(
                            this.placementIndicator.position.x + direction.x,
                            this.placementIndicator.position.y,
                            this.placementIndicator.position.z + direction.z
                        );
                    }
                    
                    // Store placement matrix
                    this.placementMatrix.fromArray(hitPose.transform.matrix);
                    
                    // Trigger surface detected callback once
                    if (!this.surfaceDetected && this.onSurfaceDetected) {
                        this.surfaceDetected = true;
                        this.onSurfaceDetected();
                    }
                } else {
                    this.placementIndicator.visible = false;
                }
            }
            
            // Update animations for all objects
            this.objects.forEach(obj => {
                if (obj.update) {
                    obj.update(delta);
                }
            });
        }
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
    
    // Request hit test source
    requestHitTestSource(frame) {
        if (!this.session) return;
        
        this.hitTestSourceRequested = true;
        
        const session = this.session;
        
        session.requestReferenceSpace('viewer').then(referenceSpace => {
            session.requestHitTestSource({ space: referenceSpace }).then(source => {
                this.hitTestSource = source;
            }).catch(error => {
                console.error('Failed to request hit test source:', error);
                this.hitTestSourceRequested = false;
            });
        }).catch(error => {
            console.error('Failed to request viewer reference space:', error);
            this.hitTestSourceRequested = false;
        });
    }
    
    // Handle select event (when user taps screen)
    onSelect(event) {
        if (this.surfaceDetected) {
            // Place object at the indicator position
            this.objects.forEach(obj => {
                if (obj.mesh) {
                    obj.mesh.position.copy(this.placementIndicator.position);
                    obj.mesh.quaternion.copy(this.placementIndicator.quaternion);
                    obj.mesh.visible = true;
                }
            });
            
            // Hide the placement indicator after placement
            this.placementIndicator.visible = false;
        }
    }
    
    // Add an object to the scene
    addToScene(mesh) {
        if (!mesh) return;
        
        // Position at placement indicator
        if (this.placementIndicator) {
            mesh.position.copy(this.placementIndicator.position);
            mesh.visible = false; // Hide until placed
        }
        
        this.scene.add(mesh);
        
        // If the object has an update method, add it to the objects array
        if (mesh.userData && typeof mesh.userData.update === 'function') {
            this.objects.push(mesh.userData);
        }
        
        return mesh;
    }
    
    // Stop AR session
    stop() {
        if (this.session) {
            this.session.end();
        }
    }
    
    // Pause AR session
    pause() {
        // Nothing to do here, handled by the browser
    }
    
    // Resume AR session
    resume() {
        // Nothing to do here, handled by the browser
    }
    
    // On session end
    onSessionEnd() {
        this.session = null;
        this.xrReferenceSpace = null;
        this.hitTestSource = null;
        this.hitTestSourceRequested = false;
        this.surfaceDetected = false;
        this.renderer.setAnimationLoop(null);
    }
} 