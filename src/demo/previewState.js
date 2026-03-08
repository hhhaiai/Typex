import { renderPreviewHtml } from './markdownPreview'

const EMPTY_CLASS = 'demo-preview demo-preview--empty'
const READY_CLASS = 'demo-preview'
const EMPTY_TEXT = 'Preview is empty'

export function createPreviewState({ previewRoot }) {
  if (!previewRoot) {
    throw new Error('previewRoot is required')
  }

  function renderEmpty() {
    previewRoot.className = EMPTY_CLASS
    previewRoot.innerHTML = `<div class="demo-preview__empty">${EMPTY_TEXT}</div>`
  }

  function update(value) {
    const html = renderPreviewHtml(value)
    if (!html) {
      renderEmpty()
      return
    }
    previewRoot.className = READY_CLASS
    previewRoot.innerHTML = html
  }

  renderEmpty()

  return {
    update,
    renderEmpty,
  }
}
