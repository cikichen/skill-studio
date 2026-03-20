# Skill Studio

A lightweight cross-platform desktop app skeleton for building a modern AI skills manager.

## Tech Stack

- Tauri 2
- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- React Query
- Rust backend modules for manifest / install / sync / backup / diagnostics

## Quick Start

```bash
cd skill-studio
npm install
npm run tauri dev
```

## Project Structure

```text
src/
  app/                 Router entry
  features/
    skills/            Installed skills experience
    sources/           Sources & discovery management
    backups/           Backup / restore flow
    settings/          Application settings
  shared/
    components/        Layout and reusable UI blocks
    lib/               Tauri bridge helpers
    types/             Frontend domain types

src-tauri/src/
  commands/            Tauri invoke commands
  core/
    manifest/          Skill manifest parsing contracts
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
- Hash-router based desktop navigation
- React Query provider setup
- Tauri command examples (`ping`, `get_app_overview`)
- Rust domain modules ready for real implementation

## Suggested next steps

1. Define your `skill.json` manifest schema.
2. Replace demo page data with real Tauri commands.
3. Add SQLite persistence and app path discovery.
4. Implement install / enable / disable / restore workflows.
5. Replace default icons and product metadata for release builds.
