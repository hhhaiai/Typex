# Typex Runtime Lifecycle And Event-To-Command-To-Transaction Pipeline

来源：
- /Users/sanbo/Desktop/Typex/docs/architecture/target-architecture.md
- /Users/sanbo/Desktop/Typex/docs/architecture/package-contract-matrix.md
- /Users/sanbo/Desktop/Typex/docs/guides/usage-and-call-flow.md
- /Users/sanbo/Desktop/Typex/docs/adr/ADR-003-platform-layer-bridges-host-capabilities-only.md
- /Users/sanbo/Desktop/Typex/docs/adr/ADR-005-web-first-multi-platform-later.md
- /Users/sanbo/Desktop/Typex/docs/adr/ADR-006-commands-compile-to-transactions.md

当前代码参考：
- /Users/sanbo/Desktop/Typex/packages/@typex-core/Typex.js:15
- /Users/sanbo/Desktop/Typex/packages/@typex-core/initCore.js:27
- /Users/sanbo/Desktop/Typex/packages/@typex-core/transform/transaction.js:35
- /Users/sanbo/Desktop/Typex/packages/@typex-core/history/index.js:20
- /Users/sanbo/Desktop/Typex/packages/@typex-core/selection/index.js:284
- /Users/sanbo/Desktop/Typex/packages/@typex-platform/web/intercept/index.js:10
- /Users/sanbo/Desktop/Typex/packages/@typex-platform/web/intercept/keyboardIntercept.js:47
- /Users/sanbo/Desktop/Typex/packages/@typex-platform/web/intercept/mouseIntercept.js:23

## 1. 目标

本文定义 Typex 目标态运行时生命周期，以及从宿主事件到 command，再到 transaction、history、selection、render plan、platform bridge 的完整链路。

本文需要与以下规范保持一致：
- `docs/specs/selection-snapshot-spec.md`
- `docs/specs/transaction-and-operation-spec.md`
- `docs/specs/render-plan-schema.md`
- `docs/specs/platform-adapter-contract.md`
- `docs/api/editor-kit-public-api.md`
- `docs/quality/security-and-sanitization-policy.md`
- `docs/quality/traceability-matrix.md`

核心原则：
- platform 只翻译宿主能力，不定义编辑语义
- command 必须统一编译为 transaction
- transaction 是唯一文档变更入口
- history 与 selection 必须依附 transaction 更新
- render plan 刷新来自 state 变化，而不是来自宿主事件本身
- Web 是第一正式平台，但运行时契约必须为 Flutter / RN / Android / iOS 预留同一条主链路

## 2. Runtime High-Level Lifecycle

目标态生命周期：

```text
createEditor(options)
  -> build schema / command registry / parser+serializer registry
  -> create EditorRuntime
  -> inject PlatformAdapter
  -> initialize empty state or initial document
  -> build initial RenderPlan
  -> mount(host)
  -> bind host events
  -> enter steady-state dispatch loop
```

steady-state 下所有变化走统一链路：

```text
Host event / API call / Toolbar action
  -> normalize to command intent or direct transaction request
  -> compile command to transaction
  -> dispatch transaction
  -> apply document change
  -> update selection snapshot
  -> push history
  -> rebuild render plan
  -> platform render / overlay refresh
  -> emit runtime events
```

## 3. Runtime Roles

### 3.1 EditorRuntime

EditorRuntime 是唯一可信调度中心，负责：
- 持有 EditorState
- 持有 command registry
- 接收 host event translation 结果
- 将 command 编译为 transaction
- 分发 transaction
- 协调 history / selection / render-core / platform adapter
- 对外发出 lifecycle events

不负责：
- 直接监听 DOM / native host 事件
- 直接实现 markdown parse / serialize 细节
- 持有业务工具栏 UI

### 3.2 PlatformAdapter

PlatformAdapter 只负责：
- 挂载宿主
- 监听宿主事件
- 读取 / 写入宿主选区
- 处理输入法、剪贴板、drop、overlay
- 将 render plan 落地到宿主视图树

不负责：
- 直接改文档
- 直接 push history
- 直接定义 heading/list/table 的编辑行为

### 3.3 Transform Layer

Transform 层负责：
- 把 command intent 编译成 transaction
- apply / invert transaction
- 更新 selection snapshot
- 维护 history

### 3.4 Render Core

Render Core 负责：
- 根据最新 document + schema + viewState 输出 RenderPlan
- 输出 caret / selection / decoration / overlay 所需中间结果

## 4. Canonical Pipeline

### 4.1 Source Inputs

运行时允许的输入源只有三类：
1. 宿主事件
2. 外部 API 调用
3. 初始化与恢复动作

它们都不能直接写 document，必须先归一化。

### 4.2 Normalized Intents

所有输入归一化为以下两种之一：
- CommandIntent
- TransactionRequest

建议：
- 普通业务能力优先走 CommandIntent
- 仅 framework/internal 恢复、协同回放、导入修复这类场景可走 TransactionRequest

```ts
interface CommandIntent {
  name: string
  payload?: unknown
  source: 'keyboard' | 'mouse' | 'toolbar' | 'api' | 'clipboard' | 'drop' | 'system'
}

interface TransactionRequest {
  transaction: Transaction
  source: 'api' | 'system' | 'collab' | 'history'
}
```

## 5. Host Event Translation

目标态要求 platform 层只做翻译，不做语义决策。

### 5.1 Keyboard Events

宿主输入分两类：
- text input / IME composition
- non-text key intent

翻译规则：
- 可打印文本 -> insertText command intent
- Backspace/Delete -> deleteBackward / deleteForward command intent
- Enter -> insertBreak command intent
- Tab / Shift+Tab -> indent / outdent command intent
- Mod+B / Mod+I 等 -> toggleMark command intent
- Mod+Z / Mod+Shift+Z -> undo / redo command intent
- Arrow keys -> moveSelection command intent

当前代码参考：
- /Users/sanbo/Desktop/Typex/packages/@typex-platform/web/intercept/keyboardIntercept.js:47-60 当前直接把 input / keydown / keyup 发为 `keyboardEvents`
- /Users/sanbo/Desktop/Typex/packages/@typex-core/initCore.js:104-149 当前在 core 内区分 input 与其他键盘事件

目标态调整：
- platform-web 不再发原始 `keyboardEvents` 给 core 去猜语义
- platform-web 应先翻译为标准 InputEvent 或 CommandIntent
- runtime 再统一编译为 transaction

### 5.2 Composition / IME Events

IME 是高风险区域，必须单独定义链路。

规则：
- compositionstart -> runtime 进入 composing state
- compositionupdate / input -> 更新 pending composition text
- compositionend -> 产出最终 insertText / replaceComposition command intent
- blur during composition -> platform 标记 canceled，runtime 决定是否回滚或提交最后稳定文本

当前代码参考：
- /Users/sanbo/Desktop/Typex/packages/@typex-core/initCore.js:206-245 当前 composition 状态由 core 中的 inputState 管理

目标态要求：
- composition 临时状态属于 platform input bridge + runtime input session
- 不应依赖全局 pluginContext
- composition 的最终文档变更仍必须落到 transaction

### 5.3 Mouse / Pointer / Selection Events

规则：
- pointer down / up / drag 只负责选区意图
- platform 读取宿主选区
- platform 将宿主选区翻译成 HostSelection
- runtime 将 HostSelection 转为 SelectionSnapshot
- 若为点击导致折叠、扩展、多光标追加，则统一走 selection update 流程

当前代码参考：
- /Users/sanbo/Desktop/Typex/packages/@typex-platform/web/intercept/mouseIntercept.js:23-40
- /Users/sanbo/Desktop/Typex/packages/@typex-core/selection/index.js:284-297

目标态要求：
- 选区同步由 SelectionBridge 负责读写宿主
- runtime 维护 canonical SelectionSnapshot
- 多光标策略由 runtime/selection policy 决定，不由平台私有逻辑决定

### 5.4 Clipboard / Paste Events

规则：
- paste event -> ClipboardPayload
- runtime 根据 mime/type 与 schema capability 选择 parser
- parser 输出 canonical document fragment
- runtime 生成 insertFragment command intent
- command 编译为 transaction

### 5.5 Drop / Attachment Events

规则：
- drop / file input -> import intent
- 由 adapter 或业务 integration 决定是 text/html/markdown/embed/file
- 转换为 canonical fragment 或 source-first embed node
- 再编译为 transaction

## 6. Command Compilation

根据 ADR-006，所有 command 必须编译为 transaction。

### 6.1 Command Pipeline

```text
CommandIntent
  -> command registry lookup
  -> validate against schema + selection + editor state
  -> compile to Transaction
  -> dispatch(Transaction)
```

### 6.2 Command Compiler Responsibilities

command compiler 负责：
- 读取当前 selection snapshot
- 校验 schema capability
- 生成 step / operation 列表
- 生成 next selection snapshot strategy
- 标注 metadata（source, analytics, undo boundary, composition info）

不负责：
- 直接操作宿主 DOM
- 直接更新 render tree

### 6.3 Examples

- insertText -> replace selected range if needed + insert text step + move caret
- toggleMark -> split boundaries if needed + apply mark step + preserve or transform selection
- undo -> history produces inverse transaction
- pasteMarkdown -> parser-markdown -> insertFragment transaction

## 7. Transaction Dispatch

### 7.1 Dispatch Steps

目标态 dispatch 顺序：

```text
dispatch(transaction)
  -> validate transaction against schema/document invariants
  -> capture prev state snapshot
  -> apply transaction to document
  -> transform/resolve selection snapshot
  -> commit history entry if undoable
  -> rebuild render plan
  -> ask platform adapter to render
  -> sync host selection and overlays
  -> emit post-dispatch events
```

### 7.2 Required Guarantees

dispatch 必须保证：
- 原子性：一次 dispatch 对外只暴露一个稳定新状态
- 顺序性：transaction 按提交顺序生效
- 可撤销性：undoable transaction 必须能 invert
- 选区一致性：document 变化后 selection 不得悬空
- 平台隔离：platform 渲染失败不能污染 canonical state

### 7.3 Current Code Reference

当前事务原型：
- /Users/sanbo/Desktop/Typex/packages/@typex-core/transform/transaction.js:74-80 `commit()` 记录 endRanges 并 push history
- /Users/sanbo/Desktop/Typex/packages/@typex-core/transform/transaction.js:86-108 `apply()` / `rollback()` 通过 step 正向或逆向执行

目标态调整：
- commit 不应只是 history push
- dispatch 应成为唯一提交边界
- selection、history、render refresh 应统一在 dispatch 结束时完成

## 8. History Update Rules

history 只能由 dispatch 统一维护。

### 8.1 Push Rules

满足以下条件的 transaction 才进入 undo stack：
- transaction.undoable !== false
- transaction 实际改变 document 或 selection policy要求记录
- 不是纯渲染刷新动作

### 8.2 Undo / Redo

undo / redo 流程：

```text
undo intent
  -> history.pop current entry
  -> obtain inverse transaction or stored rollback transaction
  -> dispatch(inverse transaction, source=history)
```

当前代码参考：
- /Users/sanbo/Desktop/Typex/packages/@typex-core/history/index.js:20-45

目标态要求：
- history 不直接操作宿主
- undo/redo 仍走 dispatch，而不是旁路 apply/rollback
- 这样 render/selection/event 发射路径保持一致

## 9. Selection Update Rules

selection 是 canonical state 的一部分，不是 DOM 的附属缓存。

### 9.1 Selection Sources

selection 的更新来源：
- host selection change
- transaction transform
- explicit API call like setSelection()
- undo/redo recovery

### 9.2 Update Order

推荐顺序：
1. dispatch 前读取当前 canonical selection
2. transaction 应用时生成 next selection snapshot
3. render plan 基于 next selection snapshot 生成 caret/overlay plan
4. render 完成后由 SelectionBridge 写回宿主选区

### 9.3 Current Code Reference

当前选区同步链路：
- /Users/sanbo/Desktop/Typex/packages/@typex-core/selection/index.js:284-297 `updateRangesFromNative()` 通过异步宏任务从 nativeSelection 同步
- /Users/sanbo/Desktop/Typex/packages/@typex-core/selection/index.js:451-463 `recoverRangesFromSnapshot()` 从快照恢复

目标态调整：
- `SelectionSnapshot` 应脱离 Path/DOM 实体引用
- runtime 使用纯数据快照
- SelectionBridge 负责 snapshot <-> host selection 转换

## 10. Render Plan Refresh

render plan refresh 只能由 state change 驱动。

### 10.1 Trigger Conditions

以下变化需要刷新 render plan：
- document changed
- selection visualization changed
- decoration changed
- viewState changed
- readOnly / focus state changed

### 10.2 Pipeline

```text
prev EditorState + next EditorState
  -> render-core.buildRenderPlan(next)
  -> diffRenderPlan(prevPlan, nextPlan)
  -> platform.render(diff or nextPlan)
  -> platform.overlay.renderCarets/renderOverlays
```

### 10.3 Current Code Reference

当前渲染逻辑耦合在 Formater：
- /Users/sanbo/Desktop/Typex/packages/@typex-core/model/formater.js:41-50 `render()`
- /Users/sanbo/Desktop/Typex/packages/@typex-core/model/formater.js:95-184 `_generateGroups()`

目标态要求：
- grouping / render token 生成下沉到 @typex/render-core
- DOM patch 留在 platform-web
- Flutter/RN/native 只消费 RenderPlan，不共享 DOM 细节

## 11. Platform Bridge Responsibilities By Stage

### 11.1 During mount

platform adapter 负责：
- mount host container
- 初始化 render tree root
- 绑定 keyboard / pointer / selection / clipboard / composition listeners
- 建立 focus / blur / scroll hooks

### 11.2 During steady-state input

platform adapter 负责：
- 接受新的 RenderPlan 并渲染
- 读取宿主选区
- 同步宿主 caret / overlay
- 转发标准化宿主事件

### 11.3 During destroy

platform adapter 负责：
- 解绑所有 listener
- 清理 input session / composition session
- 清理 overlays / carets / render tree

当前代码参考：
- /Users/sanbo/Desktop/Typex/packages/@typex-platform/web/intercept/index.js:10-18 当前 destroy 时清理 keyboardIntercept 和 mouseProxy

## 12. Suggested Runtime Interfaces

```ts
interface EditorRuntime {
  mount(host: unknown): void
  destroy(): void
  getState(): EditorState
  dispatch(transaction: TransactionRequest): DispatchResult
  dispatchCommand(intent: CommandIntent): DispatchResult
  setSelection(selection: SelectionSnapshot): void
  parse(input: string, format: string): TypexDocument
  serialize(format: string): string
}
```

```ts
interface DispatchResult {
  changed: boolean
  state: EditorState
  transaction?: Transaction
  diagnostics?: RuntimeDiagnostic[]
}
```

```ts
interface Transaction {
  steps: Step[]
  metadata?: {
    source?: string
    undoable?: boolean
    composition?: boolean
    selectionPolicy?: 'transform' | 'preserve' | 'replace'
  }
}
```

## 13. Steady-State Sequence Diagram

```text
Platform host event
  -> PlatformAdapter translates to CommandIntent
  -> EditorRuntime.dispatchCommand(intent)
  -> CommandCompiler.compile(intent, state)
  -> Transaction
  -> EditorRuntime.dispatch(transaction)
  -> Transform.apply(transaction)
  -> SelectionResolver.computeNextSelection()
  -> History.commit(transaction)
  -> RenderCore.buildRenderPlan(nextState)
  -> PlatformAdapter.render(plan)
  -> PlatformAdapter.selection.writeSelection(nextSelection)
  -> PlatformAdapter.overlay.renderCarets/renderOverlays
  -> Runtime emits change/update events
```

## 14. Non-Negotiable Rules

必须坚持：
- 宿主事件不能直接改 document
- command 必须编译为 transaction
- undo/redo 必须重新走 dispatch
- selection 必须是 canonical state，不是 DOM 附庸
- render refresh 必须由 state change 触发
- platform 只负责 bridge，不定义语义

## 15. Mapping From Current Code To Target Runtime

当前：
- platform-web 把原始 input/keydown/mouse 事件直接发给 core
- core 在 /Users/sanbo/Desktop/Typex/packages/@typex-core/initCore.js:87-189 内同时处理输入、事务、选区、撤销重做、blur 组合输入取消
- transaction 既承担步骤容器，也承担部分提交时机
- history 直接调用 apply/rollback
- selection 直接依赖 nativeSelection
- Formater 直接耦合 VDOM 生成

目标：
- platform-web 只做 host event translation
- runtime 拥有统一 dispatch loop
- command compiler 统一生成 transaction
- history 回放仍走 dispatch
- selection 改为纯 snapshot + selection bridge
- render-core 产出平台无关 RenderPlan
- platform adapter 消费 RenderPlan 并同步宿主 UI

## 16. Recommended Next Work

在本文之后，完整设计包应优先补：
1. canonical document model / schema spec
2. selection snapshot spec
3. transaction and operation spec
4. render plan schema
5. platform adapter contract
6. editor-kit public API / package export surface
7. markdown / html adapter contract
8. migration / compatibility / performance / security / traceability 文档

## 17. Runtime Design Gate

正式进入运行时代码改造前，必须先确认：
- SelectionSnapshot 已有独立规范
- transaction metadata 已有独立规范
- RenderPlan 已有独立规范
- platform adapter 生命周期、错误传播、IME 责任边界已定稿
- paste / drop / import 的安全策略已定稿
- 关键链路已在 traceability matrix 中映射到测试层和验收层
