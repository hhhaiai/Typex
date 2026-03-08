# ADR-002 Parser and serializer as adapters

## Status
Accepted

## Decision
Parser / Serializer 作为 adapter，不进入 core。

## Rationale
- 让 CommonMark / GFM / 历史 Markdown 方言扩展不污染核心模型
- 保持 core 聚焦 canonical model、transform、history、render-core
