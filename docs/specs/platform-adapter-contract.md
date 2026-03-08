# Typex Platform Adapter Contract

来源：
- `docs/architecture/package-contract-matrix.md`
- `docs/architecture/runtime-event-pipeline.md`
- `docs/adr/ADR-003-platform-layer-bridges-host-capabilities-only.md`

## 1. 目标

本文定义所有 `platform-*` 实现必须遵守的宿主桥接合约。

## 2. 基本原则

- platform 只桥接 host 能力
- platform 不定义编辑语义
- platform 不直接改 canonical document
- platform 不直接 push history

## 3. HostBridge

```ts
interface HostBridge {
  mount(host: unknown, runtime: EditorRuntime): void
  unmount(): void
  focus(): void
  blur(): void
  scrollIntoView(target: unknown): void
  setEditable(editable: boolean): void
}
```

## 4. RenderBridge

```ts
interface RenderBridge {
  render(plan: RenderPlan): void
  destroyRenderTree(): void
}
```

## 5. SelectionBridge

```ts
interface SelectionBridge {
  readSelection(): HostSelection | null
  writeSelection(selection: SelectionSnapshot): void
  onSelectionChange(listener: (selection: HostSelection | null) => void): () => void
}
```

## 6. InputBridge

```ts
interface InputBridge {
  onTextInput(listener: (event: unknown) => void): () => void
  onKeyInput(listener: (event: unknown) => void): () => void
  onComposition(listener: (event: unknown) => void): () => void
  onPaste(listener: (event: unknown) => void): () => void
  onDrop(listener: (event: unknown) => void): () => void
}
```

## 7. ClipboardBridge

```ts
interface ClipboardBridge {
  readClipboard(): Promise<unknown>
  writeClipboard(payload: unknown): Promise<void>
}
```

## 8. OverlayBridge

```ts
interface OverlayBridge {
  renderCarets(carets: CaretPlan[]): void
  renderOverlays(overlays: OverlayPlan[]): void
  clearOverlays(): void
}
```

## 9. PlatformAdapter

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

## 10. 生命周期要求

### mount
- 初始化宿主容器
- 建立 render tree root
- 绑定 input / pointer / selection / clipboard / composition

### steady-state
- 接收 RenderPlan
- 翻译 host event -> standardized intent
- 同步 host selection / caret / overlay

### destroy
- 解绑全部 listener
- 清理 composition / input session
- 清理 render tree 与 overlay

## 11. 错误传播

- platform 渲染错误不得污染 canonical state
- platform 错误应转为 diagnostics / runtime events
- 失败可重试，但不得绕过 dispatch 主链路

## 12. IME 职责边界

- platform 负责接收 composition 事件
- runtime 负责决定提交/回滚语义
- composition 的最终文档变更必须通过 transaction 完成

## 13. 验证要求

定稿前必须验证：
- Web 可按该合约实现
- Flutter/RN/Android/iOS 至少能按 contract 形成原型设计
- selection / input / clipboard / overlay 边界清晰，无语义泄漏
