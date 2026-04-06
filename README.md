# Interactive Solar System

Interactive 3D solar system built with React, TypeScript, and Three.js. The project focuses on responsive exploration, educational overlays, and a richer learning experience than a simple planet viewer.

## Features

- Real-time 3D solar system visualization
- Educational panels and fact displays
- Time controls and orbital exploration
- Responsive UI for desktop and mobile
- TypeScript-based frontend architecture
- Included test and Docker scaffolding

## Tech Stack

- React
- TypeScript
- Vite
- Three.js
- React Three Fiber / Drei
- Zustand
- Vitest
- Playwright
- Docker

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Local development

```bash
npm install
npm run dev
```

### Production build

```bash
npm run build
```

### Quality checks

```bash
npm run lint
npm run test -- --run
npm run test:e2e
```

## Project Structure

```text
Interactive_Solar_System/
├── public/                  # Static assets
├── src/
│   ├── components/          # UI and 3D scene components
│   ├── shaders/             # Custom shader code
│   ├── stores/              # Zustand stores
│   ├── test/                # Unit tests
│   ├── utils/               # Utilities and calculations
│   └── wasm/                # Experimental/native helpers
├── tests/                   # End-to-end tests
├── Dockerfile
├── docker-compose.yml
└── vite.config.ts
```

## Documentation

Additional project notes live in the repo:

- `PROJECT_ARCHITECTURE.md`
- `EDUCATIONAL_FEATURES.md`
- `COMPLETION_SUMMARY.md`

## Deployment

### Static hosting

```bash
npm run build
```

Deploy the generated `dist/` directory to your preferred static host.

### Docker

```bash
docker build -t interactive-solar-system .
docker run --rm -p 8080:80 interactive-solar-system
```

## License

MIT License
