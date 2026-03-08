# Typex Security And Sanitization Policy

## 1. 目标

定义 Markdown / HTML / paste / drop / embed 场景下的安全边界。

## 2. HTML 导入

必须：
- 去除 script
- 去除事件处理属性
- 去除危险协议
- 限制外部资源信任边界

## 3. Markdown 导入

- 内联 HTML 不应默认信任
- 需要走 HTML adapter 的 sanitization 规则

## 4. Embed / Preview

- source-first embed 的 preview 不得拥有更高信任权限
- draw.io / Mermaid preview 输出不能注入可执行脚本

## 5. Paste / Drop

- 必须按 mime/type 分类
- 不支持内容降级并产生 diagnostics
