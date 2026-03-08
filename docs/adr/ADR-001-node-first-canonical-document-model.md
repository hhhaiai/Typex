# ADR-001 Node-first canonical document model

## Status
Accepted

## Decision
采用 Node-first canonical document model。

## Rationale
- 为富文本与 Markdown 提供统一内部模型
- 避免把 DOM 结构当作事实来源
- 为后续 parser / serializer / 多端适配提供稳定边界
