# Typex Transaction And Operation Specification

来源：
- `docs/architecture/runtime-event-pipeline.md`
- `docs/architecture/package-contract-matrix.md`
- `docs/adr/ADR-006-commands-compile-to-transactions.md`

## 1. 目标

本文定义 Typex 的 operation / step / transaction 结构与元数据规则，确保 command -> transaction -> dispatch 是唯一变更路径。

## 2. 分层

- Operation：最小语义变更单元
- Step：可执行、可逆、可组合的实现级变更单元
- Transaction：一次原子编辑提交

## 3. Operation

```ts
interface Operation {
  type: string
  targetPath?: number[]
  payload?: Record<string, unknown>
}
```

## 4. Step

```ts
interface Step {
  type: string
  apply(document: TypexDocument): TypexDocument
  invert(document: TypexDocument): Step
}
```

## 5. Transaction

```ts
interface Transaction {
  steps: Step[]
  metadata?: {
    source?: 'keyboard' | 'mouse' | 'toolbar' | 'api' | 'clipboard' | 'drop' | 'system' | 'history' | 'collab'
    undoable?: boolean
    composition?: boolean
    selectionPolicy?: 'transform' | 'preserve' | 'replace'
    diagnostics?: string[]
  }
}
```

## 6. 规则

- transaction 是唯一提交边界
- dispatch 前必须验证 transaction
- history 只接受 transaction
- undo / redo 必须重走 dispatch
- 非 transaction 方式不得直接改 document

## 7. Command 编译

command compiler 负责：
- 读取 state + schema + selection
- 输出合法 transaction
- 写入 metadata
- 明确 selectionPolicy

## 8. History 规则

可入栈条件：
- `undoable !== false`
- 实际产生文档或选区语义变更
- 不是纯 UI 刷新

## 9. Diagnostics

transaction / operation 应支持：
- validation diagnostics
- unsupported diagnostics
- lossy conversion diagnostics

## 10. 验证要求

定稿前必须验证：
- insert / delete / format / split / merge 可表达
- undo / redo 可逆
- selectionPolicy 能覆盖常见场景
- parser/import/paste/drop 场景可携带 source metadata
