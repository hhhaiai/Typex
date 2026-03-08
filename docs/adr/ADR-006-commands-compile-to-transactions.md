# ADR-006 Commands compile to transactions

## Status
Accepted

## Decision
所有 command 都必须编译为 transaction / operation。

## Rationale
- 保证命令系统与历史记录、撤销重做、选区变换走统一路径
- 避免 toolbar、快捷键、外部 API 各自形成分散副作用链路
