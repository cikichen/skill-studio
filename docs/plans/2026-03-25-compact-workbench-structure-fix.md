# Compact Workbench Structure Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Tighten Skill Studio’s shell and first-screen structure so the app feels like a coherent desktop workbench before performance work begins.

**Architecture:** Keep the current top-navbar routing model and real product pages, but refactor the shell into a compact toolbar-style header with one language control and a real theme switcher. Then compress `PageIntro`, rebalance `Panel` hierarchy, and reorganize the `Skills` first screen so installed skills become the primary work surface instead of a document-like composition.

**Tech Stack:** React 19, TypeScript, React Router, Tailwind CSS v4, Vite, Tauri

---

### Task 1: Add a real theme system and remove forced dark mode

**Files:**
- Create: `src/shared/lib/theme.tsx`
- Modify: `src/main.tsx`
- Modify: `src/shared/components/app-shell.tsx`
- Test: build verification via `npm run build`

**Step 1: Define the failing behavior**

Current failure:
- `src/main.tsx` forces `document.documentElement.classList.add("dark")`
- there is no real theme switcher in the UI
- users cannot choose `light / dark / system`

**Step 2: Implement theme state provider**

Create `src/shared/lib/theme.tsx` with:
- `Theme = "light" | "dark" | "system"`
- provider + hook
- persistence via localStorage
- system preference fallback using `window.matchMedia("(prefers-color-scheme: dark)")`
- logic that updates `document.documentElement.classList`

**Step 3: Remove hardcoded dark mode from app bootstrap**

Modify `src/main.tsx`:
- remove forced `classList.add("dark")`
- wrap app with `ThemeProvider`

**Step 4: Add a theme action in the shell**

Modify `src/shared/components/app-shell.tsx`:
- add one compact theme toggle action in the right-side header controls
- theme control must fit the same visual language as the remaining language control

**Step 5: Verify build**

Run: `npm run build`
Expected: build succeeds, no theme/provider/type errors

---

### Task 2: Compact the header and remove duplicate language controls

**Files:**
- Modify: `src/shared/components/app-shell.tsx`
- Reference: `src/shared/lib/i18n.tsx`
- Test: build verification via `npm run build`

**Step 1: Define the failing shell behavior**

Current failure:
- header is too tall and padded
- right side includes two language controls for the same action
- toolbar does not feel like a desktop app header

**Step 2: Rebuild the header action area**

Implement all of the following:
- keep only one language control
- keep only one theme control
- remove the duplicate `EN / 中文` or icon variant (choose one final version, not both)
- normalize action button sizing, border treatment, and spacing

**Step 3: Tighten header rhythm**

Adjust shell spacing so header becomes a compact toolbar:
- reduce redundant top padding
- preserve sticky behavior
- keep navbar/container width and route behavior intact
- ensure left logo, center nav, and right actions balance visually

**Step 4: Verify build**

Run: `npm run build`
Expected: build succeeds, no shell/type errors

---

### Task 3: Compress `PageIntro` and shared workbench spacing

**Files:**
- Modify: `src/shared/components/workbench-ui.tsx`
- Modify if needed: `src/features/overview/page.tsx`
- Modify if needed: `src/features/sources/page.tsx`
- Modify if needed: `src/features/backups/page.tsx`
- Modify if needed: `src/features/settings/page.tsx`
- Test: build verification via `npm run build`

**Step 1: Define the current layout problem**

Current failure:
- `PageIntro` still reads like a document/marketing header
- first-screen density is too low
- page heading, actions, and stat cards consume too much vertical space

**Step 2: Refactor shared heading rhythm**

In `src/shared/components/workbench-ui.tsx`, tighten:
- `PageLayout`
- `PageIntro`
- `Panel`

Focus on:
- shorter vertical gaps
- tighter description treatment
- actions closer to title
- stat cards reading as summary, not second-level hero cards

**Step 3: Adapt pages to new shared rhythm**

Review and lightly adjust:
- `Overview`
- `Sources`
- `Backups`
- `Settings`

Only change page-level spacing where the compact shared shell requires it.

**Step 4: Verify build**

Run: `npm run build`
Expected: build succeeds, all pages compile cleanly

---

### Task 4: Reorganize the `Skills` first screen into a real workbench

**Files:**
- Modify: `src/features/skills/page.tsx`
- Modify if needed: `src/shared/components/workbench-ui.tsx`
- Test: build verification via `npm run build`

**Step 1: Define the current first-screen failure**

Current failure:
- `Skills` first screen still feels like a document header + segmented white boxes
- search/filter area, installed list, and right-side utilities do not read as one work surface
- first-screen hierarchy is still too soft

**Step 2: Rebalance first-screen composition**

Reorganize the screen so this order is visually obvious:
1. compact `PageIntro`
2. search/filter control row
3. installed skills list as main surface
4. install target / zip / discovery as secondary workbench column

**Step 3: Reduce non-essential first-screen explanation**

Tighten or remove overly descriptive copy where needed.
Keep real functionality untouched.

**Step 4: Make the installed list the visual primary**

Adjust spacing/grouping so installed skills read as the main task area.
Secondary controls must remain available but not compete with the list.

**Step 5: Verify build**

Run: `npm run build`
Expected: build succeeds and `Skills` compiles without JSX/type issues

---

### Task 5: Final verification and design-note capture

**Files:**
- Modify if needed: `docs/plans/2026-03-25-compact-workbench-structure-fix-design.md`
- Modify if needed: `docs/plans/2026-03-25-compact-workbench-structure-fix.md`

**Step 1: Record implementation deviations**

If the final implementation differs from the design, note exactly what changed and why.

**Step 2: Final verification**

Run: `npm run build`
Expected: success output from TypeScript and Vite build

**Step 3: Prepare completion summary**

Confirm all of the following:
- duplicate language controls removed
- theme switcher exists and works structurally
- forced dark mode removed
- header is more compact
- `PageIntro` is tighter across pages
- `Skills` first screen reads like a workbench

Plan complete and saved to `docs/plans/2026-03-25-compact-workbench-structure-fix.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
