# Solar System Designer

A visual editor for creating star systems with planets, moons, and asteroid belts. Designed for exporting JSON data to game engines.

This was vibe coded, bugs are inevitable.

https://star-system-designer.vercel.app/

## Features

- **Visual Canvas Preview** - Real-time rendering with react-konva, zoom/pan controls, orbital path visualization
- **Hierarchical Tree Interface** - Collapsible tree for managing celestial body relationships
- **Elite Dangerous Naming System** - Automatic ID generation (Sol 1, Sol 3 a, etc.)
- **JSON Export** - Clean data export for game integration
- **Dual Mode Architecture** - Local development mode or production ZIP bundles

### Supported Object Types

- Stars (primary and companion: A, B, C)
- Planets (numbered: 1, 2, 3...)
- Moons (lettered: a, b, c...)
- Asteroid Belts
- Stations

## Tech Stack

- Next.js 16 with App Router
- React 19, TypeScript
- Zustand + Immer for state management
- react-konva for canvas rendering
- Zod for validation
- JSZip for bundle handling
- Tailwind CSS + shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn

### Installation

```bash
git clone <repository-url>
cd galaxymaker
yarn install
```

### Environment Setup

For local development mode, create `.env.local`:

```env
NEXT_PUBLIC_LOCAL_MODE=true
SPRITE_DIR=/path/to/your/sprites
SYSTEMS_DIR=/path/to/your/systems
```

### Development

```bash
yarn dev          # Start development server
yarn build        # Production build
yarn lint         # Run ESLint
yarn test         # Run tests in watch mode
yarn test:run     # Run tests once
```

Open [http://localhost:3000](http://localhost:3000) to view the designer.

## Dual Mode Architecture

### Local Mode (Development)

Set `NEXT_PUBLIC_LOCAL_MODE=true` in `.env.local`:
- Auto-scans PNG files from `SPRITE_DIR`
- Auto-scans JSON files from `SYSTEMS_DIR`
- Saves exports directly as JSON files

### Production Mode

For static hosting (no env vars set):
- Load/save via browser File API
- Uses ZIP bundles containing `system.json` + `sprites/` folder

### ZIP Bundle Format

```
system-name.zip
├── system.json
└── sprites/
    ├── yellow-star.png
    ├── earth.png
    └── luna.png
```

## Architecture

### State Management (`src/stores/`)

- **systemStore** - Solar system data (stars, planets, moons, asteroids)
- **spriteStore** - Loaded sprites and sprite list
- **uiStore** - UI state (selected object, camera position, zoom)

### Core Types (`src/types/`)

- `celestial.ts` - CelestialBody, Star, Planet, Moon, Station interfaces
- `system.ts` - SolarSystem container type

### Key Components

- `Canvas.tsx` - Konva canvas preview
- `HierarchyTree.tsx` - Tree navigation
- `PropertyPanel.tsx` - Object property editor

## Export Format

```json
{
  "formatVersion": "1.0",
  "systemId": "sol",
  "systemName": "Sol",
  "stars": [
    {
      "id": "Sol",
      "name": "Sol",
      "type": "star",
      "sprite": "yellow-star.png",
      "scale": 1.0,
      "rotationSpeed": 0.1
    }
  ],
  "planets": [
    {
      "id": "Sol 3",
      "name": "Earth",
      "type": "planet",
      "sprite": "earth.png",
      "parentStarId": "Sol",
      "orbitDistance": 150,
      "orbitSpeed": 1.0,
      "moons": [
        {
          "id": "Sol 3 a",
          "name": "Luna",
          "type": "moon",
          "sprite": "luna.png",
          "orbitDistance": 25,
          "orbitSpeed": 2.0
        }
      ]
    }
  ],
  "asteroids": []
}
```
