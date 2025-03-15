# Interactive Neural Network AR Experience

A web-based augmented reality visualization of a neural network optimized for iPhone devices. This project uses Three.js for 3D rendering and integrates with Apple ARKit through WebXR APIs.

## Overview

This application allows users to experience a holographic visualization of a neural network in augmented reality. The neural network appears as a 3D object that can be placed on real-world surfaces, with animated nodes and connections simulating neural activity.

## Features

- **Minimalist UI**: Clean, iOS-style interface with ample white space and intuitive controls
- **AR Integration**: Uses WebXR API with ARKit compatibility for high-performance AR
- **Surface Detection**: Automatically detects flat surfaces for neural network placement
- **Holographic Visualization**: Semi-transparent, glowing nodes and connections
- **Dynamic Animations**: 
  - Pulsating nodes with glowing effects
  - Signal propagation animations between connected nodes
  - Gentle rotation for enhanced 3D effect
- **Basketball-sized Network**: Scaled to approximately the size of a basketball for easy viewing

## Technical Implementation

- **Frontend**: HTML5, CSS3, JavaScript
- **3D Rendering**: Three.js
- **AR Support**: WebXR API with Apple ARKit integration
- **Performance Optimizations**: 
  - Efficient rendering techniques for mobile devices
  - Minimal UI to maximize performance

## Requirements

- iPhone with ARKit support (iPhone 6s or newer)
- iOS 11 or later
- Safari browser

## Usage

1. Open the application URL in Safari on an ARKit-compatible iPhone
2. Tap "Start Experience" and grant camera access
3. Move your device to detect a flat surface
4. Once a surface is detected, the neural network will automatically appear
5. Observe the neural network animation and dynamic signal flows

## Structure

- `index.html` - Main entry point
- `public/css/styles.css` - Styling for the UI
- `public/js/main.js` - Main application controller
- `public/js/ar-manager.js` - AR initialization and handling
- `public/js/neural-network.js` - Neural network visualization and animation

## Development

To run the project locally:

1. Clone the repository
2. Set up a local server (due to security constraints, AR must be accessed via HTTPS or localhost)
3. Access the application through an iPhone's Safari browser

## Limitations

- WebXR AR support is limited to Safari on iOS devices
- Performance may vary based on device capabilities
- Lighting conditions can affect surface detection quality

## License

MIT 