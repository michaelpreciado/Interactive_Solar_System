# Interactive Solar System

Interactive 3D solar system visualization built with React, TypeScript, and Three.js.

## Overview

This project renders a real-time, educational solar system simulation with responsive controls for mobile and desktop. The codebase is optimized for maintainability and production deployment.

## Tech Stack

- React 18 + TypeScript
- Vite 5
- Three.js + React Three Fiber
- Zustand state management
- TailwindCSS
- Vitest + Playwright

## Local Setup

### Prerequisites

- Node.js 20+
- npm 10+

### Install and run

```bash
npm ci
npm run dev
```

### Build and preview

```bash
npm run build
npm run preview
```

## Environment Variables

Copy `.env.example` to `.env.local` for local overrides.

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_APP_ENV` | No | Runtime environment name (`development`, `staging`, `production`). |
| `VITE_MAX_DPR` | No | Optional cap for render DPR tuning. |
| `VITE_DEFAULT_TIME_SPEED` | No | Optional default simulation speed. |

## Quality Gates

```bash
npm run lint
npm run test -- --run
npm run build
```

## Docker

### Production container

```bash
docker build -t interactive-solar-system .
docker run --rm -p 8080:80 interactive-solar-system
```

### Local development with compose

```bash
docker compose up --build
```

## Deployment Notes

- The app is a static SPA served by NGINX in production.
- Routing fallback is handled with `try_files ... /index.html`.
- Basic security headers are configured both in Vite preview/dev and NGINX runtime.

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push and pull requests:

1. Install dependencies with lockfile.
2. Lint TypeScript/React code.
3. Execute unit tests.
4. Perform production build.
