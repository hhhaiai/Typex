/** @jest-environment jsdom */

import { createPreviewState } from '../src/demo/previewState'

describe('demo preview state', () => {
  test('renders empty state before any content is provided', () => {
    document.body.innerHTML = '<div id="preview-root"></div>'
    const previewRoot = document.getElementById('preview-root')

    createPreviewState({ previewRoot })

    expect(previewRoot.innerHTML).toContain('Preview is empty')
    expect(previewRoot.className).toContain('demo-preview--empty')
  })

  test('renders rich content when updated with markdown text', () => {
    document.body.innerHTML = '<div id="preview-root"></div>'
    const previewRoot = document.getElementById('preview-root')
    const previewState = createPreviewState({ previewRoot })

    previewState.update('# Title\n\nHello **world**')

    expect(previewRoot.innerHTML).toContain('<h1>Title</h1>')
    expect(previewRoot.innerHTML).toContain('<strong>world</strong>')
    expect(previewRoot.className).not.toContain('demo-preview--empty')
  })

  test('falls back to empty state for invalid content', () => {
    document.body.innerHTML = '<div id="preview-root"></div>'
    const previewRoot = document.getElementById('preview-root')
    const previewState = createPreviewState({ previewRoot })

    previewState.update({ foo: 'bar' })

    expect(previewRoot.innerHTML).toContain('Preview is empty')
    expect(previewRoot.className).toContain('demo-preview--empty')
  })
})
