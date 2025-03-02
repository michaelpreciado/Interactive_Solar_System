/**
 * AR Neural Network Visualization
 * 
 * This module handles the 3D visualization of the neural network
 * in augmented reality using A-Frame and AR.js.
 */

class ARNeuralNetworkVisualizer {
    constructor(neuralNetwork) {
        this.neuralNetwork = neuralNetwork;
        this.networkStructure = neuralNetwork.getNetworkStructure();
        
        // Visualization settings
        this.settings = {
            neuronRadius: 0.04,
            layerDistance: 0.35,         // Increased from 0.2 to make wider horizontally
            neuronVerticalSpacing: 0.25, // Increased for more vertical spacing
            connectionWidth: 0.005,
            activeConnectionWidth: 0.01,
            baseColor: '#4285f4',
            activeColor: '#ff5722',
            inputColor: '#34a853',
            outputColor: '#ea4335',
            hiddenColor: '#4285f4',
            connectionColor: '#9aa0a6',
            activeConnectionColor: '#ff5722',
            neuronOpacity: 0.7,
            connectionOpacity: 0.5,
            scale: 1.3,                 // Slightly reduced from 1.5 to compensate for wider spacing
            hologramEffect: true,
            tensorCubeSize: 2.2,        // Increased from 1.8 to make the cube larger
            tensorCubeColor: '#80c0ff',
            tensorCubeOpacity: 0.15
        };
        
        // References to 3D objects
        this.neurons = [];
        this.connections = [];
        this.dataFlowParticles = [];
        this.tensorCube = null;
        
        // Animation state
        this.currentStep = -1;
        this.isInitialized = false;
        
        // Bind event listeners
        this._onInferenceStepComplete = this._onInferenceStepComplete.bind(this);
        document.addEventListener('inferenceStepComplete', this._onInferenceStepComplete);
    }
    
    /**
     * Initialize the AR visualization
     */
    initialize() {
        if (this.isInitialized) return;
        
        console.log('Initializing AR visualization...');
        
        try {
            // Create a container entity for the neural network
            this.container = document.createElement('a-entity');
            this.container.setAttribute('position', '0 0.6 0'); // Raised position for better visibility (increased from 0.5)
            this.container.setAttribute('scale', `${this.settings.scale} ${this.settings.scale} ${this.settings.scale}`);
            this.container.setAttribute('rotation', '-90 0 0'); // Rotate to face up
            this.container.id = 'neural-network-container';
            
            // Add holographic ambient light if enabled
            if (this.settings.hologramEffect) {
                // Add a light to enhance the holographic effect
                const ambientLight = document.createElement('a-light');
                ambientLight.setAttribute('type', 'ambient');
                ambientLight.setAttribute('color', '#80c0ff');
                ambientLight.setAttribute('intensity', '0.5');
                this.container.appendChild(ambientLight);
                
                // Add a point light for dramatic effect
                const pointLight = document.createElement('a-light');
                pointLight.setAttribute('type', 'point');
                pointLight.setAttribute('color', '#80c0ff');
                pointLight.setAttribute('intensity', '0.7');
                pointLight.setAttribute('position', '0 0.5 0');
                this.container.appendChild(pointLight);
            }
            
            // Create tensor cube container
            this._createTensorCube();
            
            // Add to Hiro marker
            const hiroMarker = document.getElementById('hiroMarker');
            if (hiroMarker) {
                console.log('Found Hiro marker, adding neural network container');
                
                // Make sure the marker is ready before adding content
                if (hiroMarker.object3D && hiroMarker.object3D.visible) {
                    hiroMarker.appendChild(this.container);
                } else {
                    console.log('Marker not visible yet, waiting for visibility');
                    // Wait for marker to be visible before adding content
                    const checkMarkerVisibility = () => {
                        if (hiroMarker.object3D && hiroMarker.object3D.visible) {
                            hiroMarker.appendChild(this.container);
                            console.log('Added neural network to now-visible marker');
                        } else {
                            setTimeout(checkMarkerVisibility, 500);
                        }
                    };
                    setTimeout(checkMarkerVisibility, 500);
                }
            } else {
                console.error('Hiro marker not found in the DOM');
                return;
            }
            
            // Create the neural network visualization
            this._createNeurons();
            this._createConnections();
            
            this.isInitialized = true;
            
            // Start the animation after a short delay
            setTimeout(() => {
                console.log('Starting inference animation');
                if (this.neuralNetwork) {
                    this.neuralNetwork.startInferenceAnimation();
                } else {
                    console.error('Neural network not available for animation');
                }
            }, 2000);
        } catch (error) {
            console.error('Error initializing AR visualization:', error);
        }
    }
    
    /**
     * Create a tensor cube to contain the neural network
     */
    _createTensorCube() {
        try {
            // Create the tensor cube
            this.tensorCube = document.createElement('a-box');
            this.tensorCube.setAttribute('width', this.settings.tensorCubeSize);
            this.tensorCube.setAttribute('height', this.settings.tensorCubeSize);
            this.tensorCube.setAttribute('depth', this.settings.tensorCubeSize);
            this.tensorCube.setAttribute('color', this.settings.tensorCubeColor);
            this.tensorCube.setAttribute('opacity', this.settings.tensorCubeOpacity);
            this.tensorCube.setAttribute('wireframe', true);
            this.tensorCube.setAttribute('position', '0 0 0');
            
            // Rotation animation removed to keep the cube static
            // Set a fixed rotation if desired
            this.tensorCube.setAttribute('rotation', '0 0 0');
            
            this.tensorCube.setAttribute('animation__opacity', {
                property: 'opacity',
                from: this.settings.tensorCubeOpacity,
                to: this.settings.tensorCubeOpacity * 2,
                dur: 5000,
                easing: 'easeInOutSine',
                dir: 'alternate',
                loop: true
            });
            
            // Add the tensor cube to the container
            this.container.appendChild(this.tensorCube);
            
            console.log('Tensor cube created successfully');
        } catch (error) {
            console.error('Error creating tensor cube:', error);
        }
    }
    
    /**
     * Create neurons for each layer of the network
     */
    _createNeurons() {
        try {
            console.log('Creating neurons...');
            
            // Calculate total width of the network
            const totalWidth = (this.networkStructure.length - 1) * this.settings.layerDistance;
            const startX = -totalWidth / 2;
            
            // Create neurons for each layer
            this.networkStructure.forEach((layer, layerIndex) => {
                const layerNeurons = [];
                const x = startX + layerIndex * this.settings.layerDistance;
                
                // Calculate total height of the layer
                const totalHeight = (layer.size - 1) * this.settings.neuronVerticalSpacing;
                const startY = -totalHeight / 2;
                
                // Determine neuron color based on layer type
                let neuronColor;
                switch (layer.type) {
                    case 'input':
                        neuronColor = this.settings.inputColor;
                        break;
                    case 'output':
                        neuronColor = this.settings.outputColor;
                        break;
                    default:
                        neuronColor = this.settings.hiddenColor;
                }
                
                // Create each neuron in the layer
                for (let i = 0; i < layer.size; i++) {
                    const y = startY + i * this.settings.neuronVerticalSpacing;
                    
                    // Create neuron entity
                    const neuron = document.createElement('a-sphere');
                    neuron.setAttribute('position', `${x} ${y} 0`);
                    neuron.setAttribute('radius', this.settings.neuronRadius);
                    neuron.setAttribute('color', neuronColor);
                    neuron.setAttribute('opacity', this.settings.neuronOpacity);
                    neuron.setAttribute('shader', 'standard');
                    neuron.setAttribute('metalness', '0.3');
                    neuron.setAttribute('roughness', '0.2');
                    
                    // Use animation component instead of a-animation
                    neuron.setAttribute('animation__pulse', {
                        property: 'scale',
                        from: '1 1 1',
                        to: '1.1 1.1 1.1',
                        dur: 2000 + i * 300, // Slightly different timing for each neuron
                        dir: 'alternate',
                        loop: true,
                        easing: 'easeInOutSine'
                    });
                    
                    // Add data attributes for identification
                    neuron.dataset.layerIndex = layerIndex;
                    neuron.dataset.neuronIndex = i;
                    
                    // Add to container
                    this.container.appendChild(neuron);
                    layerNeurons.push(neuron);
                    
                    // Add text label for input and output neurons
                    if (layer.type === 'input' || layer.type === 'output') {
                        const text = document.createElement('a-text');
                        const labelText = layer.type === 'input' ? `Input ${i+1}` : `Output ${i+1}`;
                        text.setAttribute('value', labelText);
                        text.setAttribute('position', `${x} ${y + this.settings.neuronRadius * 1.5} 0`);
                        text.setAttribute('align', 'center');
                        text.setAttribute('width', '1.5'); // Reduced from 2 to fit better in the wider layout
                        text.setAttribute('color', neuronColor);
                        this.container.appendChild(text);
                    }
                }
                
                this.neurons.push(layerNeurons);
            });
            
            console.log('Neurons created successfully:', this.neurons.length, 'layers');
        } catch (error) {
            console.error('Error creating neurons:', error);
        }
    }
    
    /**
     * Create connections between neurons
     */
    _createConnections() {
        try {
            console.log('Creating connections...');
            this.connections = [];
            
            // Create connections between each layer
            for (let layerIndex = 0; layerIndex < this.networkStructure.length - 1; layerIndex++) {
                const layerConnections = [];
                const fromLayer = this.neurons[layerIndex];
                const toLayer = this.neurons[layerIndex + 1];
                
                // Get connection weights if available
                const weights = this.neuralNetwork.getConnectionWeights(layerIndex, layerIndex + 1);
                
                // Create connections from each neuron in the current layer to each neuron in the next layer
                fromLayer.forEach((fromNeuron, fromIndex) => {
                    const fromPosition = fromNeuron.getAttribute('position');
                    
                    toLayer.forEach((toNeuron, toIndex) => {
                        const toPosition = toNeuron.getAttribute('position');
                        
                        // Determine connection color and width based on weight
                        let connectionColor = this.settings.connectionColor;
                        let connectionWidth = this.settings.connectionWidth;
                        
                        if (weights && weights[fromIndex] && weights[fromIndex][toIndex] !== undefined) {
                            const weight = weights[fromIndex][toIndex];
                            const absWeight = Math.abs(weight);
                            
                            // Scale width based on weight magnitude
                            connectionWidth = this.settings.connectionWidth * (1 + absWeight);
                            
                            // Color based on weight sign (red for negative, blue for positive)
                            if (weight < 0) {
                                connectionColor = '#ff5722'; // Red for negative
                            } else {
                                connectionColor = '#4285f4'; // Blue for positive
                            }
                        }
                        
                        // Create connection entity
                        const connection = document.createElement('a-entity');
                        connection.setAttribute('line', {
                            start: fromPosition,
                            end: toPosition,
                            color: connectionColor,
                            opacity: this.settings.connectionOpacity,
                            width: connectionWidth
                        });
                        
                        // Add data attributes for identification
                        connection.dataset.fromLayerIndex = layerIndex;
                        connection.dataset.fromNeuronIndex = fromIndex;
                        connection.dataset.toLayerIndex = layerIndex + 1;
                        connection.dataset.toNeuronIndex = toIndex;
                        
                        // Add to container
                        this.container.appendChild(connection);
                        layerConnections.push(connection);
                    });
                });
                
                this.connections.push(layerConnections);
            }
            
            console.log('Connections created successfully:', this.connections.length, 'layers');
        } catch (error) {
            console.error('Error creating connections:', error);
        }
    }
    
    /**
     * Handle inference step completion event
     */
    _onInferenceStepComplete(event) {
        try {
            const { step, activations } = event.detail;
            console.log(`Inference step ${step} complete`);
            
            // Update neuron activations
            this._updateNeuronActivations(activations);
            
            // Animate data flow
            this._animateDataFlow(step);
            
            // Update current step
            this.currentStep = step;
        } catch (error) {
            console.error('Error handling inference step:', error);
        }
    }
    
    /**
     * Update neuron visualizations based on activations
     */
    _updateNeuronActivations(activations) {
        try {
            if (!activations || !this.neurons || this.neurons.length === 0) {
                console.warn('Cannot update neuron activations: missing data');
                return;
            }
            
            // Update each layer
            activations.forEach((layerActivations, layerIndex) => {
                // Skip if we don't have neurons for this layer
                if (!this.neurons[layerIndex]) return;
                
                const layerNeurons = this.neurons[layerIndex];
                
                // Update each neuron in the layer
                layerActivations.forEach((activation, neuronIndex) => {
                    // Skip if we don't have this neuron
                    if (!layerNeurons[neuronIndex]) return;
                    
                    const neuron = layerNeurons[neuronIndex];
                    
                    // Normalize activation to 0-1 range for visualization
                    const normalizedActivation = Math.max(0, Math.min(1, activation));
                    
                    // Update neuron appearance based on activation
                    // Scale size based on activation
                    const scale = 1 + normalizedActivation * 0.5;
                    neuron.setAttribute('scale', `${scale} ${scale} ${scale}`);
                    
                    // Interpolate color based on activation
                    const baseColor = this.settings.baseColor;
                    const activeColor = this.settings.activeColor;
                    const color = this._interpolateColor(baseColor, activeColor, normalizedActivation);
                    neuron.setAttribute('color', color);
                    
                    // Increase opacity based on activation
                    const opacity = this.settings.neuronOpacity + normalizedActivation * (1 - this.settings.neuronOpacity);
                    neuron.setAttribute('opacity', opacity);
                    
                    // Add emissive glow for active neurons
                    neuron.setAttribute('emissive', color);
                    neuron.setAttribute('emissiveIntensity', normalizedActivation * 0.5);
                });
            });
        } catch (error) {
            console.error('Error updating neuron activations:', error);
        }
    }
    
    /**
     * Animate data flow between layers
     */
    _animateDataFlow(step) {
        try {
            // Skip if we're at the input layer (no incoming connections)
            if (step <= 0 || step >= this.networkStructure.length) return;
            
            // Get the connections from the previous layer to this layer
            const fromLayerIndex = step - 1;
            const toLayerIndex = step;
            
            // Skip if we don't have connections for this layer
            if (!this.connections[fromLayerIndex]) return;
            
            // Get activations for the previous layer
            const activations = this.neuralNetwork.activations[fromLayerIndex];
            if (!activations) return;
            
            // Create data flow particles for each connection
            this.connections[fromLayerIndex].forEach(connection => {
                // Get connection endpoints
                const fromLayer = parseInt(connection.dataset.fromLayerIndex);
                const fromNeuron = parseInt(connection.dataset.fromNeuronIndex);
                const toLayer = parseInt(connection.dataset.toLayerIndex);
                const toNeuron = parseInt(connection.dataset.toNeuronIndex);
                
                // Skip if indices are invalid
                if (isNaN(fromLayer) || isNaN(fromNeuron) || isNaN(toLayer) || isNaN(toNeuron)) return;
                
                // Get activation value for the source neuron
                const activation = activations[fromNeuron];
                if (activation === undefined) return;
                
                // Only animate connections with significant activation
                if (activation > 0.1) {
                    this._createDataFlowParticle(connection, activation);
                }
            });
        } catch (error) {
            console.error('Error animating data flow:', error);
        }
    }
    
    /**
     * Create a particle that flows along a connection
     */
    _createDataFlowParticle(connection, activation) {
        try {
            // Skip if activation is too low
            if (activation < 0.1) return;
            
            // Get connection endpoints
            const fromLayer = parseInt(connection.dataset.fromLayerIndex);
            const fromNeuron = parseInt(connection.dataset.fromNeuronIndex);
            const toLayer = parseInt(connection.dataset.toLayerIndex);
            const toNeuron = parseInt(connection.dataset.toNeuronIndex);
            
            // Get positions from neurons
            const fromPos = this.neurons[fromLayer][fromNeuron].getAttribute('position');
            const toPos = this.neurons[toLayer][toNeuron].getAttribute('position');
            
            // Create particle
            const particle = document.createElement('a-sphere');
            
            // Set particle properties based on activation
            const normalizedActivation = Math.max(0, Math.min(1, activation));
            const particleSize = 0.01 + normalizedActivation * 0.02;
            const particleColor = this._interpolateColor(
                this.settings.baseColor,
                this.settings.activeColor,
                normalizedActivation
            );
            
            // Set initial position at the start neuron
            particle.setAttribute('position', fromPos);
            particle.setAttribute('radius', particleSize);
            particle.setAttribute('color', particleColor);
            particle.setAttribute('opacity', 0.7);
            particle.setAttribute('shader', 'standard');
            particle.setAttribute('emissive', particleColor);
            particle.setAttribute('emissiveIntensity', 0.5);
            
            // Add to container
            this.container.appendChild(particle);
            this.dataFlowParticles.push(particle);
            
            // Animate particle along the connection
            particle.setAttribute('animation', {
                property: 'position',
                from: `${fromPos.x} ${fromPos.y} ${fromPos.z}`,
                to: `${toPos.x} ${toPos.y} ${toPos.z}`,
                dur: 1000 - normalizedActivation * 500, // Faster for higher activations
                easing: 'easeInOutSine'
            });
            
            // Remove particle after animation completes
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
                const index = this.dataFlowParticles.indexOf(particle);
                if (index !== -1) {
                    this.dataFlowParticles.splice(index, 1);
                }
            }, 1000);
        } catch (error) {
            console.error('Error creating data flow particle:', error);
        }
    }
    
    /**
     * Interpolate between two colors based on a factor
     */
    _interpolateColor(color1, color2, factor) {
        // Convert hex to RGB
        const hex2rgb = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return [r, g, b];
        };
        
        // Convert RGB to hex
        const rgb2hex = (r, g, b) => {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        };
        
        const c1 = hex2rgb(color1);
        const c2 = hex2rgb(color2);
        
        const r = Math.round(c1[0] + factor * (c2[0] - c1[0]));
        const g = Math.round(c1[1] + factor * (c2[1] - c1[1]));
        const b = Math.round(c1[2] + factor * (c2[2] - c1[2]));
        
        return rgb2hex(r, g, b);
    }
    
    /**
     * Clean up visualization resources
     */
    dispose() {
        try {
            console.log('Disposing AR visualization...');
            
            // Remove event listener
            document.removeEventListener('inferenceStepComplete', this._onInferenceStepComplete);
            
            // Remove all data flow particles
            this.dataFlowParticles.forEach(particle => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            });
            this.dataFlowParticles = [];
            
            // Remove container if it exists
            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }
            
            // Reset state
            this.neurons = [];
            this.connections = [];
            this.isInitialized = false;
            this.currentStep = -1;
            
            console.log('AR visualization disposed');
        } catch (error) {
            console.error('Error disposing AR visualization:', error);
        }
    }
}

// Export the visualizer class
window.ARNeuralNetworkVisualizer = ARNeuralNetworkVisualizer; 