# Typex Source-First Embed Specification

来源：
- `docs/adr/ADR-004-source-first-diagram-and-embed-nodes.md`
- `docs/specs/canonical-document-model.md`

## 1. 目标

定义 Mermaid、draw.io XML、未来 diagram/embed block 的 source-first 存储策略。

## 2. 原则

- source 是唯一主存储
- preview 是派生结果
- preview 失败不影响 source 持久化
- export/import 必须优先保留 source

## 3. Mermaid

建议：
- `type: diagram`
- `attrs.engine = 'mermaid'`
- `source.format = 'text/mermaid'`

## 4. draw.io

建议：
- `type: embed`
- `attrs.kind = 'drawio'`
- `source.format = 'application/vnd.jgraph.mxfile+xml'`

## 5. 安全边界

- preview 渲染不得拥有比 source 更高的信任级别
- 外部资源加载必须受限
- script/event handler 不允许进入 preview 输出
