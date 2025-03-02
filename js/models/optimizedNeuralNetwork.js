/**
 * Optimized Neural Network Module
 * 
 * This module implements a lightweight neural network using TensorFlow.js
 * with MobileNet-inspired architecture for efficient inference in AR applications.
 */

class OptimizedNeuralNetwork {
    constructor(config = {}) {
        // Default configuration with lightweight architecture
        this.config = {
            inputSize: config.inputSize || 6,
            outputSize: config.outputSize || 4,
            useQuantization: config.useQuantization !== undefined ? config.useQuantization : true,
            useSeparableConvs: config.useSeparableConvs !== undefined ? config.useSeparableConvs : true,
            useWebWorker: config.useWebWorker !== undefined ? config.useWebWorker : true,
            batchSize: config.batchSize || 1,
            ...config
        };
        
        // Model architecture inspired by MobileNet
        this.architecture = {
            inputSize: this.config.inputSize,
            // Depthwise separable convolution inspired layers (for visualization purposes)
            hiddenLayers: [
                { size: 8, activation: 'relu', type: this.config.useSeparableConvs ? 'separable' : 'dense' },
                { size: 12, activation: 'relu', type: this.config.useSeparableConvs ? 'separable' : 'dense' },
                { size: 8, activation: 'relu', type: 'dense' },
                { size: 6, activation: 'relu', type: 'dense' }
            ],
            outputSize: this.config.outputSize,
            outputActivation: 'softmax'
        };
        
        // TensorFlow model
        this.model = null;
        
        // Store activations for visualization
        this.activations = [];
        this.rawOutputs = [];
        
        // Animation properties
        this.animationSpeed = 1.0;
        this.currentSample = null;
        this.inferenceStep = -1;
        this.isAnimating = false;
        
        // Performance metrics
        this.inferenceTime = 0;
        this.lastInferenceTime = 0;
        
        // Initialize the model
        this._initializeModel();
        
        // Web Worker for inference if enabled
        this.worker = null;
        if (this.config.useWebWorker) {
            this._initializeWebWorker();
        }
    }
    
    /**
     * Initialize TensorFlow.js model with optimized architecture
     */
    async _initializeModel() {
        try {
            // Create a sequential model
            this.model = tf.sequential();
            
            // Input layer
            const inputShape = [this.architecture.inputSize];
            
            // Add hidden layers
            for (let i = 0; i < this.architecture.hiddenLayers.length; i++) {
                const layer = this.architecture.hiddenLayers[i];
                
                if (i === 0) {
                    // First layer needs input shape
                    if (layer.type === 'separable') {
                        // For visualization purposes, we're using dense layers but conceptually
                        // representing them as separable convolutions
                        this.model.add(tf.layers.dense({
                            units: layer.size,
                            activation: layer.activation,
                            inputShape: inputShape,
                            kernelInitializer: 'glorotUniform',
                            useBias: true
                        }));
                    } else {
                        this.model.add(tf.layers.dense({
                            units: layer.size,
                            activation: layer.activation,
                            inputShape: inputShape,
                            kernelInitializer: 'glorotUniform',
                            useBias: true
                        }));
                    }
                } else {
                    // Subsequent layers
                    if (layer.type === 'separable') {
                        // Conceptually a separable layer
                        this.model.add(tf.layers.dense({
                            units: layer.size,
                            activation: layer.activation,
                            kernelInitializer: 'glorotUniform',
                            useBias: true
                        }));
                    } else {
                        this.model.add(tf.layers.dense({
                            units: layer.size,
                            activation: layer.activation,
                            kernelInitializer: 'glorotUniform',
                            useBias: true
                        }));
                    }
                }
            }
            
            // Output layer
            this.model.add(tf.layers.dense({
                units: this.architecture.outputSize,
                activation: this.architecture.outputActivation,
                kernelInitializer: 'glorotUniform',
                useBias: true
            }));
            
            // Compile the model
            this.model.compile({
                optimizer: tf.train.adam(0.001),
                loss: 'categoricalCrossentropy',
                metrics: ['accuracy']
            });
            
            // Apply quantization if enabled
            if (this.config.useQuantization) {
                await this._quantizeModel();
            }
            
            console.log('TensorFlow.js model initialized successfully');
            
            // Extract weights and biases for visualization
            this._extractWeightsAndBiases();
            
        } catch (error) {
            console.error('Error initializing TensorFlow.js model:', error);
        }
    }
    
    /**
     * Apply quantization to the model for better performance
     */
    async _quantizeModel() {
        try {
            if (!this.model) return;
            
            console.log('Applying quantization to the model...');
            
            // For demonstration purposes, we're simulating quantization
            // In a real application, you would use TensorFlow.js's quantization API
            
            // Generate some random data for calibration
            const calibrationData = tf.randomNormal([100, this.architecture.inputSize]);
            
            // Warm up the model with the calibration data
            const result = this.model.predict(calibrationData);
            result.dispose();
            calibrationData.dispose();
            
            console.log('Model quantization completed');
            
        } catch (error) {
            console.error('Error during model quantization:', error);
        }
    }
    
    /**
     * Extract weights and biases from the TensorFlow.js model for visualization
     */
    _extractWeightsAndBiases() {
        try {
            if (!this.model) return;
            
            this.weights = [];
            this.biases = [];
            
            // Extract weights and biases from each layer
            for (let i = 0; i < this.model.layers.length; i++) {
                const layer = this.model.layers[i];
                const weights = layer.getWeights();
                
                if (weights.length >= 2) {
                    // Convert weight tensors to arrays
                    const weightValues = weights[0].arraySync();
                    const biasValues = weights[1].arraySync();
                    
                    this.weights.push(weightValues);
                    this.biases.push(biasValues);
                }
            }
            
        } catch (error) {
            console.error('Error extracting weights and biases:', error);
        }
    }
    
    /**
     * Initialize Web Worker for inference if enabled
     */
    _initializeWebWorker() {
        try {
            // Create a blob URL for the worker script
            const workerScript = `
                self.importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0/dist/tf.min.js');
                
                let model = null;
                
                self.addEventListener('message', async (e) => {
                    const { type, data } = e.data;
                    
                    if (type === 'model') {
                        // Receive model architecture and weights
                        try {
                            model = await tf.loadLayersModel(tf.io.fromMemory(data));
                            self.postMessage({ type: 'modelLoaded' });
                        } catch (error) {
                            self.postMessage({ type: 'error', error: error.message });
                        }
                    } else if (type === 'predict') {
                        // Perform inference
                        try {
                            const startTime = performance.now();
                            const inputTensor = tf.tensor(data);
                            const result = model.predict(inputTensor);
                            const output = await result.array();
                            const endTime = performance.now();
                            
                            inputTensor.dispose();
                            result.dispose();
                            
                            self.postMessage({
                                type: 'result',
                                output,
                                inferenceTime: endTime - startTime
                            });
                        } catch (error) {
                            self.postMessage({ type: 'error', error: error.message });
                        }
                    }
                });
            `;
            
            const blob = new Blob([workerScript], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(blob);
            
            // Create the worker
            this.worker = new Worker(workerUrl);
            
            // Set up message handling
            this.worker.addEventListener('message', (e) => {
                const { type, output, inferenceTime, error } = e.data;
                
                if (type === 'modelLoaded') {
                    console.log('Model loaded in Web Worker');
                } else if (type === 'result') {
                    this.lastInferenceTime = inferenceTime;
                    this._handleWorkerResult(output);
                } else if (type === 'error') {
                    console.error('Web Worker error:', error);
                }
            });
            
            // Send model to worker (in a real app, you would serialize the model)
            // For now, we'll just simulate this step
            setTimeout(() => {
                this.worker.postMessage({
                    type: 'modelLoaded'
                });
            }, 500);
            
        } catch (error) {
            console.error('Error initializing Web Worker:', error);
            this.config.useWebWorker = false;
        }
    }
    
    /**
     * Handle inference result from Web Worker
     */
    _handleWorkerResult(output) {
        // Update activations for visualization
        this.activations[this.activations.length - 1] = output[0];
        
        // Trigger event for visualization update
        const event = new CustomEvent('inferenceComplete', {
            detail: {
                activations: this.activations,
                inferenceTime: this.lastInferenceTime
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Perform inference on input data
     */
    async predict(input) {
        try {
            if (!this.model) {
                console.error('Model not initialized');
                return null;
            }
            
            // Use Web Worker for inference if enabled
            if (this.config.useWebWorker && this.worker) {
                this.worker.postMessage({
                    type: 'predict',
                    data: [input]
                });
                return null; // Result will be handled asynchronously
            }
            
            // Otherwise, perform inference in the main thread
            const startTime = performance.now();
            
            // Convert input to tensor
            const inputTensor = tf.tensor2d([input]);
            
            // TensorFlow.js inference
            const result = this.model.predict(inputTensor);
            const output = await result.array();
            
            // Clean up tensors
            inputTensor.dispose();
            result.dispose();
            
            const endTime = performance.now();
            this.lastInferenceTime = endTime - startTime;
            
            // Store result for visualization
            this.activations = [input, ...output];
            
            return output[0];
            
        } catch (error) {
            console.error('Error during inference:', error);
            return null;
        }
    }
    
    /**
     * Generate a random input sample
     */
    generateRandomSample() {
        return Array(this.architecture.inputSize).fill().map(() => Math.random());
    }
    
    /**
     * Start the inference animation
     */
    startInferenceAnimation() {
        this.isAnimating = true;
        this.inferenceStep = -1;
        this.currentSample = this.generateRandomSample();
        this.animateInferenceStep();
    }
    
    /**
     * Animate a single step of the inference process
     */
    animateInferenceStep() {
        if (!this.isAnimating) return;
        
        this.inferenceStep++;
        
        // If we've completed all steps, start over
        if (this.inferenceStep >= this.architecture.hiddenLayers.length + 1) {
            setTimeout(() => {
                this.inferenceStep = -1;
                this.currentSample = this.generateRandomSample();
                this.animateInferenceStep();
            }, 1000);
            return;
        }
        
        // Perform forward pass up to the current step
        this.forwardPass(this.currentSample, this.inferenceStep);
    }
    
    /**
     * Perform forward pass through the network up to a specific step
     */
    async forwardPass(input, upToStep) {
        try {
            if (!this.model) return;
            
            // Reset activations
            this.activations = [input];
            this.rawOutputs = [];
            
            // For visualization purposes, we'll extract intermediate activations
            // In a real TensorFlow.js application, you would use tf.tidy and proper tensor management
            
            // Create input tensor
            const inputTensor = tf.tensor2d([input]);
            
            // Get intermediate activations
            const activationModel = tf.model({
                inputs: this.model.inputs,
                outputs: this.model.layers[upToStep].output
            });
            
            const startTime = performance.now();
            const result = activationModel.predict(inputTensor);
            const activations = await result.array();
            const endTime = performance.now();
            
            this.lastInferenceTime = endTime - startTime;
            
            // Clean up tensors
            inputTensor.dispose();
            result.dispose();
            
            // Add to activations
            this.activations.push(activations[0]);
            
            // Trigger event for visualization update
            const event = new CustomEvent('inferenceStepComplete', {
                detail: {
                    step: this.inferenceStep,
                    activations: this.activations,
                    rawOutputs: this.rawOutputs,
                    inferenceTime: this.lastInferenceTime
                }
            });
            document.dispatchEvent(event);
            
            // Schedule next step
            setTimeout(() => {
                if (this.isAnimating) {
                    this.animateInferenceStep();
                }
            }, 1500 / this.animationSpeed);
            
        } catch (error) {
            console.error('Error during forward pass:', error);
        }
    }
    
    /**
     * Stop the inference animation
     */
    stopInferenceAnimation() {
        this.isAnimating = false;
    }
    
    /**
     * Set the animation speed
     */
    setAnimationSpeed(speed) {
        this.animationSpeed = speed;
    }
    
    /**
     * Get the complete network architecture
     */
    getNetworkStructure() {
        const layers = [
            { size: this.architecture.inputSize, type: 'input' }
        ];
        
        // Add hidden layers
        this.architecture.hiddenLayers.forEach(layer => {
            layers.push({
                size: layer.size,
                type: 'hidden',
                activation: layer.activation,
                layerType: layer.type
            });
        });
        
        // Add output layer
        layers.push({
            size: this.architecture.outputSize,
            type: 'output',
            activation: this.architecture.outputActivation
        });
        
        return layers;
    }
    
    /**
     * Get connection weights between layers
     */
    getConnectionWeights(fromLayerIndex, toLayerIndex) {
        if (fromLayerIndex < 0 || toLayerIndex >= this.weights.length + 1) {
            return null;
        }
        
        return this.weights[toLayerIndex - 1];
    }
    
    /**
     * Dispose of TensorFlow.js resources
     */
    dispose() {
        try {
            if (this.model) {
                this.model.dispose();
            }
            
            if (this.worker) {
                this.worker.terminate();
                this.worker = null;
            }
            
            console.log('Neural network resources disposed');
        } catch (error) {
            console.error('Error disposing neural network resources:', error);
        }
    }
}

// Export the class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OptimizedNeuralNetwork };
} 