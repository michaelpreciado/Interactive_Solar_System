# Neural Network AR Visualizer

An augmented reality application that visualizes neural networks in action during inference. This mobile-first web application uses your device's camera to display a live visualization of a neural network processing data.

## Features

- Real-time neural network visualization in AR
- Mobile-first design
- Interactive elements to understand neural network operations
- Animated visualization of data flowing through the network

## Technologies Used

- HTML5, CSS3, JavaScript
- Three.js for 3D rendering
- AR.js for augmented reality capabilities
- TensorFlow.js for neural network implementation

## Setup

1. Clone this repository
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the local development server:
   ```bash
   npm start
   ```
5. Open the application on a mobile device by navigating to your computer's IP address on port 8080 (e.g., http://192.168.1.100:8080)

## Usage

1. Open the application on a mobile device
2. Allow camera permissions when prompted
3. Open the Hiro marker on another device or print it out
   - You can use the included `hiro-marker.html` file
   - Or visit: https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/hiro.png
4. Point your camera at the Hiro marker
5. Watch the neural network visualization appear and animate

## Troubleshooting

If you encounter issues with the AR experience:

1. **Camera Access**: Make sure you've granted camera permissions to the browser
2. **Lighting**: Ensure good lighting conditions for marker detection
3. **Marker Visibility**: Keep the entire Hiro marker visible in the camera view
4. **Browser Compatibility**: Use a modern browser that supports WebGL and WebRTC (Chrome, Safari, Firefox)
5. **Console Errors**: Check the browser console for specific error messages
6. **Restart**: Try refreshing the page or restarting the application

### Common Issues:

- **Stuck on Loading Screen**: If the application is stuck on the loading screen, try:
  - Refreshing the page
  - Using the debug.html page to test if AR.js is working correctly
  - Ensuring you have a stable internet connection
  - Trying a different browser (Safari on iOS often works best)

- **Marker Not Detected**: If the Hiro marker is not being detected:
  - Make sure the marker is well-lit and not reflective
  - Keep the marker flat and fully visible in the camera view
  - Try increasing the size of the marker
  - Use the hiro-marker.html file on another device for optimal results

- **Performance Issues**: If the application is slow or laggy:
  - Close other applications and tabs
  - Ensure your device has sufficient memory
  - Try a device with better specifications if possible

## Development

```bash
# Install dependencies
npm install

# Start local development server
npm start
```

## License

MIT 