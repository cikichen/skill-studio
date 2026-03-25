# Desktop Console UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert Skill Studio into a desktop-console-style application with a fixed shell, a real Overview page, and focused workbench pages instead of a scroll-heavy dashboard shell.

**Architecture:** Keep the current React Router + AppShell architecture, add `Overview` as the default route, and refactor the shell plus feature pages into a shared dark desktop visual language. Reuse existing hooks and Tauri commands so the UI remains grounded in real product capabilities.

**Tech Stack:** React 19, TypeScript, React Router, React Query, Tailwind CSS v4, Tauri 2

---

### Task 1: Enable desktop-dark shell defaults

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/index.css`

**Steps:**
1. Force the `dark` class on `document.documentElement` during startup.
2. Update global body background and typography to a stable dark desktop foundation.
3. Add scrollbar styling that fits the desktop-console visual direction.
4. Run `npm run build`.

### Task 2: Add Overview route and update navigation

**Files:**
- Modify: `src/app/routes.tsx`
- Create: `src/features/overview/page.tsx`

**Steps:**
1. Add `/overview` route and redirect `/` to `/overview`.
2. Add `Overview` as the first navigation item.
3. Implement `OverviewPage` using real hooks and `getAppOverview()`.
4. Ensure quick actions link into the existing workbench pages.

### Task 3: Refactor the desktop shell

**Files:**
- Modify: `src/shared/components/app-shell.tsx`

**Steps:**
1. Convert the shell to `h-screen` with `overflow-hidden`.
2. Make the sidebar fixed-width and glassmorphism-lite.
3. Make the header fixed and use the current route to show active context.
4. Move page scrolling into the content container only.

### Task 4: Align secondary workbench pages

**Files:**
- Modify: `src/features/sources/page.tsx`
- Modify: `src/features/backups/page.tsx`
- Modify: `src/features/settings/page.tsx`

**Steps:**
1. Rebuild each page around `PageLayout`, `PageIntro`, and `Panel`.
2. Preserve existing real actions and data sources.
3. Remove the remaining marketing-like framing from page headers.
4. Keep interactions dense, readable, and desktop-like.

### Task 5: Verify integration

**Files:**
- No source changes required unless fixes are needed

**Steps:**
1. Run `lsp_diagnostics` on edited files.
2. Run `npm run build`.
3. Fix any type or layout wiring issues.
4. Summarize modified files, key implementation points, and verification output.
