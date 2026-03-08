# Typex Target Architecture

来源：根目录 `Typex升级总体交付方案-v1.md`。

当前 Typex 的正确演进方向不是继续强化 Web Demo 细节，而是沉淀为一套 Node-first、平台无关、Web 首发、支持富文本与 Markdown、后续可扩展到多端的编辑器引擎体系。

## 文档定位

本文是 Typex 完整设计包的总入口，用于串联架构、规范、API、adapter、迁移、质量与模板文档。正式实施前，所有下游文档都应与本文保持一致。

### 关联主文档
- `docs/architecture/package-contract-matrix.md`
- `docs/architecture/runtime-event-pipeline.md`
- `docs/guides/roadmap.md`
- `docs/guides/master-delivery-plan.md`
- `docs/quality/acceptance.md`

### 关联规范文档
- `docs/specs/canonical-document-model.md`
- `docs/specs/canonical-schema-spec.md`
- `docs/specs/selection-snapshot-spec.md`
- `docs/specs/transaction-and-operation-spec.md`
- `docs/specs/render-plan-schema.md`
- `docs/specs/platform-adapter-contract.md`

### 关联 API 文档
- `docs/api/editor-kit-public-api.md`
- `docs/api/package-export-surface.md`

### 关联 adapter 文档
- `docs/adapters/markdown-adapter-contract.md`
- `docs/adapters/html-adapter-contract.md`
- `docs/adapters/plugin-extension-architecture.md`
- `docs/adapters/source-first-embed-spec.md`

### 关联迁移与质量文档
- `docs/migration/current-to-target-cutover-plan.md`
- `docs/quality/compatibility-matrix.md`
- `docs/quality/performance-budget.md`
- `docs/quality/security-and-sanitization-policy.md`
- `docs/quality/traceability-matrix.md`
- `docs/quality/redesign-phase-acceptance-template.md`

### 关联团队模板文档
- `docs/templates/team-operating-model.md`
- `docs/templates/project-delivery-template.md`
- `docs/templates/spec-review-checklist.md`

## 当前定位

当前仓库更准确的定位是：

> Web 编辑器内核 + Web 平台实现

已具备的重要基础资产：
- Path 树
- Selection / 多光标
- Step / Transaction / History
- 非 `contentEditable` 的输入桥接思路
- 格式分组渲染思路
- core / platform 初步分层

## 当前主要问题

1. `core` 仍依赖平台上下文，耦合偏重
2. 文档模型、渲染、UI 更新、副作用边界不清
3. `Formater` 职责过重
4. 输入法 / 事务 / 分发边界脆弱
5. 平台实现深度绑定 DOM / Selection / iframe input
6. `packages/editor` 同时承担 demo 和产品接入职责
7. Markdown 目前仍未形成完整闭环

## 目标分层

建议采用 7 层架构：

### 1. `@typex/document`
- canonical document model
- block / inline / text / embed / selection snapshot
- 纯数据层
- 不依赖 DOM
- 不直接触发 UI 更新

### 2. `@typex/schema`
- 定义节点与 mark 的语义规则
- 统一 paragraph / heading / table / image / code_block / diagram / embed 等能力边界

### 3. `@typex/transform`
- operation / step / transaction / command
- history
- selection transform
- apply / invert / normalize

### 4. `@typex/render-core`
- document + schema -> render plan
- 平台无关的渲染中间层
- 沉淀当前 `Formater` 的通用算法

### 5. `@typex/platform-*`
首发：`@typex/platform-web`

后续：
- `@typex/platform-flutter`
- `@typex/platform-rn`

平台层职责仅限：
- 宿主渲染
- 选区桥接
- 输入桥接
- IME
- clipboard
- caret / overlay

### 6. `@typex/parser-*` / `@typex/serializer-*`
例如：
- parser-markdown
- serializer-markdown
- parser-html
- serializer-html
- adapter-drawio

原则：parser / serializer 是 adapter，不是 core。

### 7. `@typex/editor-kit`
- `createEditor`
- command 注册
- preset schema
- 外部 API
- 与业务接入对齐

### Demo 应用
`apps/editor-demo`
- GitHub Pages demo
- 手工验证
- 示例能力展示
- 不承载产品 API 边界

## 当前代码中的关键落点

- Editor 组装入口：`packages/editor/index.js:15`
- Core 初始化：`packages/@typex-core/Typex.js:15`
- 内核事件分发：`packages/@typex-core/initCore.js:21`
- 当前挂载链路：`packages/editor/mount.js:29`

## Markdown / 富文本策略

- 内部 canonical model 只有一份
- Markdown 只是导入导出视图之一
- CommonMark + GFM 为主线
- 历史语法与特殊格式由 parser plugin / serializer adapter 承担
- 不让 Markdown 方言污染 core

## 多端策略

短期正确结论：

> 共用核心，不共用当前 Web 平台实现

未来可复用：
- document
- schema
- transform
- history
- render-core
- parser / serializer

不可直接复用：
- DOM patch
- 浏览器 Selection
- iframe input
- Web IME 处理
- Web caret / overlay

## 交付顺序

1. 先补齐完整设计包并定稿
2. 稳住现有内核并建立测试基线
3. 抽纯核心
4. 拆 render-core 与 platform-web
5. 建立 parser / serializer
6. 建立 editor-kit 与 demo 分离
7. 再进入 Flutter / RN 原型阶段

## 设计前置条件

在进入正式代码实施前，以下文档必须完成并相互一致：
- canonical document model
- canonical schema
- selection snapshot spec
- transaction / operation spec
- render plan schema
- platform adapter contract
- editor-kit public API
- markdown / html adapter contract
- migration cutover plan
- compatibility / performance / security / traceability 文档

如果上述规范未完成，实施会重新退化为局部修补，无法满足完整交付要求。
