# Typex Canonical Schema Specification

来源：
- `docs/specs/canonical-document-model.md`
- `docs/architecture/target-architecture.md`
- `docs/adr/ADR-007-one-canonical-schema-many-syntax-adapters.md`

## 1. 目标

本文定义 Typex 的 canonical schema。schema 用于约束：
- 允许的 node / mark 类型
- attrs 结构
- 父子关系
- 内容约束
- capability lookup
- 扩展方式

## 2. 基本原则

- 只有一份 canonical schema
- 各种 syntax adapter 必须映射到这份 schema
- schema 约束语义，不约束宿主平台
- schema 不感知 DOM、UI、toolbar

## 3. NodeSpec

```ts
interface NodeSpec {
  type: string
  kind: 'block' | 'inline' | 'text' | 'embed'
  attrs?: Record<string, AttrSpec>
  allowedChildren?: string[]
  allowedMarks?: string[]
  isVoid?: boolean
  isContainer?: boolean
  normalize?: string[]
  capabilities?: string[]
}
```

## 4. MarkSpec

```ts
interface MarkSpec {
  type: string
  attrs?: Record<string, AttrSpec>
  appliesTo?: string[]
  excludes?: string[]
}
```

## 5. AttrSpec

```ts
interface AttrSpec {
  type: 'string' | 'number' | 'boolean' | 'enum' | 'json'
  required?: boolean
  default?: unknown
  values?: unknown[]
}
```

## 6. 核心约束

### 6.1 Document
- `document` 只能出现在根节点
- `document` 只能包含 block 节点

### 6.2 Block
- block 允许包含 block / inline / text / embed 的具体集合由各自 spec 决定
- block 结构必须保持语义合法

### 6.3 Text
- `text` 没有 children
- `text` 可带 marks

### 6.4 Embed
- embed 必须有 source-first 语义
- embed 是否 void 由 spec 定义

## 7. 推荐 capability 集

建议 capability 使用稳定关键词：
- `editable`
- `split`
- `merge`
- `wrap`
- `unwrap`
- `list-item`
- `table-cell`
- `code`
- `embed`
- `link-target`
- `diagram-source`

## 8. 首批标准 node spec 建议

- paragraph
- heading(level)
- blockquote
- bullet_list
- ordered_list
- list_item
- task_list
- task_item(checked)
- code_block(language)
- table
- table_row
- table_cell(colspan,rowspan)
- image(src,alt,title)
- link(href,title)
- diagram(engine)
- embed(kind)
- text

## 9. 首批标准 mark spec 建议

- bold
- italic
- underline
- strike
- code
- sub
- sup
- color(value)
- background(value)
- font_size(value)

## 10. 校验规则

schema 至少需要支持：
- `validateNode(node)`
- `validateDocument(doc)`
- `canContain(parent, child)`
- `canApplyMark(node, mark)`
- `getNodeCapabilities(type)`

## 11. 扩展规则

- 扩展 node / mark 必须通过注册进入 schema
- 自定义扩展不得覆盖核心保留类型
- 建议自定义类型使用命名空间，如 `vendor:callout`
- adapter 扩展必须声明其映射目标与 fallback 行为

## 12. 版本策略

- schema 版本与 document version 可以独立演进，但必须可映射
- 大版本 schema 变更必须附 migration 规则

## 13. 验证要求

定稿前必须验证：
- 所有核心 node / mark 都能映射到 canonical document model
- Markdown / HTML baseline 有清晰映射目标
- source-first embed 有合法 schema 表达
- selection / transaction / render plan 都能引用 schema capability
