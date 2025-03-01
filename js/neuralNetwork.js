/**
 * Neural Network Visualization Module
 * 
 * This module defines a simple neural network structure and handles
 * the inference process for visualization purposes.
 */

class NeuralNetwork {
    constructor() {
        // Define a simple neural network architecture
        this.architecture = {
            inputSize: 6,
            hiddenLayers: [
                { size: 10, activation: 'relu' },
                { size: 14, activation: 'relu' },
                { size: 10, activation: 'relu' },
                { size: 8, activation: 'relu' }
            ],
            outputSize: 4,
            outputActivation: 'softmax'
        };
        
        // Initialize weights and biases with random values
        this.weights = [];
        this.biases = [];
        this.initializeParameters();
        
        // Store activations for visualization
        this.activations = [];
        this.rawOutputs = [];
        
        // Animation properties
        this.animationSpeed = 1.0;
        this.currentSample = null;
        this.inferenceStep = -1;
        this.isAnimating = false;
    }
    
    /**
     * Initialize network parameters with random values
     */
    initializeParameters() {
        // Input to first hidden layer
        let prevSize = this.architecture.inputSize;
        
        // Hidden layers
        for (const layer of this.architecture.hiddenLayers) {
            // Xavier/Glorot initialization for better visualization
            const stddev = Math.sqrt(2 / (prevSize + layer.size));
            
            // Create weights matrix
            const weights = Array(prevSize).fill().map(() => 
                Array(layer.size).fill().map(() => this.randomGaussian(0, stddev))
            );
            this.weights.push(weights);
            
            // Create biases vector
            const biases = Array(layer.size).fill().map(() => this.randomGaussian(0, 0.1));
            this.biases.push(biases);
            
            prevSize = layer.size;
        }
        
        // Last hidden layer to output
        const stddev = Math.sqrt(2 / (prevSize + this.architecture.outputSize));
        const outputWeights = Array(prevSize).fill().map(() => 
            Array(this.architecture.outputSize).fill().map(() => this.randomGaussian(0, stddev))
        );
        this.weights.push(outputWeights);
        
        const outputBiases = Array(this.architecture.outputSize).fill().map(() => this.randomGaussian(0, 0.1));
        this.biases.push(outputBiases);
    }
    
    /**
     * Generate random values from Gaussian distribution
     */
    randomGaussian(mean, stddev) {
        const u1 = 1 - Math.random();
        const u2 = 1 - Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return z * stddev + mean;
    }
    
    /**
     * Apply activation function to a vector
     */
    applyActivation(vector, activation) {
        switch (activation) {
            case 'relu':
                return vector.map(x => Math.max(0, x));
            case 'sigmoid':
                return vector.map(x => 1 / (1 + Math.exp(-x)));
            case 'tanh':
                return vector.map(x => Math.tanh(x));
            case 'softmax':
                const expValues = vector.map(x => Math.exp(x));
                const sumExp = expValues.reduce((a, b) => a + b, 0);
                return expValues.map(x => x / sumExp);
            default:
                return vector;
        }
    }
    
    /**
     * Matrix-vector multiplication
     */
    matrixVectorMultiply(matrix, vector) {
        return matrix.map((row, i) => 
            row.reduce((sum, weight, j) => sum + weight * vector[j], 0)
        );
    }
    
    /**
     * Forward pass through the network
     */
    forwardPass(input) {
        // Reset activations
        this.activations = [input];
        this.rawOutputs = [];
        
        let currentActivation = input;
        
        // Process each layer
        for (let i = 0; i < this.weights.length; i++) {
            // Matrix multiplication: weights * activations
            const weightedSum = Array(this.weights[i][0].length).fill(0);
            
            for (let j = 0; j < currentActivation.length; j++) {
                for (let k = 0; k < this.weights[i][j].length; k++) {
                    weightedSum[k] += this.weights[i][j][k] * currentActivation[j];
                }
            }
            
            // Add biases
            const biasedOutput = weightedSum.map((val, idx) => val + this.biases[i][idx]);
            this.rawOutputs.push(biasedOutput);
            
            // Apply activation function
            const activation = i < this.architecture.hiddenLayers.length 
                ? this.architecture.hiddenLayers[i].activation 
                : this.architecture.outputActivation;
            
            currentActivation = this.applyActivation(biasedOutput, activation);
            this.activations.push(currentActivation);
        }
        
        return this.activations[this.activations.length - 1];
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
        let currentActivation = this.currentSample;
        this.activations = [currentActivation];
        this.rawOutputs = [];
        
        for (let i = 0; i <= this.inferenceStep; i++) {
            // Matrix multiplication: weights * activations
            const weightedSum = Array(this.weights[i][0].length).fill(0);
            
            for (let j = 0; j < currentActivation.length; j++) {
                for (let k = 0; k < this.weights[i][j].length; k++) {
                    weightedSum[k] += this.weights[i][j][k] * currentActivation[j];
                }
            }
            
            // Add biases
            const biasedOutput = weightedSum.map((val, idx) => val + this.biases[i][idx]);
            this.rawOutputs.push(biasedOutput);
            
            // Apply activation function
            const activation = i < this.architecture.hiddenLayers.length 
                ? this.architecture.hiddenLayers[i].activation 
                : this.architecture.outputActivation;
            
            currentActivation = this.applyActivation(biasedOutput, activation);
            this.activations.push(currentActivation);
        }
        
        // Trigger event for visualization update
        const event = new CustomEvent('inferenceStepComplete', {
            detail: {
                step: this.inferenceStep,
                activations: this.activations,
                rawOutputs: this.rawOutputs
            }
        });
        document.dispatchEvent(event);
        
        // Schedule next step
        setTimeout(() => {
            this.animateInferenceStep();
        }, 1500 / this.animationSpeed);
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
        
        this.architecture.hiddenLayers.forEach((layer, index) => {
            layers.push({
                size: layer.size,
                type: 'hidden',
                activation: layer.activation,
                index: index
            });
        });
        
        layers.push({
            size: this.architecture.outputSize,
            type: 'output',
            activation: this.architecture.outputActivation
        });
        
        return layers;
    }
    
    /**
     * Get connection weights between two layers
     */
    getConnectionWeights(fromLayerIndex, toLayerIndex) {
        if (toLayerIndex - fromLayerIndex !== 1 || fromLayerIndex < 0 || toLayerIndex >= this.weights.length + 1) {
            return null;
        }
        
        return this.weights[fromLayerIndex];
    }
}

// Export the neural network class
window.NeuralNetwork = NeuralNetwork; 