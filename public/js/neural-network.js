/**
 * Neural Network
 * Creates and animates a 3D neural network visualization with Three.js
 */

class NeuralNetwork {
    constructor(options = {}) {
        // Configuration
        this.config = {
            layers: options.layers || [4, 6, 5, 4], // Number of neurons per layer
            size: options.size || 0.5, // Overall size (basketball-sized)
            nodeSize: options.nodeSize || 0.03, // Size of neuron nodes
            nodeColor: options.nodeColor || 0x00ffff, // Color of neuron nodes
            connectionColor: options.connectionColor || 0x0088ff, // Color of connections
            activeColor: options.activeColor || 0xffffff, // Color when active
            spacing: options.spacing || 0.15, // Distance between layers
            opacity: options.opacity || 0.7, // Opacity of elements
            pulseSpeed: options.pulseSpeed || 1.5, // Speed of pulse animations
            signalSpeed: options.signalSpeed || 0.8, // Speed of signal animations
        };
        
        // Three.js objects
        this.group = new THREE.Group(); // Main container
        this.nodes = []; // All node meshes
        this.connections = []; // All connection meshes
        this.signals = []; // Signal animations
        
        // Create mesh
        this.createMesh();
        
        // Add update method to userData
        this.group.userData = {
            update: this.update.bind(this),
            mesh: this.group
        };
    }
    
    // Create the neural network mesh
    createMesh() {
        // Create node material (glowing, semi-transparent sphere)
        const nodeMaterial = new THREE.MeshPhongMaterial({
            color: this.config.nodeColor,
            emissive: this.config.nodeColor,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: this.config.opacity,
            shininess: 50
        });
        
        // Create connection material (glowing line)
        const connectionMaterial = new THREE.MeshBasicMaterial({
            color: this.config.connectionColor,
            transparent: true,
            opacity: this.config.opacity * 0.7
        });
        
        // Calculate dimensions
        const totalWidth = (this.config.layers.length - 1) * this.config.spacing;
        const startX = -totalWidth / 2;
        
        // Create all layers and nodes
        let nodeIndex = 0;
        for (let layerIndex = 0; layerIndex < this.config.layers.length; layerIndex++) {
            const layerSize = this.config.layers[layerIndex];
            const layerHeight = (layerSize - 1) * this.config.spacing * 0.5;
            const x = startX + layerIndex * this.config.spacing;
            
            // Create nodes for this layer
            const layerNodes = [];
            for (let nodeInLayer = 0; nodeInLayer < layerSize; nodeInLayer++) {
                const y = -layerHeight / 2 + nodeInLayer * (layerHeight / (layerSize - 1 || 1));
                
                // Create node
                const nodeGeometry = new THREE.SphereGeometry(this.config.nodeSize, 16, 16);
                const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
                nodeMesh.position.set(x, y, 0);
                
                // Add to scene and tracking arrays
                this.group.add(nodeMesh);
                layerNodes.push(nodeMesh);
                this.nodes.push({
                    mesh: nodeMesh,
                    originalColor: this.config.nodeColor,
                    activeColor: this.config.activeColor,
                    pulsePhase: Math.random() * Math.PI * 2, // Random starting phase
                    pulseAmplitude: 0.2 + Math.random() * 0.3, // Variation in pulse intensity
                    active: false,
                    activation: 0
                });
                
                nodeIndex++;
            }
            
            // Connect to previous layer
            if (layerIndex > 0) {
                const prevLayerNodes = this.nodes.slice(nodeIndex - layerSize - this.config.layers[layerIndex - 1], nodeIndex - layerSize);
                
                // Connect each node to all nodes in previous layer
                for (const nodeA of layerNodes) {
                    for (const prevNode of prevLayerNodes) {
                        this.createConnection(prevNode.mesh, nodeA, connectionMaterial.clone());
                    }
                }
            }
        }
        
        // Scale the entire network
        this.group.scale.set(this.config.size, this.config.size, this.config.size);
        
        // Add slight tilt for better visibility
        this.group.rotation.x = 0.1;
    }
    
    // Create connection between two nodes
    createConnection(nodeA, nodeB, material) {
        // Get positions
        const posA = nodeA.position;
        const posB = nodeB.position;
        
        // Create a line geometry
        const points = [];
        points.push(new THREE.Vector3(posA.x, posA.y, posA.z));
        points.push(new THREE.Vector3(posB.x, posB.y, posB.z));
        
        // Create curve geometry for more natural connections
        const curve = new THREE.CatmullRomCurve3(points);
        const curvePoints = curve.getPoints(10);
        const curveGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
        
        // Create tube geometry for thicker connections
        const tubeGeometry = new THREE.TubeGeometry(
            curve,
            8,      // tubularSegments
            0.005,  // radius
            8,      // radialSegments
            false   // closed
        );
        const tubeMesh = new THREE.Mesh(tubeGeometry, material);
        
        // Add connection to scene and tracking array
        this.group.add(tubeMesh);
        this.connections.push({
            mesh: tubeMesh,
            material: material,
            originalColor: this.config.connectionColor,
            activeColor: this.config.activeColor,
            active: false,
            from: nodeA,
            to: nodeB
        });
        
        return tubeMesh;
    }
    
    // Create a signal animation along a connection
    createSignal(connection) {
        const signalGeometry = new THREE.SphereGeometry(0.01, 8, 8);
        const signalMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        
        const signal = new THREE.Mesh(signalGeometry, signalMaterial);
        signal.scale.set(1, 1, 1);
        
        // Add to scene
        this.group.add(signal);
        
        // Track signal
        this.signals.push({
            mesh: signal,
            connection: connection,
            progress: 0,
            speed: 0.5 + Math.random() * 0.5, // Randomize speed a bit
            active: true
        });
        
        return signal;
    }
    
    // Update animations
    update(delta) {
        // Update node pulsing
        this.nodes.forEach(node => {
            if (!node.mesh) return;
            
            // Update pulse phase
            node.pulsePhase += delta * this.config.pulseSpeed;
            if (node.pulsePhase > Math.PI * 2) {
                node.pulsePhase -= Math.PI * 2;
            }
            
            // Calculate glow intensity
            const intensity = 0.5 + Math.sin(node.pulsePhase) * node.pulseAmplitude;
            node.mesh.material.emissiveIntensity = intensity;
            
            // Randomly activate neurons
            if (Math.random() < 0.0005) {
                this.activateNode(node);
            }
        });
        
        // Update signal animations
        for (let i = this.signals.length - 1; i >= 0; i--) {
            const signal = this.signals[i];
            if (!signal.active) continue;
            
            // Update progress
            signal.progress += delta * signal.speed * this.config.signalSpeed;
            
            if (signal.progress >= 1) {
                // Signal reached destination
                this.group.remove(signal.mesh);
                signal.active = false;
                this.signals.splice(i, 1);
                
                // Activate the destination node
                const destNode = this.nodes.find(n => n.mesh === signal.connection.to);
                if (destNode) {
                    this.activateNode(destNode);
                }
            } else {
                // Update position along curve
                const connection = signal.connection;
                const from = connection.from.position;
                const to = connection.to.position;
                
                // Simple linear interpolation for position
                signal.mesh.position.set(
                    from.x + (to.x - from.x) * signal.progress,
                    from.y + (to.y - from.y) * signal.progress,
                    from.z + (to.z - from.z) * signal.progress
                );
            }
        }
        
        // Randomly create new signals
        if (Math.random() < 0.03 && this.connections.length > 0) {
            const randomConnection = this.connections[Math.floor(Math.random() * this.connections.length)];
            this.createSignal(randomConnection);
        }
        
        // Slowly rotate the entire network
        this.group.rotation.y += delta * 0.1;
    }
    
    // Activate a node (flash and initiate signals)
    activateNode(node) {
        if (!node || !node.mesh) return;
        
        // Flash the node
        const originalEmissive = node.mesh.material.emissive.clone();
        node.mesh.material.emissive.setHex(0xffffff);
        
        // Reset after a short delay
        setTimeout(() => {
            if (node.mesh) {
                node.mesh.material.emissive.copy(originalEmissive);
            }
        }, 200);
        
        // Find outgoing connections and create signals
        const outgoingConnections = this.connections.filter(conn => conn.from === node.mesh);
        
        // Randomly select some connections to activate
        const numToActivate = Math.min(outgoingConnections.length, 1 + Math.floor(Math.random() * 2));
        const shuffled = [...outgoingConnections].sort(() => 0.5 - Math.random());
        
        for (let i = 0; i < numToActivate; i++) {
            // Add slight delay for cascading effect
            setTimeout(() => {
                if (this.group && shuffled[i]) {
                    this.createSignal(shuffled[i]);
                }
            }, i * 100);
        }
    }
    
    // Start all animations
    startAnimations() {
        // Activate some initial nodes
        const inputLayerSize = this.config.layers[0];
        const inputNodeIndices = [];
        for (let i = 0; i < inputLayerSize; i++) {
            inputNodeIndices.push(i);
        }
        
        // Shuffle and activate a few random input nodes
        inputNodeIndices.sort(() => 0.5 - Math.random());
        const nodesToActivate = inputNodeIndices.slice(0, Math.ceil(inputLayerSize / 2));
        
        nodesToActivate.forEach((nodeIndex, i) => {
            setTimeout(() => {
                this.activateNode(this.nodes[nodeIndex]);
            }, i * 300);
        });
    }
    
    // Get the mesh for adding to scene
    getMesh() {
        return this.group;
    }
    
    // Clean up resources
    dispose() {
        // Remove signals
        this.signals.forEach(signal => {
            if (signal.mesh) {
                if (signal.mesh.material) signal.mesh.material.dispose();
                if (signal.mesh.geometry) signal.mesh.geometry.dispose();
                this.group.remove(signal.mesh);
            }
        });
        this.signals = [];
        
        // Remove connections
        this.connections.forEach(connection => {
            if (connection.mesh) {
                if (connection.mesh.material) connection.mesh.material.dispose();
                if (connection.mesh.geometry) connection.mesh.geometry.dispose();
                this.group.remove(connection.mesh);
            }
        });
        this.connections = [];
        
        // Remove nodes
        this.nodes.forEach(node => {
            if (node.mesh) {
                if (node.mesh.material) node.mesh.material.dispose();
                if (node.mesh.geometry) node.mesh.geometry.dispose();
                this.group.remove(node.mesh);
            }
        });
        this.nodes = [];
    }
} 