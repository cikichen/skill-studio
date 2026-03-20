# Skill Studio 项目计划

## 项目目标

构建一个轻量、跨平台、界面现代的 AI Skills 管理桌面应用，作为现有 skills 管理实现的增强版替代方案。

## 当前已完成

- 基于 Tauri 2 + React 19 + TypeScript + Vite 初始化项目
- 集成 Tailwind CSS v4、React Query、React Router
- 建立前端基础路由与桌面壳层布局
- 创建 Installed / Sources / Backups / Settings 四个基础页面
- 建立 Rust 后端基础模块结构：commands / core / state
- 提供示例 Tauri 命令：`ping`、`get_app_overview`
- 验证前端 `npm run build` 成功
- 验证 Rust `cargo build` 成功

## 架构规划

### 前端

- `src/app/`：应用路由入口
- `src/features/skills/`：已安装技能管理
- `src/features/sources/`：仓库、ZIP、发现能力
- `src/features/backups/`：备份与恢复
- `src/features/settings/`：环境配置与策略
- `src/shared/components/`：通用 UI 壳层与复用组件
- `src/shared/lib/`：Tauri / API 封装
- `src/shared/types/`：共享类型定义

### 后端

- `src-tauri/src/commands/`：Tauri 命令入口
- `src-tauri/src/core/manifest/`：manifest 解析与校验
- `src-tauri/src/core/installer/`：安装与卸载编排
- `src-tauri/src/core/sync/`：同步策略（auto / symlink / copy）
- `src-tauri/src/core/backup/`：备份与恢复
- `src-tauri/src/core/diagnostics/`：健康检查与漂移诊断
- `src-tauri/src/state.rs`：应用共享状态

## 下一阶段任务

### P1：数据模型落地

- 定义 `skill.json` manifest schema
- 明确 InstalledSkill / SkillSource / BackupEntry / ActivationState 结构
- 补充前后端共享字段约定

### P2：真实能力接入

- 前端接入 Tauri invoke
- 实现已安装技能列表读取
- 实现 sources 列表与 discovery 占位接口
- 实现 backups 列表与 restore/delete 占位接口

### P3：文件系统与平台能力

- 统一 workspace 目录布局
- 自动发现目标应用目录
- 处理 symlink / copy 策略差异
- 补充跨平台路径与权限处理

### P4：可用性增强

- 引入更完整的 UI 组件体系（可朝 shadcn/ui 风格演进）
- 增加错误提示、空状态、加载状态
- 增加日志、诊断面板与导入向导

## 推荐里程碑

### M1：可展示原型
- 页面结构完善
- Overview / Installed 数据可展示
- 具备基础导航与桌面样式

### M2：最小可用版本
- 可读取本地 skill manifest
- 可安装/卸载技能
- 可为目标应用执行启用/停用

### M3：增强版本
- 支持 ZIP 导入
- 支持 backup / restore
- 支持 unmanaged scan
- 支持多来源与冲突处理

## 当前技术决策

- 桌面框架：Tauri 2
- 前端框架：React + TypeScript
- 样式方案：Tailwind CSS v4
- 数据请求层：React Query
- 路由模式：Hash Router
- 后端语言：Rust
- manifest 建议：优先 `skill.json`

## 风险与注意点

- 安装、启用、停用、卸载要严格区分
- 不要把 source、deployment、activation 混成一个状态
- 多应用支持时，前后端支持枚举必须保持一致
- backup 应该是显式能力，不应只是卸载副作用
- 文档与实现要同步维护，避免再次产生漂移
