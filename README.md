# Interactive Solar System

Interactive, mobile-first 3D solar system simulation built with React, TypeScript, and Three.js.

## Production-Ready README Structure

### 1) Overview

- Real-time planetary visualization with time controls and educational overlays.
- Built for responsive devices with adaptive rendering settings.

### 2) Tech Stack

- React 18 + TypeScript + Vite
- Three.js + @react-three/fiber + @react-three/drei
- Zustand for state management
- Vitest + Playwright for testing

### 3) Prerequisites

- Node.js 20+
- npm 10+
- Docker (optional for containerized runtime)

### 4) Local Setup

```bash
npm ci
cp .env.example .env
npm run dev
```

### 5) Environment Variables

| Variable                  | Required | Default                 | Description                                              |
| ------------------------- | -------- | ----------------------- | -------------------------------------------------------- |
| `VITE_APP_ENV`            | No       | `production`            | Application runtime environment label.                   |
| `VITE_LOG_LEVEL`          | No       | `info` (`debug` in dev) | Structured log level (`debug`, `info`, `warn`, `error`). |
| `VITE_ENABLE_WEBGL_DEBUG` | No       | `false`                 | Enables WebGL diagnostics in supported clients.          |

### 6) Quality Gates

```bash
npm run lint
npm run test -- --run
npm run build
```

### 7) Docker Deployment

```bash
docker build -t interactive-solar-system:latest .
docker run --rm -p 8080:80 interactive-solar-system:latest
```

### 8) Docker Compose (Local Runtime)

```bash
docker compose up --build
```

### 9) CI/CD

- GitHub Actions workflow at `.github/workflows/ci.yml` runs:
  - install (`npm ci`)
  - build (`npm run build`)
  - lint (`npm run lint`)
  - tests (`npm run test -- --run`)

### 10) Security Notes

- Do not commit `.env` files.
- Keep all runtime configuration in environment variables.
- Prefer structured logging and avoid leaking sensitive runtime payloads.
