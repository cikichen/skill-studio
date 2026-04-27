# Skills 重构执行方案

**日期：** 2026-04-02  
**状态：** 待执行

## 目标

只针对本轮 `Skills` 页面重构，完成以下目标：

1. 稳定 `Skills` 页当前编译状态，避免继续在半重构状态下叠加改动。
2. 把 `Skills` 首屏明确收敛成「左侧可滚动分组列表 + 右侧详情/操作」的工作台结构。
3. 在不改后端数据契约的前提下，清理前端列表建模与交互逻辑，降低大列表下的无谓重渲染。
4. 保留并完成本轮已经引入的方向：延迟搜索、分组模型、独立滚动容器、README Markdown 渲染。
5. 以 `npm run build` 为主验证；若前端通过，再补 `cargo check` 验证 Tauri 编译状态。

## 当前实现基线

本轮重构已经部分落地到 `src/features/skills/page.tsx`，可以确认的现状包括：

- 已引入 `useDeferredValue`、`memo`、`ReactMarkdown`、`remark-gfm`
- 已把三类列表统一建模为 `SkillListEntry`
- 已新增 `SkillListSectionModel`，并通过 `listSections` 聚合左侧三组列表
- 已把左右两栏改成各自独立的 `overflow-y-auto` 面板
- 已把 README 从 `pre` 文本切换成 Markdown 渲染

但当前文件仍处于重构中间态，因此要先把结构稳定住，再继续微调。

## 已识别问题

### 1. 语法/结构风险

此前构建失败曾指向 `src/features/skills/page.tsx` 的中段与列表项区域，说明这个文件在本轮重构里被多次插入/移动代码，最容易再次出现：

- Hook 片段残缺
- 组件声明头或参数段被截断
- 旧实现与新实现并存
- 局部优化引入后未完成整体验证

### 2. 页面结构目标已明确，但还需要收口

这轮实际目标不是再做一版大改，而是把当前方向收敛为一个稳定版本：

- 左侧：搜索 + 三组列表 + 独立滚动
- 右侧：状态徽标 + 当前项操作 + README/详情
- 顶部：保留页面级 `PageIntro`，但不再让解释文案压过工作区

### 3. 性能工作应限制在轻量层

当前代码已经选择了正确的轻量优化路径：

- `useDeferredValue(searchQuery)`：降低输入时的同步过滤压力
- `MemoizedSkillListSection` / `MemoizedSkillListItem`：减少非必要重渲染
- 左右栏独立滚动：减轻整页滚动联动
- `listSections` 聚合：减少重复 JSX

本轮不应继续扩展到虚拟列表、后端扫描优化或更深的缓存策略。

## 本轮范围

### 包含

- `src/features/skills/page.tsx` 主体结构收口
- 必要时微调 `src/shared/components/workbench-ui.tsx`，仅限支撑 Skills 两栏高度/滚动语义
- 前端构建验证
- 如前端通过，再执行 Tauri `cargo check`

### 不包含

- Rust/Tauri 命令层改造
- Skills 数据结构或 API 契约变更
- 发现源、备份、Sources、Overview 等页面联动重构
- 虚拟滚动、缓存重构、扫描性能专项优化
- 全局动效系统或全局状态重构

## 执行步骤

### 步骤 1：先把 `page.tsx` 收敛到单一实现

**目标：** 确保文件中不存在“旧布局 + 新布局”并存、残缺组件声明、未闭合 JSX、重复逻辑片段。

执行要点：

- 检查 `SkillsPage` 主体内只保留一套布局实现
- 检查 `SkillListSection` / `MemoizedSkillListItem` / `InstalledSkillActions` / `UnmanagedSkillActions` / `DiscoverableSkillActions` / `SkillDetailContent` 的声明是否完整
- 删除已被 `listSections` 替代的旧分组三段 JSX
- 确保 `SkillListEntry` 字段与实际渲染使用一致，尤其是 `sourceLabel`
- 确保搜索、选中态、详情查询只沿一条数据流工作

**涉及文件：**
- `src/features/skills/page.tsx`

---

### 步骤 2：稳定左侧列表建模与滚动结构

**目标：** 左栏成为一个稳定的浏览面板，而不是多段松散卡片。

执行要点：

- 保持 `listSections` 作为三类数据的唯一 UI 建模出口
- 每个 section 继续只负责：标题、计数、刷新提示、空态、列表项
- 保持左栏搜索区固定在列表上方
- 保持左栏内部 `overflow-y-auto` 独立滚动
- section header 继续使用轻量 sticky，仅限当前滚动容器内部
- 不新增额外过滤器或二级交互，避免继续扩大范围

**预期结果：**
- 三类数据都由统一配置渲染
- 列表项显示信息稳定为：名称 / summary / meta / sourceLabel
- 搜索输入时不会导致明显的整体布局抖动

**涉及文件：**
- `src/features/skills/page.tsx`

---

### 步骤 3：稳定右侧详情工作区

**目标：** 右栏明确承担“当前项详情 + 对应操作”的职责，不和全局导入区混杂。

执行要点：

- 保持顶部徽标区域只展示当前项关键信息：kind、source、branch、installedAt
- 操作区继续按 `kind` 分流：
  - installed → 开关宿主应用、卸载、打开文档
  - unmanaged → 导入设置、导入动作
  - discoverable → 安装/启用、打开文档
- README / Details 保持单独容器，不和操作卡混排
- 右侧详情区保持独立滚动，避免大 README 拉伸整页

**涉及文件：**
- `src/features/skills/page.tsx`

---

### 步骤 4：完成 README Markdown 渲染的样式收口

**目标：** 让 README 渲染在当前控制台风格下可读，但不把这一轮扩成完整内容系统工程。

执行要点：

- 保留 `ReactMarkdown + remark-gfm`
- 仅补足当前容器需要的基础排版样式
- 优先保证标题、段落、列表、代码块、链接的可读性
- 不扩展为完整 markdown 主题系统
- 不引入额外 markdown 插件

**涉及文件：**
- `src/features/skills/page.tsx`
- 如需要，再补 `src/index.css` 中的局部 markdown 样式

---

### 步骤 5：验证轻量性能优化是否闭环

**目标：** 确保本轮性能改动完整且自洽，而不是半套实现。

执行要点：

- 搜索使用 `deferredSearchQuery` 做过滤
- `handleSelectItem` 保持稳定引用，避免列表项每次重建点击回调
- `MemoizedSkillListSection` / `MemoizedSkillListItem` 保持职责单一
- 不再额外引入 `useTransition`、虚拟列表等新机制
- React Query 仍沿用现有延迟启用与 `keepPreviousData` 模式

**完成标准：**
- 输入搜索时 UI 反馈为“Filtering…”且交互连贯
- 左右栏滚动互不影响
- 当前项切换时仅必要区域刷新

**涉及文件：**
- `src/features/skills/page.tsx`
- `src/features/skills/use-skills.ts`（仅核对，不计划改动）

---

### 步骤 6：构建验证

**目标：** 用构建结果收束这轮重构，而不是停留在“看起来差不多”。

执行顺序：

1. 在仓库根目录运行 `npm run build`
2. 若通过，再运行：
   - `cargo check --manifest-path src-tauri/Cargo.toml`

**判定标准：**
- TypeScript 无语法和类型错误
- Vite 构建通过
- 若执行 `cargo check`，Rust/Tauri 侧无新增编译错误

## 文件清单

### 主要修改文件
- `src/features/skills/page.tsx`

### 可能辅助修改文件
- `src/index.css`
- `src/shared/components/workbench-ui.tsx`

### 验证相关
- `package.json`
- `src-tauri/Cargo.toml`

## 验收标准

本轮完成后，至少满足以下结果：

1. `src/features/skills/page.tsx` 只保留一套稳定实现。
2. 左栏为统一分组列表模型，且拥有独立滚动容器。
3. 右栏为当前项详情与动作面板，且拥有独立滚动容器。
4. 搜索、选中态、详情查询数据流清晰，没有重复分支实现。
5. README 以 Markdown 形式展示，基础排版可读。
6. 轻量性能优化闭环成立，但未扩散成超范围重构。
7. `npm run build` 通过。
8. 若执行 `cargo check`，则也通过。

## 风险与约束

### 风险 1：继续边修边加功能
如果在修复结构时继续加入新的交互或样式想法，最容易再次把 `page.tsx` 推回半完成状态。

**约束：** 本轮只收口，不扩 scope。

### 风险 2：过度抽象
当前页面虽然长，但这轮目标是稳定，而不是把所有逻辑拆成大量新文件。

**约束：** 除非复用价值已经明确，否则优先在 `page.tsx` 内完成收口。

### 风险 3：把性能问题扩大成专项工程
当前已做的是“轻量优化”。若继续推进虚拟化、缓存层重构、跨页共享状态，会显著扩大范围。

**约束：** 本轮止步于 defer + memo + 独立滚动 + 统一建模。

## 结论

这轮 Skills 重构的正确策略不是继续发散，而是把已经进入代码的方向收口为一个稳定、可编译、可验证的版本：

- 结构上，明确 master-detail 工作台
- 交互上，明确搜索、选择、详情三条主线
- 性能上，保留轻量优化，不跨入下一阶段专项
- 验证上，以构建成功作为收尾条件
