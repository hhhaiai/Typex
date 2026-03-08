# Typex Master Delivery Plan

来源：
- `docs/architecture/target-architecture.md`
- `docs/architecture/package-contract-matrix.md`
- `docs/architecture/runtime-event-pipeline.md`
- `docs/guides/roadmap.md`
- `docs/quality/acceptance.md`

## 1. 项目目标

把当前 Typex 从“可运行的 Web Demo 编辑器”升级为一套：
- **Node-first** 的富文本内核
- **平台无关** 的 canonical document / schema / transform / render-core
- **Web 首发** 的正式平台适配器
- 同时支持 **Rich Text + Markdown**
- 后续可扩展到 **Flutter / Android / iOS / RN**
- 面向交付而非仅面向 demo

核心要求：
1. Node 系富文本能力强、易用、性能高、资源占用低
2. 横向支持更多端栈，但不提前牺牲核心边界
3. 富文本与 Markdown 同时支持
4. Markdown 兼容新老格式与扩展语法
5. 最终交付功能报告、验收报告、设计文档、清晰代码

## 2. 当前结论

### 2.1 已明确的正确方向

当前仓库最合理的演进路径已经被现有文档验证：
- 一个 canonical document model
- 一个 canonical schema
- 多种 parser/serializer adapter
- command 必须统一编译为 transaction
- platform 层只能做宿主桥接
- Web 先行，移动端后置到平台边界稳定之后

### 2.2 当前仓库主要问题

1. core 仍然依赖平台上下文，平台泄漏到内核
2. 输入、事务、选区、历史、渲染边界不够清晰
3. `Formater` 职责过重
4. editor facade、toolbar、demo、platform 装配混在一起
5. Markdown 尚未形成完整 parse/serialize 闭环
6. 测试资产薄弱，高风险区域尚未被自动化覆盖

### 2.3 当前代码中的关键风险点

- `packages/@typex-core/Typex.js:15`
- `packages/@typex-core/initCore.js:21`
- `packages/@typex-core/initCore.js:43`
- `packages/@typex-core/initCore.js:94`
- `packages/@typex-core/initCore.js:153`
- `packages/@typex-core/transform/transaction.js:35`
- `packages/@typex-core/history/index.js:20`
- `packages/@typex-core/selection/index.js:284`
- `packages/@typex-platform/index.js:6`
- `packages/@typex-platform/web/intercept/keyboardIntercept.js:47`
- `packages/@typex-platform/web/intercept/mouseIntercept.js:23`
- `packages/editor/index.js:100`
- `packages/editor/mount.js:29`

## 3. 目标架构总览

目标分层：

1. `@typex/document`
2. `@typex/schema`
3. `@typex/transform`
4. `@typex/render-core`
5. `@typex/platform-*`
6. `@typex/parser-*` / `@typex/serializer-*`
7. `@typex/editor-kit`
8. `apps/editor-demo`

关键约束：
- `document / schema / transform / render-core / parser-* / serializer-*` 必须平台无关
- `platform-*` 只桥接 host 能力
- `editor-kit` 是唯一推荐对外接入面
- demo 不再承载正式产品 API 边界

## 4. 运行时主链路

统一运行时链路：

```text
Host event / API call / Toolbar action
  -> normalize to command intent or transaction request
  -> compile command to transaction
  -> dispatch transaction
  -> apply document change
  -> update selection snapshot
  -> update history
  -> rebuild render plan
  -> platform render + overlay sync
  -> emit runtime events
```

不允许的旁路：
- 平台事件直接改 document
- history 直接绕过 dispatch
- 选区完全依赖 DOM/native 状态
- toolbar 直接操作内部 path/component state

## 5. Markdown 与扩展格式策略

### 5.1 总策略

- 内部只保留一份 canonical model
- Markdown 是导入导出视图，不是内核模型
- 优先支持 CommonMark + GFM baseline
- 老语法与特殊方言通过 adapter 承担
- 不允许 Markdown 方言污染 core

### 5.2 支持范围规划

第一阶段：
- Paragraph / Heading / Bold / Italic / Code / Quote / List / Link / Image
- CommonMark + GFM baseline
- Markdown <-> canonical doc
- HTML <-> canonical doc baseline

第二阶段：
- Table
- Task list
- Fenced code info string
- Mermaid block
- wiki-style `[[...]]`
- topic/tag 风格如 `[topic]`

第三阶段：
- draw.io XML source-first embed adapter
- 更多历史语法兼容适配
- 特殊块/嵌入节点策略

### 5.3 特殊规则

- Mermaid / draw.io / diagram 等必须 source-first 存储
- 预览图、SVG、HTML 都是派生结果，不是主存储
- 图片、嵌入、图表都走 schema + adapter，而非硬编码到平台层

## 6. 跨平台策略

短期原则：
- **共用核心，不共用当前 Web 平台实现**
- Web 是正式第一平台
- Flutter / RN / Android / iOS 先定义 contract，再做最小原型

可共用层：
- `@typex/document`
- `@typex/schema`
- `@typex/transform`
- `@typex/render-core`
- `@typex/parser-*`
- `@typex/serializer-*`

不可直接共用层：
- DOM patch
- Browser Selection
- iframe input
- Web IME 处理
- Web caret / overlay 实现

## 7. 质量与验收总策略

### 7.1 分层测试

L1 单元测试：
- history
- selection
- 输入状态机
- step / transaction
- command compile

L2 集成测试：
- keyboard/input -> command -> transaction -> history
- host selection -> selection snapshot
- undo / redo 完整链路
- parser / serializer roundtrip

L3 UI / E2E：
- 页面打开可挂载
- 输入/删除/换行
- 撤销/重做
- 基础格式化命令
- 鼠标拖选/多选区
- 中文输入法

### 7.2 验收优先级

P0：
- 可挂载
- 基础输入正常
- 选区同步正确
- undo/redo 可用
- demo 可访问

P1：
- 多光标
- IME 稳定
- 鼠标拖选
- 基础格式命令
- 跨节点删除结构稳定

P2：
- Markdown 双向转换
- 复杂块结构
- 跨浏览器一致性
- 长文档性能基线

### 7.3 当前 QA 判断

当前仓库已经有验收框架文档，但实际自动化测试资产仍不足。
短期必须优先建立：
- selection / transaction / history 测试基线
- API 基线测试
- Web demo 最小 E2E 流程

## 8. 团队协作模板结论

面向后续项目复用，团队模式建议固定为：

### 8.1 固定角色
- team-lead：总控、收敛、决策、对外响应
- coordinator：任务编排、文档路由、状态同步
- architect：架构边界、ADR、运行时与包契约
- node-engineer：核心实现与 Node/JS 方向
- flutter-engineer：跨平台边界与移动端协议
- qa-engineer：测试策略、测试资产、验收报告
- researcher：外部方案调研与对比分析

### 8.2 工作原则
- 文档优先
- 每个输出尽量落库
- 实现前先有约束文档
- 任务推进与文档推进同步
- team-lead 负责把“用户新要求”映射到“当前真实实现状态”

### 8.3 标准文档集合
- 架构目标文档
- 包契约矩阵
- 运行时事件管线
- 路线图
- 质量验收标准
- 主交付计划
- 后续可补：导出面清单 / selection snapshot spec / render plan schema

## 9. 分阶段实施计划

### Phase 0：完整设计包 + 测试基线
- 补齐 canonical / runtime / API / adapter / migration / quality / template 设计文档
- 明确现有 public API 行为
- 为 selection / transaction / history 补单元测试
- 清理 demo 与核心耦合点
- 确保当前 demo 不回退
- 建立测试网站：左侧输入、右侧实时预览，兼容 rich text 与 markdown

### Phase 1：抽纯核心
- 让 `createEditor(options.data)` 真正生效
- 增加 `getValue()` / `setValue()` / `execCommand()`
- 拆 `pluginContext` 全局依赖
- 剥离模型层 UI 更新副作用

### Phase 2：拆 render-core 与 platform-web
- 从 `Formater` 抽 render-core
- 平台层显式注入 `PlatformAdapter`
- DOM patch 保留在 platform-web
- SelectionBridge 正式化

### Phase 3：打通 Markdown / HTML baseline
- 建立 markdown parser/serializer baseline
- 建立 html parser/serializer baseline
- 做 canonical doc roundtrip 验证
- 先 CommonMark + GFM，再逐步扩展 Mermaid / draw.io / wiki-link / topic

### Phase 4：形成 editor-kit
- `packages/editor` 演进为 `@typex/editor-kit`
- demo 与正式接入层分离
- 统一 API、命令、事件、插件注入

### Phase 5：跨平台 contract prototype
- 定义 Flutter / RN / Android / iOS 平台 contract
- 只做最小原型验证
- 验证 host bridge、selection bridge、input/IME 方案

## 10. 当前最值得先做的第一批实现

建议第一刀只做以下内容：
1. 稳定 editor public API：`createEditor` / `getValue` / `setValue` / `execCommand`
2. 清理默认 `mockData` 逻辑
3. 补 selection / transaction / history 测试
4. 明确 command -> transaction 单路径
5. 建立最小 JSON 输入输出基线

这是当前收益最高、风险可控、还能为后续 Markdown 与多端扩展打地基的一批改造。

## 11. 当前不建议立即做的事情

- 不立即做 Flutter/RN 正式适配
- 不立即做协同编辑
- 不立即做过重的块组件体系
- 不立即做复杂 Markdown 方言全集支持
- 不立即在平台层堆业务语义

## 12. 当前主文档索引

- `docs/architecture/target-architecture.md`
- `docs/architecture/package-contract-matrix.md`
- `docs/architecture/runtime-event-pipeline.md`
- `docs/specs/canonical-document-model.md`
- `docs/specs/canonical-schema-spec.md`
- `docs/specs/selection-snapshot-spec.md`
- `docs/specs/transaction-and-operation-spec.md`
- `docs/specs/render-plan-schema.md`
- `docs/specs/platform-adapter-contract.md`
- `docs/api/editor-kit-public-api.md`
- `docs/api/package-export-surface.md`
- `docs/adapters/markdown-adapter-contract.md`
- `docs/adapters/html-adapter-contract.md`
- `docs/adapters/plugin-extension-architecture.md`
- `docs/adapters/source-first-embed-spec.md`
- `docs/migration/current-to-target-cutover-plan.md`
- `docs/quality/compatibility-matrix.md`
- `docs/quality/performance-budget.md`
- `docs/quality/security-and-sanitization-policy.md`
- `docs/quality/traceability-matrix.md`
- `docs/quality/acceptance.md`
- `docs/quality/redesign-phase-acceptance-template.md`
- `docs/templates/team-operating-model.md`
- `docs/templates/project-delivery-template.md`
- `docs/templates/spec-review-checklist.md`
- `docs/guides/roadmap.md`
- `docs/guides/master-delivery-plan.md`

## 13. 下一步执行建议

如果进入正式实施，推荐顺序：
1. 先做 Phase 0 + Phase 1 的最小代码切片
2. 同步补测试，不等待后补
3. 每完成一个阶段，更新验收报告
4. 等 Web core 边界稳定后，再开启跨平台 contract prototype

## 14. 交付口径

最终交付物应包括：
- 代码
- 架构文档
- 功能说明
- QA/验收报告
- Demo 验证结果
- 分阶段路线图与后续建议
