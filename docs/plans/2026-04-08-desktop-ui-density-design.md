# Desktop UI Density Design

**日期：** 2026-04-08  
**状态：** 已确认，执行中

## 目标

在 Tauri 原生窗口中，把 Skill Studio 调整成更接近桌面工具的紧凑工作台：

- 1280x820 默认窗口内优先完成首屏任务
- 非必要区域尽量不出现滚动条
- Overview 不再像统计页，而是像启动工作流的控制台
- Sources / Skills 统一成高密度、低噪音的双栏工作台

## 设计原则

1. **主滚动最小化**
   - 整个窗口尽量不滚
   - 只允许列表区和 README / 详情区独立滚动
   - 即使需要滚动，也默认隐藏滚动条

2. **任务优先于统计**
   - 首屏先告诉用户“下一步做什么”
   - 统计与状态摘要降级成辅助信息

3. **桌面应用节奏**
   - 收紧 header、hero、panel 内边距
   - 减少大块留白和 box-in-box 感
   - 让主要操作始终靠近视线中心

4. **统一工作台语言**
   - Sources / Skills 使用同一套布局逻辑
   - 左侧是目录与筛选，右侧是详情与动作
   - 页面之间切换不应重新学习交互结构

## 结构调整

### 1. AppShell

- 顶栏高度继续收紧
- 主内容区改为固定高度容器，避免页面整体滚动
- 滚动权交给页面内部的 list / detail 容器

### 2. Overview

- Hero 区缩短，保留标题与少量上下文
- 首屏主区改成：
  - 快速开始
  - 待处理事项 / 当前状态
  - 环境摘要
- 宿主应用覆盖面保留，但缩到更紧凑的摘要卡层级

### 3. Sources / Skills

- 双栏结构保留，但进一步固定节奏：
  - 顶部：紧凑页头
  - 左栏：搜索、过滤、列表
  - 右栏：详情头、README/详情体、底部动作 dock
- README 区尽量吃满剩余高度
- 底部动作 dock 固定，不随 README 内容被推出可视区

### 4. 滚动条策略

- `body` 与主 frame 不显示滚动条
- 列表与详情容器保留滚动能力，但使用隐藏滚动条样式
- 限制首屏内容高度，避免初始进入就出现主滚动

## 影响文件

- `src/shared/components/app-shell.tsx`
- `src/shared/components/workbench-ui.tsx`
- `src/features/overview/page.tsx`
- `src/features/sources/page.tsx`
- `src/features/skills/page.tsx`
- `src/index.css`

## 验收标准

1. `npx tauri dev` 打开后，默认窗口首屏不出现主内容滚动条
2. `Overview` 首屏主动作明显，统计卡不再占据主要视觉
3. `Sources` 和 `Skills` 的左列表、右详情、底部动作形成统一工作台
4. README 或长列表可以滚动，但滚动条默认不抢眼或不显露
5. `npm run build` 成功
