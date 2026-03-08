# Typex Package Contract Matrix And Platform Adapter Interface Spec

来源：
- /Users/sanbo/Desktop/Typex/docs/architecture/target-architecture.md
- /Users/sanbo/Desktop/Typex/docs/adr/ADR-001-node-first-canonical-document-model.md
- /Users/sanbo/Desktop/Typex/docs/adr/ADR-002-parser-serializer-as-adapters.md
- /Users/sanbo/Desktop/Typex/docs/adr/ADR-003-platform-layer-bridges-host-capabilities-only.md
- /Users/sanbo/Desktop/Typex/docs/adr/ADR-004-source-first-diagram-and-embed-nodes.md
- /Users/sanbo/Desktop/Typex/docs/adr/ADR-005-web-first-multi-platform-later.md
- /Users/sanbo/Desktop/Typex/docs/adr/ADR-006-commands-compile-to-transactions.md
- /Users/sanbo/Desktop/Typex/docs/adr/ADR-007-one-canonical-schema-many-syntax-adapters.md

## 1. 目标

本文把目标架构进一步落成“包边界契约”。
重点明确：
- 每个 package 负责什么
- 对外公开哪些 API
- 允许依赖哪些层
- 禁止跨哪些边界
- 哪些层必须保持平台无关
- platform adapter 需要实现哪些宿主桥接接口

## 2. 总体依赖方向

统一依赖方向：

```text
apps / business integration
  -> @typex/editor-kit
    -> @typex/schema
    -> @typex/document
    -> @typex/transform
    -> @typex/render-core
    -> @typex/platform-*
    -> @typex/parser-* / @typex/serializer-*
```

约束：
- document / schema / transform / render-core 必须平台无关
- parser / serializer 是 syntax adapter，不进入 core
- platform-* 只能桥接宿主能力，不能定义编辑语义
- editor-kit 负责对外组装，不得把 demo 逻辑带入 core
- apps 不能直接依赖内部实现细节，只依赖公开 API

## 3. Package Contract Matrix

| Package | 状态 | 角色 | Public Entry | 公开 API | 允许依赖 | 禁止依赖 | Internal-only | 测试归属 | 平台无关要求 |
|---|---|---|---|---|---|---|---|---|---|
| @typex/document | target | canonical document model | `@typex/document` | node builders, document query helpers, selection snapshot structs, normalizeDocument | 无或极少量通用工具 | DOM, native selection, platform adapter, parser internals, toolbar/ui | normalization internals, path helpers | unit + schema integration | 必须 |
| @typex/schema | target | semantic schema + node/mark rules | `@typex/schema` | createSchema, node specs, mark specs, validation, capability lookup | @typex/document | platform, parser, serializer, app UI | validation internals | unit + adapter integration | 必须 |
| @typex/transform | target | operation/step/transaction/history/command compile | `@typex/transform` | apply, invert, transformSelection, createTransaction, history engine, command compiler | @typex/document, @typex/schema | DOM, host input, toolbar, app widgets | step internals, rollback helpers | unit + runtime integration | 必须 |
| @typex/render-core | target | render plan compiler | `@typex/render-core` | buildRenderPlan, diffRenderPlan, layout grouping hooks, node-to-render-token mapping | @typex/document, @typex/schema | DOM patch, browser events, native widgets | token grouping internals | unit + platform integration | 必须 |
| @typex/platform-web | target | web host bridge | `@typex/platform-web` | mount, unmount, bindEvents, selection bridge, IME bridge, clipboard bridge, overlay bridge, renderer target | @typex/render-core and lower shared contracts | markdown parser logic, semantic command rules, business toolbar semantics | DOM bridge details | integration + e2e | 不必须 |
| @typex/platform-flutter | future | flutter host bridge | `@typex/platform-flutter` | same contract as platform-web with Flutter host implementation | @typex/render-core and lower shared contracts | web DOM details, markdown grammar semantics | Flutter bridge details | contract + prototype | 不必须 |
| @typex/platform-rn | future | RN host bridge | `@typex/platform-rn` | same contract as platform-web with RN host implementation | @typex/render-core and lower shared contracts | web DOM details, markdown grammar semantics | RN bridge details | contract + prototype | 不必须 |
| @typex/platform-android | future | Android native host bridge | `@typex/platform-android` | same host contract | @typex/render-core and lower shared contracts | web/rn/flutter specifics, syntax semantics | Android bridge details | contract + prototype | 不必须 |
| @typex/platform-ios | future | iOS native host bridge | `@typex/platform-ios` | same host contract | @typex/render-core and lower shared contracts | web/rn/flutter specifics, syntax semantics | iOS bridge details | contract + prototype | 不必须 |
| @typex/parser-markdown | target | markdown -> canonical doc | `@typex/parser-markdown` | parse, parseFragment, diagnostics | @typex/document, @typex/schema | platform, editor UI, transaction/history internals beyond public contracts | tokenizer internals | adapter + roundtrip | 必须 |
| @typex/serializer-markdown | target | canonical doc -> markdown | `@typex/serializer-markdown` | serialize, serializeFragment, diagnostics | @typex/document, @typex/schema | platform, editor UI | formatting internals | adapter + roundtrip | 必须 |
| @typex/parser-html | target | html -> canonical doc | `@typex/parser-html` | parse, parseFragment | @typex/document, @typex/schema | platform | sanitization internals | adapter + security | 必须 |
| @typex/serializer-html | target | canonical doc -> html | `@typex/serializer-html` | serialize, serializeFragment | @typex/document, @typex/schema | platform | output internals | adapter + security | 必须 |
| @typex/adapter-drawio | target | special embed adapter | `@typex/adapter-drawio` | import/export draw.io source payloads, preview metadata mapping | @typex/document, @typex/schema | platform host code in core path | preview helpers | adapter + acceptance | 必须 |
| @typex/editor-kit | transitional -> target | public integration facade | `@typex/editor-kit` | createEditor, registerCommands, registerPlugins, setContent, getContent, execCommand, mount, destroy, events | all public packages via stable exports | package-private internals, demo-only code | runtime composition internals | api + integration + e2e | Mostly yes except chosen platform injection |
| apps/editor-demo | transitional | demo app | `apps/editor-demo` | demo entry only | @typex/editor-kit and public presets | direct imports from internal package internals | demo toolbar/wiring | smoke + e2e | 否 |

## 4. Layer Responsibilities In More Detail

### 4.1 @typex/document

职责：
- 定义 canonical document tree
- 定义 block / inline / text / embed / selection snapshot 的纯数据结构
- 提供不可变文档查询与基础归一化能力
- 作为 rich text 与 markdown 的共同中间表示

不负责：
- DOM
- 平台事件
- 工具栏
- Markdown 语法细节
- 渲染副作用

建议公开 API：
- createDocument()
- createNode()
- createText()
- createSelectionSnapshot()
- normalizeDocument()
- getNodeAtPath()
- visitDocument()
- mapDocument()

### 4.2 @typex/schema

职责：
- 定义节点类型、mark 类型、attrs、合法父子关系、内容约束
- 定义 paragraph / heading / list / quote / table / image / code_block / diagram / embed 等语义边界
- 提供 schema-level validation 与 capability lookup

不负责：
- 输入事件解释
- host bridge
- markdown tokenizer

建议公开 API：
- createSchema(spec)
- defineNodeSpec()
- defineMarkSpec()
- validateNode()
- canContain(parent, child)
- getNodeCapabilities(type)

### 4.3 @typex/transform

职责：
- 所有编辑变更统一表达为 operation / step / transaction
- command 统一编译为 transaction
- 支持 apply / invert / rebase / normalize
- 维护 selection transform 与 history

不负责：
- Web 键盘事件监听
- DOM selection 读取
- 渲染 patch

建议公开 API：
- createOperation()
- createTransaction()
- applyTransaction(document, transaction)
- invertTransaction(transaction)
- transformSelection(selection, transaction)
- createHistory()
- registerCommand(name, compiler)
- compileCommand(name, payload, context)

核心约束：
- toolbar、快捷键、外部 API、协同输入未来都必须先编译成 transaction
- 不允许出现“直接改 path / 直接改 component state”的旁路修改

### 4.4 @typex/render-core

职责：
- 将 canonical document + schema 编译为平台无关 render plan
- 输出 block/inline grouping、decorations、selection overlays 所需的中间描述
- 沉淀现有 Formater 的通用算法，但不做 DOM patch

不负责：
- DOM 节点创建
- Flutter Widget 构造
- RN View 创建

建议公开 API：
- buildRenderPlan(document, schema, viewState)
- diffRenderPlan(prevPlan, nextPlan)
- resolveRenderNode(node)
- buildOverlayPlan(selection, caretState)

### 4.5 @typex/platform-*

职责：
- 把宿主输入、选区、剪贴板、IME、滚动、overlay、渲染挂载桥接到 editor runtime
- 将 render plan 落地为具体 host view tree
- 把 host selection / input event 转换为 editor-kit 可消费的标准事件

不负责：
- 决定 paragraph/heading/table 的语义
- 直接实现 markdown 解析
- 直接修改 document 语义数据

建议公开 API：
- createPlatformAdapter()
- mount(host, runtime)
- unmount()
- updateRenderPlan(plan)
- readHostSelection()
- writeHostSelection(selection)
- bindInput(listener)
- bindClipboard(listener)
- bindComposition(listener)
- showCaret(caretPlan)
- showOverlay(overlayPlan)
- scrollIntoView(target)

### 4.6 parser-* / serializer-*

职责：
- syntax <-> canonical document 的双向映射
- 保持 CommonMark + GFM 为 baseline
- 老语法、扩展语法、wiki link、topic、Mermaid、draw.io 通过 adapter 承担

不负责：
- 事务系统
- 平台桥接
- UI 更新

特殊约束：
- Mermaid / draw.io 等特殊语法采用 source-first 存储
- 预览图、SVG、HTML 只属于派生结果，不能作为主存储

### 4.7 @typex/editor-kit

职责：
- 为业务与 demo 提供唯一推荐接入面
- 组装 schema + commands + parser/serializer + platform adapter
- 提供稳定 public API
- 管理 runtime lifecycle

不负责：
- 保存 demo toolbar 的内部实现细节到 core
- 重新定义 canonical model

建议公开 API：
- createEditor(options)
- editor.mount(host)
- editor.destroy()
- editor.getDocument()
- editor.setDocument(doc)
- editor.parse(input, format)
- editor.serialize(format)
- editor.execCommand(name, payload)
- editor.undo()
- editor.redo()
- editor.on(event, handler)
- editor.off(event, handler)

## 5. Platform-Agnostic Boundary

以下层必须 100% 保持平台无关：
- @typex/document
- @typex/schema
- @typex/transform
- @typex/render-core
- @typex/parser-*
- @typex/serializer-*
- special syntax adapters

判定标准：
- 不引用 DOM / document / window / Selection
- 不引用 Flutter / RN / Android / iOS host classes
- 不依赖 iframe input 或 browser composition event 类型
- 不在数据层触发 UI update

## 6. Platform Adapter Interface Spec

建议抽象为 HostBridge + RenderBridge + InputBridge 三组接口。

### 6.1 Core Types

```ts
interface EditorRuntime {
  getState(): EditorState
  dispatch(transaction: Transaction): DispatchResult
  dispatchCommand(name: string, payload?: unknown): DispatchResult
  updateView(viewState: ViewState): void
  emit(eventName: string, payload?: unknown): void
}

interface EditorState {
  document: TypexDocument
  selection: SelectionSnapshot
  schema: TypexSchema
  viewState: ViewState
  readOnly: boolean
}

interface RenderPlan {
  root: RenderNode
  overlays: OverlayPlan[]
  carets: CaretPlan[]
}
```

### 6.2 HostBridge

```ts
interface HostBridge {
  mount(host: unknown, runtime: EditorRuntime): void
  unmount(): void
  focus(): void
  blur(): void
  scrollIntoView(target: ScrollTarget): void
  setEditable(editable: boolean): void
}
```

### 6.3 RenderBridge

```ts
interface RenderBridge {
  render(plan: RenderPlan): void
  destroyRenderTree(): void
}
```

### 6.4 SelectionBridge

```ts
interface SelectionBridge {
  readSelection(): HostSelection | null
  writeSelection(selection: SelectionSnapshot): void
  onSelectionChange(listener: (selection: HostSelection | null) => void): Unsubscribe
}
```

### 6.5 InputBridge

```ts
interface InputBridge {
  onTextInput(listener: (event: TextInputEvent) => void): Unsubscribe
  onKeyInput(listener: (event: KeyInputEvent) => void): Unsubscribe
  onComposition(listener: (event: CompositionEvent) => void): Unsubscribe
  onPaste(listener: (event: PasteEvent) => void): Unsubscribe
  onDrop(listener: (event: DropEvent) => void): Unsubscribe
}
```

### 6.6 ClipboardBridge

```ts
interface ClipboardBridge {
  readClipboard(): Promise<ClipboardPayload | null>
  writeClipboard(payload: ClipboardPayload): Promise<void>
}
```

### 6.7 OverlayBridge

```ts
interface OverlayBridge {
  renderCarets(carets: CaretPlan[]): void
  renderOverlays(overlays: OverlayPlan[]): void
  clearOverlays(): void
}
```

### 6.8 PlatformAdapter

```ts
interface PlatformAdapter {
  host: HostBridge
  render: RenderBridge
  selection: SelectionBridge
  input: InputBridge
  clipboard?: ClipboardBridge
  overlay?: OverlayBridge
}
```

## 7. Standard Event Translation Rules

平台层只能做“宿主事件 -> 标准编辑事件”的翻译，不能直接改 document。

标准规则：
- host keydown / keypress / soft keyboard event -> command intent or input event
- host compositionstart/update/end -> composition event
- host selectionchange -> selection snapshot update request
- host paste -> parser pipeline request
- host drop -> attachment/import pipeline request

禁止：
- 在 platform-web 内直接调用业务 command handle 改文档
- 在 host bridge 内直接篡改 history
- 在 platform 层定义 heading/list/table 的编辑语义

## 8. Public API Boundary Rules

允许直接给业务使用的，只能来自：
- @typex/editor-kit
- 明确标记为 public 的 parser/serializer package
- 明确标记为 public 的 schema presets

不应直接暴露给业务：
- path 内部结构
- component 实例
- vdom patch 内部实现
- platform 私有 DOM bridge
- transaction 内部临时字段

## 9. Allowed Dependency Rules

### 9.1 Allowed
- @typex/schema -> @typex/document
- @typex/transform -> @typex/document, @typex/schema
- @typex/render-core -> @typex/document, @typex/schema
- @typex/platform-* -> @typex/render-core and shared public types
- @typex/parser-* -> @typex/document, @typex/schema
- @typex/serializer-* -> @typex/document, @typex/schema
- @typex/editor-kit -> all public packages
- apps -> @typex/editor-kit only

### 9.2 Forbidden
- document -> platform-*
- schema -> platform-*
- transform -> platform-*
- render-core -> platform-web DOM utilities
- parser-markdown -> platform-web
- serializer-markdown -> platform-web
- apps -> @typex-core private files / internal path/component/vdom modules
- platform-* -> editor demo toolbar implementation

## 10. Mapping From Current Repo To Target Packages

当前落点：
- /Users/sanbo/Desktop/Typex/packages/@typex-core/Typex.js:15 当前同时承担 runtime + render 入口
- /Users/sanbo/Desktop/Typex/packages/@typex-core/initCore.js:43-46 通过 pluginContext 直接触发平台拦截初始化
- /Users/sanbo/Desktop/Typex/packages/@typex-core/initCore.js:94-99 与 :153-162 直接读取平台 selection
- /Users/sanbo/Desktop/Typex/packages/@typex-platform/index.js:6-10 当前通过 install 把 web 注入 pluginContext
- /Users/sanbo/Desktop/Typex/packages/editor/index.js:100-157 当前混合 editor facade、toolbar、platform 注入、data 默认行为
- /Users/sanbo/Desktop/Typex/packages/editor/mount.js:29-31 当前挂载直接绑定 DOM patch

对应迁移方向：
- Typex runtime 拆向 @typex/editor-kit + @typex/transform + @typex/render-core
- pluginContext/platform 全局注入改为显式 PlatformAdapter 注入
- Formater 通用算法下沉至 @typex/render-core
- DOM patch 保留在 @typex/platform-web
- packages/editor 迁移为 @typex/editor-kit
- 当前 demo UI 拆到 apps/editor-demo

## 11. Rollout Constraints

Phase 0-1 必须先满足：
- 稳住 selection / transaction / history 测试基线
- get/set document API 稳定
- 明确 command -> transaction 单一路径

Phase 2 才能开始：
- render-core 抽离
- platform-web 正式化

Phase 3 才能开始：
- markdown/html parser + serializer baseline

Phase 4 才能开始：
- editor-kit 与 demo 分离

Phase 5 才能开始：
- Flutter / RN / Android / iOS contract prototype

## 12. Design Guardrails

必须长期坚持：
- 一个 canonical document model
- 一个 canonical schema
- 多 syntax adapters
- command 必须编译为 transaction
- platform 只桥接宿主能力
- source-first embed nodes
- web-first rollout，不提前做多端正式实现

## 13. Immediate Next Docs

完整设计包建议按以下优先级补齐：
1. canonical document model spec
2. canonical schema spec
3. selection snapshot spec
4. transaction / operation spec
5. render plan schema
6. platform adapter contract
7. editor-kit public API
8. package export surface
9. markdown / html adapter contract
10. migration / compatibility / performance / security / traceability 文档

---

Key rationale tied to current code:
- /Users/sanbo/Desktop/Typex/packages/@typex-core/initCore.js:43-46, :94-99, :153-162 shows the current platform leak into core.
- /Users/sanbo/Desktop/Typex/packages/@typex-platform/index.js:6-10 shows global web injection instead of explicit adapter contracts.
- /Users/sanbo/Desktop/Typex/packages/editor/index.js:100-157 and /Users/sanbo/Desktop/Typex/packages/editor/mount.js:29-31 show why editor facade and demo/platform concerns must split.
