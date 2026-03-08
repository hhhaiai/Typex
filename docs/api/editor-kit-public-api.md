# Typex Editor-Kit Public API

来源：
- `docs/architecture/target-architecture.md`
- `docs/architecture/package-contract-matrix.md`
- `docs/architecture/runtime-event-pipeline.md`

## 1. 目标

本文定义 `@typex/editor-kit` 的唯一推荐业务接入面。业务侧、demo、测试站点都应优先依赖该层，而不是直接依赖内部 path / platform / vdom 实现。

## 2. createEditor

```ts
interface CreateEditorOptions {
  document?: TypexDocument
  value?: string
  format?: 'canonical-json' | 'markdown' | 'html'
  schema?: TypexSchema
  platform?: PlatformAdapter
  readOnly?: boolean
  commands?: Record<string, unknown>
  plugins?: unknown[]
}
```

规则：
- `document` 是 canonical 输入
- `value + format` 用于 adapter 驱动初始化
- `platform` 必须显式注入，避免全局 platform 泄漏
- `schema` 未传时使用默认 schema preset

## 3. Editor 实例

```ts
interface EditorKitInstance {
  mount(host: unknown): void
  destroy(): void
  getDocument(): TypexDocument
  setDocument(document: TypexDocument): void
  getValue(format?: 'canonical-json' | 'markdown' | 'html'): unknown
  setValue(value: unknown, format?: 'canonical-json' | 'markdown' | 'html'): void
  parse(input: string, format: 'markdown' | 'html'): TypexDocument
  serialize(format: 'markdown' | 'html' | 'canonical-json'): string | TypexDocument
  execCommand(name: string, payload?: unknown): DispatchResult
  registerCommand(name: string, compiler: unknown): void
  on(eventName: string, handler: (payload?: unknown) => void): void
  off(eventName: string, handler: (payload?: unknown) => void): void
  focus(selection?: SelectionSnapshot): void
  blur(): void
  setReadOnly(readOnly: boolean): void
  getSelection(): SelectionSnapshot
  setSelection(selection: SelectionSnapshot): void
}
```

## 4. 事件

建议稳定事件：
- `ready`
- `change`
- `selectionChange`
- `focus`
- `blur`
- `diagnostic`
- `destroy`

## 5. 错误与诊断

- 非法 document 输入：抛出 validation error
- 有损 adapter 转换：返回 diagnostics
- platform 渲染失败：发出 diagnostic，不污染 canonical state

## 6. 非 public API

以下内容不得作为公开 API：
- Path 类与内部 path 实例
- VDOM patch 细节
- DOM bridge 私有对象
- transaction 临时字段
- platform 全局注入对象

## 7. 测试站点使用建议

测试站点建议：
- 左侧输入源支持 markdown 文本与 rich-text editor 两种模式
- 右侧统一通过 `getDocument()` 或 `serialize()` 驱动预览
- 预览渲染不得直接依赖内部 path/component 实例
