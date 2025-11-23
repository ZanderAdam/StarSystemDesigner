# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Solar System Designer - a visual editor for creating star systems with planets, moons, and asteroid belts. Built with Next.js 16, React 19, TypeScript, and Zustand for state management. Exports JSON for importing into games.

**Project document**: See `galaxymaker-D2` in Engy for full project plan and requirements.

## Commands

```bash
yarn dev          # Start development server
yarn build        # Production build
yarn lint         # Run ESLint
yarn test         # Run tests in watch mode
yarn test:run     # Run tests once
```

## Architecture

### State Management (Zustand stores in `src/stores/`)
- **systemStore**: Solar system data - stars, planets, moons, asteroids
- **spriteStore**: Loaded sprites and sprite list
- **uiStore**: UI state - selected object, camera position, zoom

### Core Types (`src/types/`)
- **celestial.ts**: CelestialBody, Star, Planet, Moon, Station interfaces
- **system.ts**: SolarSystem container type

### Dual Mode Architecture
- **Local mode**: Set `NEXT_PUBLIC_LOCAL_MODE=true`, uses `SPRITE_DIR` and `SYSTEMS_DIR` env vars
- **Production mode**: ZIP bundle load/save via browser File API

### Key Libraries
- **react-konva**: Canvas rendering
- **JSZip**: ZIP bundle handling
- **Zod**: Runtime validation
- **Immer**: Immutable state updates

### Naming System (`src/lib/naming.ts`)
IDs:
- Stars: "Sol", "Sol A", "Sol B"
- Planets: "Sol 1", "Sol 2", "Sol 3"
- Moons: "Sol 3 a", "Sol 3 b"

### API Routes (Local mode only)
- `GET /api/sprites` - List PNG files from SPRITE_DIR
- `GET /api/systems` - List JSON files from SYSTEMS_DIR
- `POST /api/systems` - Save system JSON

## Key Files

- `src/app/page.tsx` - Main designer page layout
- `src/components/Canvas.tsx` - Konva canvas preview
- `src/components/HierarchyTree.tsx` - Tree navigation
- `src/components/PropertyPanel.tsx` - Object property editor
- `src/data/sol-template.ts` - Default Sol system template
