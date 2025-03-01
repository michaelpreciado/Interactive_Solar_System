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
            layerDistance: 0.2,         // Reduced to make more compact horizontally
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
            scale: 1.5,                 // Increased overall scale
            hologramEffect: true,
            tensorCubeSize: 1.8,        // Size of the tensor cube
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
        
        // Create a container entity for the neural network
        this.container = document.createElement('a-entity');
        this.container.setAttribute('position', '0 0.5 0'); // Raised position for better visibility
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
            hiroMarker.appendChild(this.container);
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
            this.neuralNetwork.startInferenceAnimation();
        }, 2000);
    }
    
    /**
     * Create a tensor cube to contain the neural network
     */
    _createTensorCube() {
        // Create the tensor cube
        this.tensorCube = document.createElement('a-box');
        this.tensorCube.setAttribute('width', this.settings.tensorCubeSize);
        this.tensorCube.setAttribute('height', this.settings.tensorCubeSize);
        this.tensorCube.setAttribute('depth', this.settings.tensorCubeSize);
        this.tensorCube.setAttribute('color', this.settings.tensorCubeColor);
        this.tensorCube.setAttribute('opacity', this.settings.tensorCubeOpacity);
        this.tensorCube.setAttribute('wireframe', true);
        this.tensorCube.setAttribute('wireframe-linewidth', '2');
        this.tensorCube.setAttribute('position', '0 0 0');
        
        // Add slow rotation animation to the tensor cube
        const rotationAnimation = document.createElement('a-animation');
        rotationAnimation.setAttribute('attribute', 'rotation');
        rotationAnimation.setAttribute('from', '0 0 0');
        rotationAnimation.setAttribute('to', '0 360 0');
        rotationAnimation.setAttribute('dur', '30000');
        rotationAnimation.setAttribute('easing', 'linear');
        rotationAnimation.setAttribute('repeat', 'indefinite');
        this.tensorCube.appendChild(rotationAnimation);
        
        // Add pulsing animation to change opacity
        const opacityAnimation = document.createElement('a-animation');
        opacityAnimation.setAttribute('attribute', 'opacity');
        opacityAnimation.setAttribute('from', this.settings.tensorCubeOpacity);
        opacityAnimation.setAttribute('to', this.settings.tensorCubeOpacity * 2);
        opacityAnimation.setAttribute('dur', '5000');
        opacityAnimation.setAttribute('easing', 'ease-in-out');
        opacityAnimation.setAttribute('direction', 'alternate');
        opacityAnimation.setAttribute('repeat', 'indefinite');
        this.tensorCube.appendChild(opacityAnimation);
        
        // Add grid lines to make it look like a tensor
        for (let i = -1; i <= 1; i += 0.5) {
            if (i === 0) continue; // Skip center lines as they're part of the box
            
            // X-axis grid lines
            const xLine = document.createElement('a-entity');
            xLine.setAttribute('line', `start: ${i} ${-this.settings.tensorCubeSize/2} ${-this.settings.tensorCubeSize/2}; end: ${i} ${-this.settings.tensorCubeSize/2} ${this.settings.tensorCubeSize/2}; color: ${this.settings.tensorCubeColor}; opacity: ${this.settings.tensorCubeOpacity * 2}`);
            this.tensorCube.appendChild(xLine);
            
            const xLine2 = document.createElement('a-entity');
            xLine2.setAttribute('line', `start: ${i} ${this.settings.tensorCubeSize/2} ${-this.settings.tensorCubeSize/2}; end: ${i} ${this.settings.tensorCubeSize/2} ${this.settings.tensorCubeSize/2}; color: ${this.settings.tensorCubeColor}; opacity: ${this.settings.tensorCubeOpacity * 2}`);
            this.tensorCube.appendChild(xLine2);
            
            // Y-axis grid lines
            const yLine = document.createElement('a-entity');
            yLine.setAttribute('line', `start: ${-this.settings.tensorCubeSize/2} ${i} ${-this.settings.tensorCubeSize/2}; end: ${this.settings.tensorCubeSize/2} ${i} ${-this.settings.tensorCubeSize/2}; color: ${this.settings.tensorCubeColor}; opacity: ${this.settings.tensorCubeOpacity * 2}`);
            this.tensorCube.appendChild(yLine);
            
            const yLine2 = document.createElement('a-entity');
            yLine2.setAttribute('line', `start: ${-this.settings.tensorCubeSize/2} ${i} ${this.settings.tensorCubeSize/2}; end: ${this.settings.tensorCubeSize/2} ${i} ${this.settings.tensorCubeSize/2}; color: ${this.settings.tensorCubeColor}; opacity: ${this.settings.tensorCubeOpacity * 2}`);
            this.tensorCube.appendChild(yLine2);
            
            // Z-axis grid lines
            const zLine = document.createElement('a-entity');
            zLine.setAttribute('line', `start: ${-this.settings.tensorCubeSize/2} ${-this.settings.tensorCubeSize/2} ${i}; end: ${this.settings.tensorCubeSize/2} ${-this.settings.tensorCubeSize/2} ${i}; color: ${this.settings.tensorCubeColor}; opacity: ${this.settings.tensorCubeOpacity * 2}`);
            this.tensorCube.appendChild(zLine);
            
            const zLine2 = document.createElement('a-entity');
            zLine2.setAttribute('line', `start: ${-this.settings.tensorCubeSize/2} ${this.settings.tensorCubeSize/2} ${i}; end: ${this.settings.tensorCubeSize/2} ${this.settings.tensorCubeSize/2} ${i}; color: ${this.settings.tensorCubeColor}; opacity: ${this.settings.tensorCubeOpacity * 2}`);
            this.tensorCube.appendChild(zLine2);
        }
        
        this.container.appendChild(this.tensorCube);
    }
    
    /**
     * Create neuron spheres for each layer
     */
    _createNeurons() {
        this.neurons = [];
        
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
                neuron.setAttribute('emissive', neuronColor);
                neuron.setAttribute('emissiveIntensity', '0.3');
                
                // Add pulsing animation to neurons
                const pulseAnimation = document.createElement('a-animation');
                pulseAnimation.setAttribute('attribute', 'scale');
                pulseAnimation.setAttribute('from', '1 1 1');
                pulseAnimation.setAttribute('to', '1.1 1.1 1.1');
                pulseAnimation.setAttribute('dur', `${2000 + i * 300}`); // Slightly different timing for each neuron
                pulseAnimation.setAttribute('direction', 'alternate');
                pulseAnimation.setAttribute('repeat', 'indefinite');
                pulseAnimation.setAttribute('easing', 'ease-in-out');
                neuron.appendChild(pulseAnimation);
                
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
                    text.setAttribute('width', '1');
                    text.setAttribute('color', 'white');
                    text.setAttribute('scale', '0.1 0.1 0.1');
                    this.container.appendChild(text);
                }
            }
            
            this.neurons.push(layerNeurons);
        });
        
        console.log(`Created ${this.neurons.flat().length} neurons`);
    }
    
    /**
     * Create connections between neurons
     */
    _createConnections() {
        this.connections = [];
        
        // For each layer (except the last)
        for (let layerIndex = 0; layerIndex < this.networkStructure.length - 1; layerIndex++) {
            const layerConnections = [];
            const fromLayer = this.neurons[layerIndex];
            const toLayer = this.neurons[layerIndex + 1];
            
            // Get connection weights
            const weights = this.neuralNetwork.getConnectionWeights(layerIndex, layerIndex + 1);
            
            // Connect each neuron in the current layer to each neuron in the next layer
            for (let i = 0; i < fromLayer.length; i++) {
                const fromNeuron = fromLayer[i];
                const fromPos = fromNeuron.getAttribute('position');
                
                const neuronConnections = [];
                
                for (let j = 0; j < toLayer.length; j++) {
                    const toNeuron = toLayer[j];
                    const toPos = toNeuron.getAttribute('position');
                    
                    // Calculate connection strength for visualization
                    const weight = weights ? weights[i][j] : 0;
                    const absWeight = Math.abs(weight);
                    const connectionWidth = this.settings.connectionWidth * (0.5 + absWeight);
                    
                    // Determine connection color based on weight
                    let connectionColor;
                    if (weight > 0) {
                        connectionColor = this.settings.connectionColor;
                    } else {
                        // Use a different color for negative weights
                        connectionColor = '#e67c73';
                    }
                    
                    // Create cylinder for connection
                    const connection = document.createElement('a-entity');
                    
                    // Calculate cylinder properties
                    const distance = Math.sqrt(
                        Math.pow(toPos.x - fromPos.x, 2) +
                        Math.pow(toPos.y - fromPos.y, 2) +
                        Math.pow(toPos.z - fromPos.z, 2)
                    );
                    
                    // Position at midpoint
                    const midX = (fromPos.x + toPos.x) / 2;
                    const midY = (fromPos.y + toPos.y) / 2;
                    const midZ = (fromPos.z + toPos.z) / 2;
                    
                    // Calculate rotation to point from one neuron to another
                    const deltaX = toPos.x - fromPos.x;
                    const deltaY = toPos.y - fromPos.y;
                    const deltaZ = toPos.z - fromPos.z;
                    
                    // Set rotation based on direction
                    const rotX = Math.atan2(Math.sqrt(deltaX * deltaX + deltaZ * deltaZ), deltaY) * (180 / Math.PI);
                    const rotY = Math.atan2(deltaZ, deltaX) * (180 / Math.PI);
                    
                    // Create the cylinder
                    connection.setAttribute('geometry', `primitive: cylinder; radius: ${connectionWidth}; height: ${distance}`);
                    connection.setAttribute('material', `color: ${connectionColor}; opacity: ${this.settings.connectionOpacity}; transparent: true`);
                    connection.setAttribute('position', `${midX} ${midY} ${midZ}`);
                    connection.setAttribute('rotation', `${rotX} ${rotY} 90`);
                    
                    // Add data attributes for identification
                    connection.dataset.fromLayer = layerIndex;
                    connection.dataset.fromNeuron = i;
                    connection.dataset.toLayer = layerIndex + 1;
                    connection.dataset.toNeuron = j;
                    connection.dataset.weight = weight;
                    
                    // Add to container
                    this.container.appendChild(connection);
                    neuronConnections.push(connection);
                }
                
                layerConnections.push(neuronConnections);
            }
            
            this.connections.push(layerConnections);
        }
    }
    
    /**
     * Handle inference step completion event
     */
    _onInferenceStepComplete(event) {
        const { step, activations, rawOutputs } = event.detail;
        this.currentStep = step;
        
        // Update neuron activations
        this._updateNeuronActivations(activations);
        
        // Animate data flow
        this._animateDataFlow(step);
    }
    
    /**
     * Update neuron colors based on activations
     */
    _updateNeuronActivations(activations) {
        // Reset all neurons to base color
        this.neurons.forEach((layer, layerIndex) => {
            let neuronColor;
            
            switch (this.networkStructure[layerIndex].type) {
                case 'input':
                    neuronColor = this.settings.inputColor;
                    break;
                case 'output':
                    neuronColor = this.settings.outputColor;
                    break;
                default:
                    neuronColor = this.settings.hiddenColor;
            }
            
            layer.forEach(neuron => {
                neuron.setAttribute('color', neuronColor);
                neuron.setAttribute('opacity', this.settings.neuronOpacity);
                neuron.setAttribute('emissive', neuronColor);
                neuron.setAttribute('emissiveIntensity', '0.3');
            });
        });
        
        // Update neurons up to current step
        for (let i = 0; i <= this.currentStep; i++) {
            if (i >= activations.length) continue;
            
            const layerActivations = activations[i];
            const neurons = this.neurons[i];
            
            if (!neurons || !layerActivations) continue;
            
            // Update each neuron in the layer
            for (let j = 0; j < neurons.length; j++) {
                if (j >= layerActivations.length) continue;
                
                const activation = layerActivations[j];
                const neuron = neurons[j];
                
                // Scale activation to 0-1 range for visualization
                const scaledActivation = Math.max(0, Math.min(1, activation));
                
                // Interpolate between base color and active color
                const color = this._interpolateColor(
                    this.settings.baseColor,
                    this.settings.activeColor,
                    scaledActivation
                );
                
                // Update neuron appearance
                neuron.setAttribute('color', color);
                neuron.setAttribute('opacity', this.settings.neuronOpacity + scaledActivation * 0.3);
                neuron.setAttribute('emissive', color);
                neuron.setAttribute('emissiveIntensity', 0.3 + scaledActivation * 0.7);
                
                // Scale neuron based on activation
                const scale = 1 + scaledActivation * 0.8;
                neuron.setAttribute('scale', `${scale} ${scale} ${scale}`);
                
                // Add a pulse effect for highly activated neurons
                if (scaledActivation > 0.7 && !neuron.querySelector('.activation-pulse')) {
                    const pulseRing = document.createElement('a-ring');
                    pulseRing.classList.add('activation-pulse');
                    pulseRing.setAttribute('radius-inner', this.settings.neuronRadius * 1.2);
                    pulseRing.setAttribute('radius-outer', this.settings.neuronRadius * 1.4);
                    pulseRing.setAttribute('color', this.settings.activeColor);
                    pulseRing.setAttribute('opacity', '0.7');
                    pulseRing.setAttribute('rotation', '90 0 0');
                    
                    // Add expanding and fading animation
                    const expandAnimation = document.createElement('a-animation');
                    expandAnimation.setAttribute('attribute', 'radius-outer');
                    expandAnimation.setAttribute('from', this.settings.neuronRadius * 1.4);
                    expandAnimation.setAttribute('to', this.settings.neuronRadius * 3);
                    expandAnimation.setAttribute('dur', '1000');
                    expandAnimation.setAttribute('easing', 'ease-out');
                    
                    const fadeAnimation = document.createElement('a-animation');
                    fadeAnimation.setAttribute('attribute', 'opacity');
                    fadeAnimation.setAttribute('from', '0.7');
                    fadeAnimation.setAttribute('to', '0');
                    fadeAnimation.setAttribute('dur', '1000');
                    fadeAnimation.setAttribute('easing', 'ease-out');
                    
                    // Remove pulse after animation completes
                    fadeAnimation.addEventListener('animationend', () => {
                        if (pulseRing.parentNode) {
                            pulseRing.parentNode.removeChild(pulseRing);
                        }
                    });
                    
                    pulseRing.appendChild(expandAnimation);
                    pulseRing.appendChild(fadeAnimation);
                    neuron.appendChild(pulseRing);
                }
            }
        }
    }
    
    /**
     * Animate data flowing through connections
     */
    _animateDataFlow(step) {
        if (step < 0 || step >= this.connections.length) return;
        
        // Get connections for current step
        const layerConnections = this.connections[step];
        
        // Reset all connections
        this.connections.forEach(layer => {
            layer.forEach(neuronConnections => {
                neuronConnections.forEach(connection => {
                    const weight = parseFloat(connection.dataset.weight);
                    let connectionColor;
                    
                    if (weight > 0) {
                        connectionColor = this.settings.connectionColor;
                    } else {
                        connectionColor = '#e67c73';
                    }
                    
                    connection.setAttribute('material', `color: ${connectionColor}; opacity: ${this.settings.connectionOpacity}; transparent: true`);
                });
            });
        });
        
        // Highlight active connections
        layerConnections.forEach((neuronConnections, fromIndex) => {
            neuronConnections.forEach((connection, toIndex) => {
                // Get activation from previous layer
                const fromActivation = this.neuralNetwork.activations[step][fromIndex] || 0;
                
                // Scale activation for visualization
                const scaledActivation = Math.max(0, Math.min(1, fromActivation));
                
                // Interpolate color based on activation
                const color = this._interpolateColor(
                    this.settings.connectionColor,
                    this.settings.activeConnectionColor,
                    scaledActivation
                );
                
                // Update connection appearance
                connection.setAttribute('material', `color: ${color}; opacity: ${this.settings.connectionOpacity + scaledActivation * 0.4}; transparent: true`);
                
                // Create data flow particle
                this._createDataFlowParticle(connection, scaledActivation);
            });
        });
    }
    
    /**
     * Create a particle that flows along a connection
     */
    _createDataFlowParticle(connection, activation) {
        if (activation < 0.1) return; // Don't animate weak activations
        
        // Get connection endpoints
        const fromLayer = parseInt(connection.dataset.fromLayer);
        const fromNeuron = parseInt(connection.dataset.fromNeuron);
        const toLayer = parseInt(connection.dataset.toLayer);
        const toNeuron = parseInt(connection.dataset.toNeuron);
        
        const fromPos = this.neurons[fromLayer][fromNeuron].getAttribute('position');
        const toPos = this.neurons[toLayer][toNeuron].getAttribute('position');
        
        // Create particle
        const particle = document.createElement('a-sphere');
        particle.setAttribute('radius', 0.01 + activation * 0.02);
        particle.setAttribute('color', this.settings.activeColor);
        particle.setAttribute('opacity', 0.8);
        particle.setAttribute('position', `${fromPos.x} ${fromPos.y} ${fromPos.z}`);
        
        // Add to container
        this.container.appendChild(particle);
        
        // Animate particle
        const animation = document.createElement('a-animation');
        animation.setAttribute('attribute', 'position');
        animation.setAttribute('from', `${fromPos.x} ${fromPos.y} ${fromPos.z}`);
        animation.setAttribute('to', `${toPos.x} ${toPos.y} ${toPos.z}`);
        animation.setAttribute('dur', 1000);
        animation.setAttribute('easing', 'ease-in-out');
        
        // Remove particle when animation completes
        animation.addEventListener('animationend', () => {
            this.container.removeChild(particle);
        });
        
        particle.appendChild(animation);
        
        // Store reference
        this.dataFlowParticles.push(particle);
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
     * Clean up resources
     */
    dispose() {
        document.removeEventListener('inferenceStepComplete', this._onInferenceStepComplete);
        
        // Remove all elements
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        this.neurons = [];
        this.connections = [];
        this.dataFlowParticles = [];
        this.tensorCube = null;
    }
}

// Export the visualizer class
window.ARNeuralNetworkVisualizer = ARNeuralNetworkVisualizer; 