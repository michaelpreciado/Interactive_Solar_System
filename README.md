# 🌌 Interactive Solar System

A jaw-dropping mobile-first 3D solar system configurator that lets you scrub through time and watch planets glide realistically through space. Built with cutting-edge web technologies for ultra-smooth performance.

![Tech Stack](public/stack.png)

## ✨ Features

### 🎛️ Time Control
- **Glass-morphic Time Scrubber**: Navigate through 20,000 years of time with smooth, 60fps real-time updates
- **Variable Speed Control**: From 0.1x to 1000x speed multiplier with intuitive controls
- **Keyboard Shortcuts**: Spacebar to play/pause, arrow keys to skip years, 'R' to reset

### 🪐 Planetary Simulation
- **Accurate Orbital Mechanics**: Based on simplified VSOP87 theory for realistic planet positions
- **True Axial Tilts**: Each planet rotates with its correct axial tilt and day length
- **Visual Enhancements**: Saturn's rings, Earth's atmosphere, realistic planet colors and sizes

### 📱 Mobile-First Design
- **Touch Gestures**: One-finger rotate, two-finger pan/zoom optimized for mobile
- **Responsive UI**: Adaptive layouts from iPhone 12 Pro to desktop
- **Performance Optimized**: Caps devicePixelRatio at 1.5, uses efficient rendering techniques

### 🎨 Visual Polish
- **GPU Starfield**: 5000 instanced stars with subtle parallax and twinkling effects
- **Soft Shadows**: PCF shadow mapping for realistic lighting
- **Glass Morphism**: Modern UI with backdrop blur and transparency effects
- **Smooth Animations**: Framer Motion for UI transitions, Three.js for 3D

### ♿ Accessibility
- **Reduced Motion**: Respects `prefers-reduced-motion` system setting
- **Keyboard Navigation**: Full keyboard support for all controls
- **ARIA Labels**: Screen reader friendly with proper semantic markup
- **High Contrast**: Supports high contrast mode preferences

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite 5
- **3D Graphics**: Three.js r168 + react-three-fiber + @react-three/drei
- **State Management**: Zustand for global state
- **Styling**: TailwindCSS 4 with custom glass-morphism components
- **Animations**: Framer Motion for UI, Three.js for 3D
- **Performance**: WASM-ready architecture (TypeScript fallback included)
- **Testing**: Vitest + Playwright for unit and E2E tests
- **Code Quality**: ESLint, Prettier, Husky pre-commit hooks

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e
```

## 📁 Project Structure

```
interactive-solar-system/
├── public/
│   ├── stack.png           # Tech stack visualization
│   └── vite.svg           # Favicon
├── src/
│   ├── components/
│   │   ├── SolarSystem.tsx    # Main 3D scene
│   │   ├── Planet.tsx         # Individual planet rendering
│   │   ├── Sun.tsx            # Sun with corona effects
│   │   ├── Orbits.tsx         # Orbital path visualization
│   │   ├── TimeScrubber.tsx   # Time control interface
│   │   ├── PlanetInfo.tsx     # Planet details panel
│   │   ├── ControlPanel.tsx   # UI controls
│   │   ├── LoadingScreen.tsx  # 3D loading animation
│   │   └── ErrorBoundary.tsx  # Error handling
│   ├── stores/
│   │   ├── useTimeStore.ts    # Time and simulation state
│   │   └── useUIStore.ts      # UI preferences and interactions
│   ├── utils/
│   │   └── planetaryCalculations.ts # Orbital mechanics
│   ├── shaders/
│   │   └── starfield.glsl     # GPU starfield shader
│   ├── App.tsx               # Main app component
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 🔧 Configuration

### Performance Settings

The app automatically optimizes for different devices:

- **Device Pixel Ratio**: Capped at 1.5 for performance
- **Render Quality**: Adaptive based on device capabilities
- **Reduced Motion**: Automatically detected and respected
- **Memory Management**: Efficient geometry and texture reuse

### Time System

- **Julian Date**: Uses astronomical Julian Day Number for accurate time calculations
- **Epoch**: J2000.0 (January 1, 2000, 12:00 TT)
- **Range**: ±10,000 years from present
- **Precision**: Daily accuracy for orbital positions

## 🎯 Key Optimizations

### Mobile Performance
- **Frustum Culling**: Planets outside view are not rendered
- **Level of Detail**: Reduced geometry for distant objects
- **Efficient Shaders**: Optimized GPU starfield rendering
- **Memory Management**: Proper cleanup of Three.js resources

### Rendering Pipeline
- **Shadow Mapping**: 2048x2048 PCF soft shadows
- **Instanced Rendering**: For orbital paths and starfield
- **Texture Optimization**: Compressed textures where possible
- **Render Passes**: Efficient multi-pass rendering

## 🧪 Testing

### Unit Tests
```bash
pnpm test
```

### E2E Tests
```bash
pnpm test:e2e
```

### Performance Testing
The app targets:
- **60 FPS** on iPhone 12 Pro
- **<3 MB** gzip bundle size
- **<1s** first paint time

## 🌟 Advanced Features

### Planetary Calculations
The app uses simplified Keplerian orbital elements based on NASA's VSOP87 theory:
- Semi-major axis (a)
- Eccentricity (e)
- Inclination (i)
- Longitude of ascending node (Ω)
- Argument of perihelion (ω)
- Mean anomaly (M)

### WASM Integration (Future)
The TypeScript planetary calculations are designed to be easily replaced with a Rust WASM module for ~10x performance improvement.

## 📱 Mobile Gestures

- **Single Finger**: Rotate view around solar system
- **Two Fingers**: Pan (move) and pinch-zoom
- **Tap Planet**: Select for detailed information
- **Long Press**: Context menu (future feature)

## ⌨️ Keyboard Controls

- **Spacebar**: Play/pause time simulation
- **← / →**: Skip backward/forward by 1 year
- **R**: Reset to current time
- **O**: Toggle orbit visibility
- **L**: Toggle planet labels
- **H**: Toggle help panel

## 🎨 Visual Effects

### Starfield
- **10,000 GPU-generated stars** with realistic distribution
- **Parallax scrolling** as camera moves
- **Twinkling animation** with random timing
- **Distance-based sizing** for depth perception

### Planet Rendering
- **Physically-based materials** with proper lighting
- **Realistic colors** based on actual planetary photography
- **Atmospheric effects** (Earth's blue glow)
- **Planetary features** (Saturn's rings, axial tilts)

## 🔮 Future Enhancements

- **Rust WASM Module**: 10x faster planetary calculations
- **Asteroid Belt**: Procedural asteroid field rendering
- **Moon Systems**: Major moons for gas giants
- **Comet Trajectories**: Halley's comet and others
- **Exoplanet Mode**: Explore confirmed exoplanets
- **VR Support**: WebXR integration for immersive exploration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **NASA JPL**: For planetary ephemeris data
- **Three.js Community**: For the amazing 3D library
- **React Three Fiber**: For the excellent React integration
- **Tailwind CSS**: For the utility-first styling approach

---

**Made with ❤️ by developers who love space and smooth animations**

*"The universe is not only stranger than we imagine, it is stranger than we can imagine."* - J.B.S. Haldane 