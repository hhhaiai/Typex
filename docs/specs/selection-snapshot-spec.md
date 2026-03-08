# Typex Selection Snapshot Specification

来源：
- `docs/architecture/runtime-event-pipeline.md`
- `docs/specs/canonical-document-model.md`
- `docs/architecture/package-contract-matrix.md`

## 1. 目标

本文定义平台无关的 SelectionSnapshot，用于替代浏览器 Selection / Range 或当前 Path/DOM 绑定的选区表达。

## 2. 设计原则

- 与 DOM 无关
- 与平台无关
- 可序列化
- 可参与 transaction transform
- 可用于 undo / redo / restore
- 支持单选区与多选区

## 3. 结构

```ts
interface SelectionPoint {
  path: number[]
  offset: number
}

interface SelectionRange {
  anchor: SelectionPoint
  focus: SelectionPoint
  direction?: 'forward' | 'backward' | 'none'
  affinity?: 'upstream' | 'downstream' | 'none'
}

interface SelectionSnapshot {
  ranges: SelectionRange[]
  activeIndex?: number
}
```

## 4. 规则

- `path` 使用 canonical NodePath
- `offset` 相对于目标节点内容位置
- collapsed range 由 `anchor == focus` 表示
- `ranges` 可为多选区数组
- `activeIndex` 表示当前主选区

## 5. 单选区与多选区

### 5.1 单选区
- `ranges.length === 1`
- 最常见场景

### 5.2 多选区
- `ranges.length > 1`
- 用于多光标/多选区编辑
- runtime 必须定义去重、合并、排序策略

## 6. 规范化

SelectionSnapshot normalize 后必须满足：
- ranges 非空时 activeIndex 合法
- path 必须能解析到合法节点
- offset 不得越界
- 重叠范围按策略合并或排序
- 无效 range 必须被修复或丢弃并记录 diagnostics

## 7. transform 行为

transaction 作用后必须能：
- transform range points
- 保持 collapsed/caret 语义
- 避免悬空 path
- 在节点删除、合并、拆分后恢复到最近合法位置

## 8. host 映射

- SelectionBridge 负责 host selection <-> SelectionSnapshot 转换
- canonical snapshot 不直接引用 host selection
- host-specific affinity/IME 细节不得泄漏到 snapshot 基础结构

## 9. undo / redo

- history 恢复必须基于 SelectionSnapshot
- undo / redo 不允许依赖 DOM state 作为唯一真相

## 10. API 建议

- `createSelectionSnapshot()`
- `normalizeSelectionSnapshot()`
- `transformSelectionSnapshot(snapshot, transaction)`
- `compareSelectionSnapshot(a, b)`

## 11. 验证要求

定稿前必须验证：
- 单光标
- 范围选择
- 多选区
- 节点删除后的恢复
- split / merge 后的恢复
- undo / redo 恢复
- 选区可脱离 DOM 独立存在
