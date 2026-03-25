# Skill Studio Desktop Console UI Design

## Goal

把当前 Skill Studio 从“带 dashboard 骨架的多页应用”收敛成一个更像桌面程序的控制台 UI：固定壳层、侧边导航、分页工作台，以及只围绕真实能力构建的总览页。

## Confirmed Constraints

- 不做 SaaS landing page
- 不伪造客户、定价、营收或无关图表
- 不做整页纵向长滚动
- 功能多时拆分页面，壳层固定，只允许内容区局部滚动
- 以真实能力为核心：Installed / Sources / Backups / Settings / 多宿主应用支持

## Approved Direction

### Information Architecture

采用 **方案 A：Overview + 工作台分页**：

1. `Overview`
   - 工作区状态
   - 快速动作
   - 最近活动
   - 宿主应用覆盖面
2. `Installed`
   - 已安装技能主工作台
3. `Sources`
   - 仓库与发现来源
4. `Backups`
   - 备份与恢复
5. `Settings`
   - 环境默认值、同步模式、诊断与迁移边界

### Visual Direction

- 深色、精密、克制的桌面控制台风格
- 轻玻璃拟态只用于 `sidebar`、`header`、外壳层级
- 主要正文卡片使用稳定实底，不用大面积毛玻璃
- 页面通过模块化卡片与局部滚动表达信息密度

### Shell Behavior

- 左侧导航固定
- 顶部 header 固定
- 内容区滚动而不是整个窗口滚动
- 各工作台页面保持独立语境，避免在单页中堆叠全部模块

## Files Expected To Change

- `src/main.tsx`
- `src/index.css`
- `src/app/routes.tsx`
- `src/shared/components/app-shell.tsx`
- `src/features/overview/page.tsx` (new)
- `src/features/sources/page.tsx`
- `src/features/backups/page.tsx`
- `src/features/settings/page.tsx`

## Verification Plan

- TypeScript build via `npm run build`
- LSP diagnostics for edited files
- Visual sanity check through shell/layout logic and route wiring
