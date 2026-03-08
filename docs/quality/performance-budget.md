# Typex Performance Budget

## 目标

完整设计阶段先定义预算，后续实现按预算验收。

## 预算建议

- 初次 mount：应维持可感知即时响应
- 单字符输入：不得出现明显卡顿
- undo / redo：普通文档下应快速完成
- selection update：拖选与多光标操作应平滑
- parse / serialize：baseline markdown/html 在常见文档规模下应可接受
- 大文档：需要建立单独性能基线样本

## 测量点

- mount
- typing
- selection update
- undo/redo
- parse markdown
- serialize markdown
- render plan rebuild
