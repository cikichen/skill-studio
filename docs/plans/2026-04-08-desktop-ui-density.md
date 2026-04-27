# Desktop UI Density Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Tighten the Tauri desktop UI so the default window behaves like a compact workbench with minimal visible scrolling.

**Architecture:** Keep the existing routing and workbench components, but shift layout control upward into the shell and shared panel primitives. Then rebalance `Overview`, `Sources`, and `Skills` so the window-level scroll disappears while list/detail panes own any remaining overflow.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, React Router, Vite, Tauri

---

### Task 1: Tighten shell height and move overflow control inward

**Files:**
- Modify: `src/shared/components/app-shell.tsx`
- Modify: `src/index.css`
- Test: `npm run build`

**Step 1: Define the failing behavior**

Current failure:
- desktop shell still spends too much height on chrome
- top-level containers can create page-level scrolling
- hidden-scroll behavior is not consistently applied to internal panes

**Step 2: Tighten shell spacing**

Adjust:
- header padding
- topbar radius and internal spacing
- main frame padding and height behavior

**Step 3: Reassign overflow**

Ensure:
- window shell stays fixed-height
- page containers use `min-h-0`
- only inner list/detail panes scroll

**Step 4: Verify**

Run: `npm run build`
Expected: build succeeds

---

### Task 2: Rebalance shared workbench primitives for compact density

**Files:**
- Modify: `src/shared/components/workbench-ui.tsx`
- Modify: `src/index.css`
- Test: `npm run build`

**Step 1: Define the failing behavior**

Current failure:
- hero / panel / card spacing is too generous for a desktop window
- hierarchy is too even, making the UI feel like a polished placeholder

**Step 2: Tighten shared primitives**

Refactor:
- `PageLayout`
- `WorkbenchOverview`
- `PageIntro`
- `Panel`
- `StatCard`

**Step 3: Add hidden-scroll utility usage support**

Keep scrollable sections functional while visually suppressing scrollbars.

**Step 4: Verify**

Run: `npm run build`
Expected: build succeeds

---

### Task 3: Turn Overview into a launchpad instead of a stats page

**Files:**
- Modify: `src/features/overview/page.tsx`
- Test: `npm run build`

**Step 1: Define the failing behavior**

Current failure:
- first screen over-emphasizes summary cards
- next actions are visually diluted
- lower content pushes useful controls downward

**Step 2: Recompose Overview**

Implement:
- shorter hero
- stronger quick-start section
- compact status / environment side rail
- host coverage displayed as compressed summary cards

**Step 3: Keep first screen within desktop window**

Reduce vertical growth and unnecessary copy.

**Step 4: Verify**

Run: `npm run build`
Expected: build succeeds

---

### Task 4: Unify Sources and Skills into compact dual-pane workbenches

**Files:**
- Modify: `src/features/sources/page.tsx`
- Modify: `src/features/skills/page.tsx`
- Modify if needed: `src/shared/components/workbench-ui.tsx`
- Test: `npm run build`

**Step 1: Define the failing behavior**

Current failure:
- dual-pane structure exists but still wastes vertical space
- detail and action regions can drift apart
- list/detail scrolling is not visually restrained

**Step 2: Compact both pages**

Implement:
- shorter hero/header sections
- tighter list toolbar spacing
- fixed-height detail areas
- bottom action dock that remains visible

**Step 3: Hide non-essential scrollbars**

Scrollable list and detail panes should use hidden-scroll presentation by default.

**Step 4: Verify**

Run: `npm run build`
Expected: build succeeds

---

### Task 5: Runtime verification in Tauri

**Files:**
- No source changes required unless verification reveals regressions

**Step 1: Build verification**

Run: `npm run build`
Expected: success

**Step 2: Native runtime verification**

Run: `npx tauri dev`
Expected:
- default window opens
- first screen shows no primary scrollbars
- internal list/detail panes retain usable scrolling

Plan complete and saved to `docs/plans/2026-04-08-desktop-ui-density.md`.
