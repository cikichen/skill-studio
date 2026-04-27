# Compact Workbench Structure Fix Design

**日期：** 2026-03-25  
**状态：** 已确认，待执行

## 目标

先修 Skill Studio 当前最影响实际使用体验的结构问题，而不是立刻进入性能优化。

这轮设计的目标是：
- 去掉右上角重复语言按钮
- 补真正的主题切换能力
- 收紧 header 高度与首屏留白
- 重整 `PageIntro / Panel / Skills 首屏` 关系
- 保持真实页面、真实路由和真实功能不变

## 为什么先修结构

当前体验差，不只是“像不像 Antigravity”的问题，而是结构层面的不协调：

1. **Header 冗余**
   - `AppShell` 顶栏过高，且右侧同时存在两个语言切换控件
   - 用户第一眼就会觉得混乱、粗糙

2. **没有真实主题系统**
   - `src/main.tsx` 当前直接写死 `document.documentElement.classList.add("dark")`
   - 这不是主题切换，只是强制深色模式

3. **首屏像文档，不像工具**
   - `PageIntro` 偏重
   - `PageLayout` / `Panel` / 内容区的垂直节奏偏松
   - 导致首屏空白过多、核心操作下沉

4. **Skills 首屏工作台关系不够清楚**
   - 页面虽然已经统一到 Antigravity 色彩和圆角体系
   - 但 `PageIntro`、搜索条、Installed 列表、右侧辅助区之间仍然像多个白盒子并列

## 本次采用方案

### 方案 A：Compact Workbench 壳层收紧版（已确认）

保留：
- 当前顶栏导航模型
- 现有 5 个真实页面：`/overview`, `/skills`, `/sources`, `/backups`, `/settings`
- 现有页面级真实功能与数据来源

修正：
- 顶栏结构
- 顶栏动作区
- 主题系统
- 共享页头与区块节奏
- `Skills` 首屏工作台关系

## 信息架构与结构修正

### 1. AppShell / 顶栏

#### 现状问题
- 顶栏高度偏高
- 右侧语言切换重复
- 缺少主题切换
- 顶栏更像“导航条 + 临时按钮堆叠”，不像应用工具栏

#### 修正方向
- 顶栏收成单层工具栏
- 左侧：品牌 + 主导航
- 右侧：
  - 一个语言切换
  - 一个主题切换
- 删除重复的 `EN / 中文` 按钮或 `Languages` 图标中的其中一个，只保留一个语言入口

#### 目标体验
让顶栏看起来像真正的桌面应用 toolbar，而不是一个网页 header。

---

### 2. 主题系统

#### 现状问题
- 代码里只有深色 class，没有真实主题切换入口
- 用户会直觉感到“功能残缺”

#### 修正方向
新增 Theme Provider / Theme State，支持：
- `light`
- `dark`
- `system`

并满足：
- 状态可持久化
- 启动时按用户偏好恢复
- 没有用户偏好时跟随系统
- 不再在 `main.tsx` 中硬编码强制 dark

---

### 3. `PageIntro` 收紧为页头条

#### 现状问题
`PageIntro` 现在更像营销页/文档页头，而不是工作台页面头部：
- 标题区太高
- 描述偏长
- actions 与统计卡偏松

#### 修正方向
- 标题保留，但更紧凑
- 描述控制在 1–2 行
- actions 更靠近标题区
- 统计卡视觉降级为状态摘要
- 减少首屏被说明性信息占据的比例

#### 设计原则
页头只负责“建立上下文”，不应压住真正的操作内容。

---

### 4. `Panel` 层级收紧

#### 现状问题
`PageIntro`、`Panel`、子卡片之间层级差还不够明确：
- `Panel` 有时看起来像第二个页头
- 内容块之间仍有 box-in-box 感

#### 修正方向
- `PageIntro` = 页面级信息
- `Panel` = 功能区级信息
- item/list/action tile = 内容级信息

具体做法：
- `Panel` 标题继续弱化
- `Panel` 与 children 的垂直节奏再收一点
- 尽量使用边框和底色区分层级，而非继续加大阴影

---

### 5. `Skills` 首屏重组

#### 现状问题
这是结构问题最重的一页：
- 首屏虽然统一了视觉 token，但仍不够像工作台
- 搜索区、列表区、右侧辅助区主次关系不清楚
- 第一屏依然有一定“说明页 + 内容区块拼接”的感觉

#### 修正方向
`Skills` 第一屏明确改成：
1. 紧凑版 `PageIntro`
2. 搜索/过滤控制条
3. Installed 列表作为主视觉主体
4. 右侧 `Install target / ZIP install / Discovery` 作为辅助工作区

#### 本次不会做
- 不拆路由
- 不拆成更多页面
- 不改真实功能逻辑
- 不先碰 discover/unmanaged/backups 的性能问题

## 影响文件

### 核心文件
- `src/shared/components/app-shell.tsx`
- `src/shared/components/workbench-ui.tsx`
- `src/main.tsx`
- `src/shared/lib/i18n.tsx`（如需复用/扩展状态管理模式）
- `src/features/skills/page.tsx`

### 可能适配文件
- `src/features/overview/page.tsx`
- `src/features/sources/page.tsx`
- `src/features/backups/page.tsx`
- `src/features/settings/page.tsx`

## 验收标准

这轮结构修正完成后，应满足：
1. 右上角不再出现两个语言切换控件
2. 存在真正可用的主题切换入口
3. `main.tsx` 不再强制 dark
4. 顶栏高度更紧凑，像应用工具栏而不是网页 header
5. 首屏空白明显减少
6. `Skills` 第一屏更像工作台，不像说明页 + 卡片拼装
7. `npm run build` 成功

## 明确暂不处理

本轮先不进入这些内容：
- tab 卡顿的 Tauri / query / 缓存问题
- discover/unmanaged scan/load_store 的性能优化
- 全局 toast / 动效系统的完整引入
- 页面切换过渡与骨架屏体系

这些内容将在“结构先稳住”之后单独进入第二阶段处理。

## 结论

先修结构是正确顺序。

如果先不把顶栏、主题、页头和 `Skills` 首屏关系修正，后续即使开始做缓存和性能优化，用户仍会觉得这个产品“像一个本地网页而不是桌面工具”。
