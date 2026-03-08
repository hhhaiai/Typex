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

function ensureElement(documentRef, id) {
  const element = documentRef.getElementById(id)
  if (!element) {
    throw new Error(`${id} is required`)
  }
  return element
}

export function createDemoApp({
  createEditorImpl,
  documentRef = document,
  windowRef = window,
} = {}) {
  const editorRoot = ensureElement(documentRef, 'editor-root')
  const previewRoot = ensureElement(documentRef, 'preview-root')
  const markdownInput = ensureElement(documentRef, 'markdown-input')
  const previewState = createPreviewState({ previewRoot })

  if (typeof createEditorImpl !== 'function') {
    throw new Error('createEditorImpl is required')
  }

  const editor = createEditorImpl({
    data: DEFAULT_EDITOR_DATA,
  })
    .setToolBar(DEFAULT_TOOLBAR)
    .mount(editorRoot.id)

  previewState.update(editor.getValue())

  if (typeof editor.on === 'function') {
    editor.on('change', (nextValue) => {
      markdownInput.value = typeof nextValue === 'string' ? nextValue : markdownInput.value
      previewState.update(nextValue)
    })
  }

  markdownInput.addEventListener('input', (event) => {
    previewState.update(event.target.value)
  })

  windowRef.editor = editor
  windowRef.previewState = previewState

  return {
    editor,
    previewState,
  }
}
