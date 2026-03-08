# Typex Render Plan Schema

来源：
- `docs/architecture/runtime-event-pipeline.md`
- `docs/architecture/package-contract-matrix.md`
- `docs/specs/canonical-document-model.md`

## 1. 目标

本文定义平台无关的 RenderPlan。render-core 只产出 RenderPlan，platform-* 负责把它落地到具体宿主视图树。

## 2. 设计原则

- 与 DOM 无关
- 与 Flutter/RN/原生视图无关
- 能表达 block / inline grouping、decorations、overlay、caret
- 支持 diff 或最小刷新

## 3. 结构

```ts
interface RenderNode {
  id: string
  type: string
  path?: number[]
  attrs?: Record<string, unknown>
  children?: RenderNode[]
}

interface CaretPlan {
  id: string
  rangeIndex: number
  path: number[]
  offset: number
}

interface OverlayPlan {
  id: string
  type: string
  ranges: Array<{ path: number[]; start: number; end: number }>
}

interface RenderPlan {
  root: RenderNode
  carets: CaretPlan[]
  overlays: OverlayPlan[]
}
```

## 4. 规则

- RenderPlan 只表达“要渲染什么”，不表达“如何用 DOM/Widget 渲染”
- `id` 必须稳定，以支持 diff
- `path` 必须可回溯到 canonical document
- platform 不得从 RenderPlan 反推文档语义并进行写操作

## 5. Diff 约束

`diffRenderPlan(prev, next)` 至少需要支持：
- node replace
- attrs update
- child insert/delete/move
- overlay update
- caret update

## 6. Overlay 与 Caret

- overlay / caret 是 render plan 的一部分
- 但具体可视实现由 platform adapter 决定
- render-core 负责提供语义位置，不负责具体像素样式

## 7. 验证要求

定稿前必须验证：
- 支持 paragraph / heading / list / table / image / embed 的基础输出
- 支持多选区 caret / overlay 输出
- 支持 render diff 最小刷新
- Web 平台可消费，未来 Flutter/RN 也可消费
