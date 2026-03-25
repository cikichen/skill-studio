# Antigravity Shell Replacement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Skill Studio’s current mixed sidebar/header shell with an Antigravity-style sticky top navbar shell while preserving the real routes and desktop workbench pages.

**Architecture:** Keep the existing React Router pages and page-level workbench content, but rewrite the application shell so navigation moves from a left sidebar into a sticky top navbar modeled after Antigravity’s layout rhythm. Reuse existing `PageIntro` and workbench components where they still fit, and only adapt page spacing/layout where the new shell requires it.

**Tech Stack:** React 19, React Router, TypeScript, Tailwind CSS v4, Vite, Tauri

---

### Task 1: Replace the shell structure

**Files:**
- Modify: `src/shared/components/app-shell.tsx`
- Modify: `src/index.css`
- Reference: `/Users/simonchen/Developer/workspace/desktop/Antigravity-Manager/src/components/layout/Layout.tsx`
- Reference: `/Users/simonchen/Developer/workspace/desktop/Antigravity-Manager/src/components/navbar/Navbar.tsx`
- Reference: `/Users/simonchen/Developer/workspace/desktop/Antigravity-Manager/src/App.css`

**Step 1: Identify the failing shell behavior**

Failure to eliminate:
- Current shell still uses sidebar + large header
- Header visually conflicts with Antigravity-style page content
- Layout does not match the confirmed design direction

**Step 2: Rewrite `AppShell` to top-navbar layout**

Implement all of the following:
- Remove the left sidebar container entirely
- Add a sticky top navbar structure
- Use Antigravity-like layout rhythm:
  - outer shell: `h-screen flex flex-col`
  - navbar: `sticky top-0 z-50 pt-9`
  - centered container: `max-w-7xl mx-auto px-8`
  - content area below navbar: `flex-1 overflow-hidden flex flex-col`
- Keep language toggle if possible, but place it in the navbar action area
- Stop rendering the current large workbench header block inside the shell

**Step 3: Align global shell CSS**

Adjust `src/index.css` so shell behavior matches the new navbar layout:
- keep `html/body/#root` full-height
- keep overscroll disabled
- make root/content behavior consistent with top-navbar shell
- do not reintroduce glow/glassmorphism

**Step 4: Verify shell compiles**

Run: `npm run build`
Expected: build succeeds and no shell-related TypeScript errors remain

---

### Task 2: Move navigation from sidebar cards to top navbar items

**Files:**
- Modify: `src/app/routes.tsx`
- Modify: `src/shared/components/app-shell.tsx`

**Step 1: Refactor nav item rendering contract**

Update the shell/router integration so navigation items can render naturally inside a top navbar instead of a vertical sidebar list.

**Step 2: Rebuild route navigation styling**

Implement navbar items that visually match Antigravity’s navigation tone:
- horizontally arranged nav items
- compact height
- blue/slate active state
- no sidebar-card affordance
- hover behavior should be subtle and flat, not panel-like

**Step 3: Preserve route behavior**

Keep these routes intact:
- `/overview`
- `/skills`
- `/sources`
- `/backups`
- `/settings`
- `/` redirect to `/overview`

**Step 4: Verify route shell behavior**

Run: `npm run build`
Expected: routes still compile, navigation still works, no type errors in `routes.tsx`

---

### Task 3: Adapt page spacing to the new shell

**Files:**
- Modify: `src/shared/components/workbench-ui.tsx`
- Modify: `src/features/overview/page.tsx`
- Modify: `src/features/skills/page.tsx`
- Modify: `src/features/sources/page.tsx`
- Modify: `src/features/backups/page.tsx`
- Modify: `src/features/settings/page.tsx`

**Step 1: Normalize page entry spacing**

Adjust `PageLayout` / `PageIntro` spacing so pages feel correct under a sticky navbar shell rather than under a dedicated header block.

**Step 2: Remove redundant shell-level messaging**

Ensure pages do not rely on the old shell header for context. Each page should stand alone through its own `PageIntro`.

**Step 3: Fine-tune vertical rhythm**

Check and adjust:
- top spacing under navbar
- panel spacing
- stat card density
- page width balance under `max-w-7xl`

**Step 4: Verify visual integration compiles**

Run: `npm run build`
Expected: no errors after page-level layout adjustments

---

### Task 4: Final Antigravity polish pass

**Files:**
- Modify: `src/shared/components/app-shell.tsx`
- Modify: `src/shared/components/workbench-ui.tsx`
- Modify any of:
  - `src/features/overview/page.tsx`
  - `src/features/skills/page.tsx`
  - `src/features/sources/page.tsx`
  - `src/features/backups/page.tsx`
  - `src/features/settings/page.tsx`

**Step 1: Check for leftover old-shell affordances**

Remove or reduce:
- any sidebar-era visual assumptions
- oversized shell badges
- header-like duplicated context
- any remaining “window inside window” framing that conflicts with Antigravity

**Step 2: Keep only real product structure**

Do not add fake Antigravity business modules. Keep only Skill Studio’s actual information architecture.

**Step 3: Final build verification**

Run: `npm run build`
Expected: success

**Step 4: Manual review checklist**

Confirm:
- top navbar and page body feel like one system
- no header/content mismatch remains
- shell looks clearly closer to Antigravity than the prior hybrid state
- page content still reads as Skill Studio, not a copied business app

---

### Task 5: Capture completion evidence

**Files:**
- Modify if needed: `docs/plans/2026-03-25-antigravity-shell-replacement-design.md`
- Modify if needed: `docs/plans/2026-03-25-antigravity-shell-replacement.md`

**Step 1: Record any implementation deviations**

If the final code differs from the plan, note exactly what changed and why.

**Step 2: Run final verification**

Run: `npm run build`
Expected: success output from TypeScript and Vite build

**Step 3: Prepare integration summary**

Summarize:
- shell structure changed from sidebar to top navbar
- routes preserved
- pages adapted
- final build status

Plan complete and saved to `docs/plans/2026-03-25-antigravity-shell-replacement.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
