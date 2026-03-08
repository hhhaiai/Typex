# ADR-007 One canonical schema, many syntax adapters

## Status
Accepted

## Decision
采用一个 canonical schema，对应多个 syntax adapters。

## Rationale
- 保持内部语义统一
- 允许 Markdown、HTML、wiki link、topic 等语法通过 adapter 映射到统一模型
- 降低不同语法之间的耦合与污染
