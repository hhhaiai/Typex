import { createPreviewState } from './previewState'

const DEFAULT_TOOLBAR = [
  'undo',
  'redo',
  'header',
  'fontSize',
  'color',
  'bold',
  'underline',
  'deleteline',
  'background'
]

const DEFAULT_EDITOR_DATA = 'hello world'
const DEFAULT_MARKDOWN_DEMO = `# Markdown Demo\n\n使用 **Typex v2.0** 体验 Markdown 输入与预览。\n\n- 支持基础标题\n- 支持段落和加粗\n- 适合作为官网演示说明`
const DEFAULT_DEMO_TAB = 'editor'
const DEMO_TAB_NAMES = new Set(['editor', 'markdown'])

function ensureElement(documentRef, id) {
  const element = documentRef.getElementById(id)
  if (!element) {
    throw new Error(`${id} is required`)
  }
  return element
}

function normalizeDemoTab(candidate) {
  return DEMO_TAB_NAMES.has(candidate) ? candidate : DEFAULT_DEMO_TAB
}

function initDemoTabs(documentRef) {
  const tabs = [...documentRef.querySelectorAll('.demo-tab[data-demo-target]')]
  const panels = [...documentRef.querySelectorAll('[data-demo-panel]')]

  if (tabs.length === 0 || panels.length === 0) {
    return {
      getActiveTab: () => DEFAULT_DEMO_TAB,
      setActiveTab: () => DEFAULT_DEMO_TAB,
    }
  }

  let activeTab = DEFAULT_DEMO_TAB

  function render(tabName) {
    activeTab = normalizeDemoTab(tabName)

    tabs.forEach((tab) => {
      const isActive = tab.dataset.demoTarget === activeTab
      tab.classList.toggle('demo-tab--active', isActive)
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false')
    })

    panels.forEach((panel) => {
      const isActive = panel.dataset.demoPanel === activeTab
      panel.classList.toggle('demo-subview--active', isActive)
      panel.hidden = !isActive
    })

    return activeTab
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      render(tab.dataset.demoTarget)
    })
  })

  render(DEFAULT_DEMO_TAB)

  return {
    getActiveTab: () => activeTab,
    setActiveTab: (tabName) => render(tabName),
  }
}

export function createDemoApp({
  createEditorImpl,
  documentRef = document,
  windowRef = window,
} = {}) {
  const editorRoot = ensureElement(documentRef, 'editor-root')
  const editorPreviewRoot = ensureElement(documentRef, 'preview-root-editor')
  const markdownPreviewRoot = ensureElement(documentRef, 'preview-root-markdown')
  const markdownInput = ensureElement(documentRef, 'markdown-input')
  const editorPreviewState = createPreviewState({ previewRoot: editorPreviewRoot })
  const markdownPreviewState = createPreviewState({ previewRoot: markdownPreviewRoot })
  const demoTabs = initDemoTabs(documentRef)

  if (typeof createEditorImpl !== 'function') {
    throw new Error('createEditorImpl is required')
  }

  const editor = createEditorImpl({
    data: DEFAULT_EDITOR_DATA,
  })
    .setToolBar(DEFAULT_TOOLBAR)
    .mount(editorRoot.id)

  editorPreviewState.update(editor.getValue())
  markdownInput.value = DEFAULT_MARKDOWN_DEMO
  markdownPreviewState.update(DEFAULT_MARKDOWN_DEMO)

  if (typeof editor.on === 'function') {
    editor.on('change', (nextValue) => {
      editorPreviewState.update(nextValue)
    })
  }

  markdownInput.addEventListener('input', (event) => {
    markdownPreviewState.update(event.target.value)
  })

  windowRef.editor = editor
  windowRef.editorPreviewState = editorPreviewState
  windowRef.markdownPreviewState = markdownPreviewState
  windowRef.demoTabs = demoTabs

  return {
    editor,
    editorPreviewState,
    markdownPreviewState,
    demoTabs,
  }
}
