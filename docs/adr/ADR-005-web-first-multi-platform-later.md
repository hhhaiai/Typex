# ADR-005 Web first, multi-platform later

## Status
Accepted

## Decision
采用 Web-first，Flutter / RN 后置 的推进顺序。

## Rationale
- 当前平台实现深度依赖 DOM / Selection / iframe input
- 短期先把 Web 做成正式平台，收益最大、风险最可控
- 多端扩展应建立在纯核心与清晰 platform contract 之上
