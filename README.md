# Skill Studio

> A lightweight, cross-platform desktop app for building a modern AI skills manager.

Skill Studio is a Tauri-based desktop foundation for managing AI skills with a cleaner architecture, a better UX baseline, and a stronger separation between **installation**, **activation**, **backup**, **sync**, and **diagnostics**.

It is designed as an improved standalone successor to the skills management experience explored from the `cc-switch` project.

## Highlights

- **Lightweight desktop stack** powered by Tauri 2 + Rust
- **Modern frontend** with React 19, TypeScript, Vite, Tailwind CSS v4, and React Query
- **Cross-platform architecture** for macOS / Windows / Linux evolution
- **Modular backend boundaries** for manifest, installer, sync, backup, and diagnostics
- **Polished dashboard scaffold** with Installed / Sources / Backups / Settings starter pages
- **GitHub-ready project structure** for iterating toward a production desktop app

## Screenshot / UI Status

Current repository version includes:

- Desktop shell layout
- Hash-router based navigation
- Feature placeholder pages
- Tauri command examples (`ping`, `get_app_overview`)
- Buildable frontend and Rust scaffold

> This repository is currently a polished scaffold / architecture baseline, not the final fully featured product.

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- React Router
- React Query
- Lucide React

### Desktop / Backend

- Tauri 2
- Rust
- tauri-plugin-log

## Why this project exists

The goal is not just to recreate an existing skills manager, but to build a better one with clearer domain boundaries.

Planned separation includes:

- **Skill Source**: repository / ZIP / local import origin
- **Skill Manifest**: normalized metadata contract
- **Installed Skill**: workspace-owned installed entity
- **Activation / Deployment**: per-app enable / disable state and sync strategy
- **Backup / Restore**: explicit lifecycle support instead of hidden side-effects
- **Diagnostics**: drift detection, broken links, invalid states, and health reporting

## Quick Start

### Prerequisites

Make sure your environment has:

- Node.js
- npm
- Rust toolchain
- Tauri development prerequisites for your OS

### Run locally

```bash
git clone git@github.com:cikichen/skill-studio.git
cd skill-studio
npm install
npm run tauri dev
```

### Build frontend

```bash
npm run build
```

### Build Rust backend

```bash
cd src-tauri
cargo build
```

## Project Structure

```text
src/
  app/                 App router entry
  features/
    skills/            Installed skills experience
    sources/           Sources & discovery management
    backups/           Backup / restore flow
    settings/          Application settings
  shared/
    components/        Layout shell and reusable UI blocks
    lib/               Tauri bridge helpers
    types/             Frontend domain types

src-tauri/src/
  commands/            Tauri invoke command layer
  core/
    manifest/          Manifest parsing contracts
    installer/         Install orchestration skeleton
    sync/              Deployment strategy skeleton
    backup/            Backup lifecycle skeleton
    diagnostics/       Health-check skeleton
  state.rs             Shared application state
  lib.rs               App bootstrap and command registration
```

## Included in this scaffold

- Dark polished dashboard shell
- Installed / Sources / Backups / Settings starter pages
- Hash Router based desktop navigation
- React Query provider setup
- Tauri command bridge examples
- Rust module boundaries ready for real implementation
- Project plan document: [`PROJECT-PLAN.md`](./PROJECT-PLAN.md)

## Roadmap

### Near term

1. Define `skill.json` manifest schema
2. Replace mock page data with real Tauri commands
3. Add workspace discovery and target app detection
4. Implement install / uninstall / enable / disable workflows
5. Implement backup / restore / diagnostics flows

### Later

- ZIP import workflow
- Repository discovery management
- Unmanaged skill scan
- Conflict detection and source resolution
- Better component system in shadcn/ui style
- Packaging, icons, metadata, and release automation

## Development Notes

- Routing currently uses **Hash Router** for desktop friendliness
- Backend currently exposes example commands only
- The current UI is a starter shell intended for rapid iteration
- `PROJECT-PLAN.md` contains the implementation planning baseline

## Repository

- GitHub: https://github.com/cikichen/skill-studio

## License

MIT
