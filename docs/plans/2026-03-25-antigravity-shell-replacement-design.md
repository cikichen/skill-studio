# Antigravity 壳层全量复用设计

**日期：** 2026-03-25
**状态：** 已确认，待执行

## 目标

将 Skill Studio 当前“左侧侧栏 + 独立标题栏”的混合桌面壳层，替换为 **Antigravity-Manager 的顶栏式壳层布局与视觉语言**。

这次变更的核心不是继续微调现有 header，而是：
- 直接复用 Antigravity 的壳层结构
- 保留 Skill Studio 现有真实路由与真实功能页
- 消除当前“布局骨架与视觉语言不匹配”的问题

## 问题诊断

当前界面之所以让“标题栏颜色和内容不符”，根因不是单个颜色值，而是壳层层级不一致：

1. **布局结构来自 Skill Studio**
   - 左侧 sidebar
   - 右侧独立主内容区
   - 顶部单独标题栏

2. **视觉 token 部分来自 Antigravity**
   - blue/slate 配色
   - rounded-xl / rounded-md
   - 更克制的阴影与边框

3. **结果**
   - 页面内容已经逐步趋向 Antigravity
   - 但 header 仍承担“说明卡 + 状态 badge + 路由上下文”这类旧壳层职责
   - 所以会产生“顶部一套、内容一套”的割裂感

## 设计决策

### 采用方案 A：完全复用 Antigravity 的壳层布局和样式

**保留：**
- `Overview / Skills / Sources / Backups / Settings` 这些真实页面
- 当前已完成的蓝 / slate 视觉方向
- 单页工作台、非长滚动、真实功能导向

**替换：**
- 移除当前 `AppShell` 的左侧 sidebar 壳层
- 移除当前独立的大标题栏模式
- 改为 Antigravity 式：
  - 顶部 sticky navbar
  - 中部导航项
  - 右侧语言 / 主题 / 设置辅助操作
  - navbar 下方承载页面内容

## 目标信息架构

### 1. 全局壳层
- 外层高度：`h-screen flex flex-col`
- 顶部固定 navbar：`sticky top-0 z-50 pt-9`
- 主内容区域：`flex-1 overflow-hidden flex flex-col`
- 内容容器宽度：`max-w-7xl mx-auto px-8`

### 2. 顶部导航内容
- 左侧：Skill Studio 品牌 / logo 区
- 中间：主导航项
  - Overview
  - Installed
  - Sources
  - Backups
  - Settings
- 右侧：
  - 语言切换
  - 可选主题切换（若保留）
  - 轻量设置入口或状态操作

### 3. 页面标题策略
- 不再使用当前 `AppShell` 内那块大标题 header
- 每个页面继续通过 `PageIntro` 自己表达标题、说明和统计
- 顶部 navbar 只负责全局导航和应用壳层，不再兼任页面说明区

## 视觉策略

### 完全对齐 Antigravity 的壳层语气
- 浅色：`#FAFBFC`
- 深色：`#1d232a` / `base-300`
- 顶栏：与页面背景同语气，而不是独立卡片化的大块面板
- 去掉当前壳层里过强的边框包裹感与“窗口内再套一个窗口”的结构

### 保持 Skill Studio 页面内容不伪造
- 不引入 Antigravity 的业务模块
- 不复制它的账号、监控、代理、安全等信息结构
- 只复用：
  - 壳层布局
  - navbar 节奏
  - 容器宽度
  - 顶部 sticky 行为
  - 背景与层级关系

## 影响文件

### 核心壳层
- `src/shared/components/app-shell.tsx`
- `src/app/routes.tsx`
- `src/index.css`

### 页面适配
- `src/shared/components/workbench-ui.tsx`
- `src/features/overview/page.tsx`
- `src/features/skills/page.tsx`
- `src/features/sources/page.tsx`
- `src/features/backups/page.tsx`
- `src/features/settings/page.tsx`

## 实施边界

### 本次做
- 顶栏式壳层替换
- 导航从侧栏改为顶栏
- 内容容器与滚动行为对齐 Antigravity
- 现有页面在新壳层下完成适配

### 本次不做
- 不复制 Antigravity 的业务页面内容
- 不引入它的 store / window manager / mini view 架构
- 不强行照搬其所有组件拆分方式
- 不改 Skill Studio 真实功能逻辑

## 验证标准

实施完成后，应满足：
1. 不再存在当前“标题栏与页面内容语气不一致”的割裂感
2. 顶栏、背景、内容容器与页面节奏整体接近 Antigravity
3. 保持桌面程序式分页工作台体验，不回退到营销页
4. `npm run build` 成功

## 风险

1. **导航迁移风险**
   - 从 sidebar 切到 top navbar 后，某些导航文案可能需要压缩
2. **内容密度风险**
   - 顶栏式布局会减少左侧常驻信息，需要避免页面头部过于拥挤
3. **壳层/页面重复风险**
   - 需要避免 navbar 和 `PageIntro` 重复表达同一层信息

## 结论

这次不应再继续修补当前标题栏，而应直接完成壳层替换。只有把布局骨架一起切到 Antigravity 的模式，视觉语言才会真正统一。