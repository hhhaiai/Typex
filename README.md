#### 在线入口

- 当前正式版本：`v2.0`
- Demo 与集成说明首页：`https://hhhaiai.github.io/Typex/`
- API 文档：`https://hhhaiai.github.io/Typex/api/`
- Release 下载：`https://github.com/hhhaiai/Typex/releases/tag/v2.0`

## SDK 使用

Typex 当前正式交付形态为 `JS SDK`，推荐优先使用压缩版 `typex-editor.min.js`。

- npm 包入口：`packages/editor/dist/typex-editor.js`
- 浏览器压缩版：`packages/editor/dist/typex-editor.min.js`
- 内核包：`packages/@typex-core/dist/typex-core(.min).js`
- 平台包：`packages/@typex-platform/dist/typex-platform(.min).js`

### 浏览器直接引用

```html
<script src="./typex-editor-v2.0.min.js"></script>
<script>
  const editor = window.TypexEditor({ data: 'hello world' })
  editor.setToolBar(['undo', 'redo', 'bold']).mount('editor-root')
</script>
```

### 工程内引用

```js
import createEditor from 'editor'

const editor = createEditor({
  data: 'hello world',
})

editor.setToolBar(['undo', 'redo', 'bold']).mount('editor-root')
```

## 特点
- 不依赖contentEditable；不依赖document.execCommand
- 自绘光标、模拟输入，支持多光标；可自定义各个组件的光标和输入行为
- 组件化、状态驱动、自建数据模型;高性能、高拓展性、高可控
- 跨平台设计:内核和平台相关代码分离，通过平台插件注入
## 目录结构
```js
packages 包
├─editor 编辑器应用 
|   ├─babel.config.js
|   ├─data.js mock 数据
|   ├─index.js
|   ├─mount.js
|   ├─package.json
|   ├─toolBar 工具栏
|   |    ├─iconfont.js
|   |    ├─index.js
|   |    ├─toolBarOptions.js
|   |    ├─compinents
|   |    |     ├─Dialog.js
|   |    |     ├─DialogContent.js
|   |    |     ├─index.js
|   |    |     ├─toolBar.styl
|   |    |     ├─Tooltip.js
|   |    |     ├─colorPicker
|   |    |     |      ├─controlPanel.js
|   |    |     |      ├─index.js
|   |    |     |      ├─palette.js
|   |    |     |      └utils.js
|   ├─formats 定义格式
|   |    ├─index.js
|   |    ├─components 自定义格式组件
|   |    |     ├─block.js
|   |    |     ├─Header.js
|   |    |     ├─Image.js
|   |    |     ├─index.js
|   |    |     ├─Inline.js
|   |    |     ├─Paragraph.js
|   |    |     ├─Root.js
|   |    |     ├─Static.js
|   |    |     └Table.js
├─babel-plugin-transform-typex-jsx typex的jsx babel插件
|                ├─index.js
|                └package.json
├─@typex-platform 平台相关代码
|        ├─coreContext.js
|        ├─index.js
|        ├─package.json
|        ├─web web平台
|        |  ├─caret.js 光标实现
|        |  ├─createElm.js 创建dom
|        |  ├─dom.js
|        |  ├─index.js
|        |  ├─utils.js
|        |  ├─updateProps 处理dom属性更新
|        |  |      ├─index.js
|        |  |      ├─modules
|        |  |      |    ├─attributes.js
|        |  |      |    ├─classes.js
|        |  |      |    ├─listeners.js
|        |  |      |    └styles.js
|        |  ├─intercept 拦截器 拦截键盘鼠标事件
|        |  |     ├─index.js
|        |  |     ├─keyboardIntercept.js
|        |  |     └mouseIntercept.js
├─@typex-core 编辑器内核
|      ├─.babelrc.js
|      ├─constDefine.js 常量
|      ├─core.js 
|      ├─index.js
|      ├─initCore.js 初始化内核
|      ├─mappings.js 维护虚拟dom 组件实例 path等的映射关系
|      ├─package.json
|      ├─pluginContext.js
|      ├─Typex.js 
|      ├─utils.js
|      ├─view 视图层
|      |  ├─component.js 组件基类
|      |  ├─index.js
|      |  ├─vdom 虚拟dom
|      |  |  ├─createRef.js
|      |  |  ├─createVnode.js
|      |  |  ├─enqueueSetState.js
|      |  |  └patch.js
|      ├─transform 定义原子化操作
|      |     ├─step.js
|      |     └transaction.js
|      ├─selection 选取类
|      |     ├─index.js
|      |     ├─range
|      |     |   └index.js
|      ├─ot
|      | └operation.js
|      ├─model 模型层
|      |   ├─content.js 内容管理基类
|      |   ├─formater.js 格式排版器
|      |   ├─index.js
|      |   └path.js 路径类
|      ├─history 历史记录
|      |    └index.js
|      ├─defaultActions 里面定义了一些内核默认操作
|      |       ├─caretMove.js
|      |       └delete.js
```

## 文档

- 架构目标：`docs/architecture/target-architecture.md`
- ADR：`docs/adr/`
- 质量验收：`docs/quality/acceptance.md`
- 使用方式与调用流程：`docs/guides/usage-and-call-flow.md`
- 路线图：`docs/guides/roadmap.md`

## TODO

- 协同编辑
- 历史记录
- 复制粘贴
- API 优化

