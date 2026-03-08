/** @jest-environment jsdom */

import { renderPreviewHtml } from '../src/demo/markdownPreview'

describe('demo markdown preview renderer', () => {
  test('renders markdown heading and bold text from plain string input', () => {
    const html = renderPreviewHtml('# Title\n\nHello **world**')

    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<p>Hello <strong>world</strong></p>')
  })

  test('renders paragraph and bold mark from rich text document input', () => {
    const html = renderPreviewHtml({
      data: [
        {
          data: [
            {
              data: 'Hello ',
              formats: {},
            },
            {
              data: 'Typex',
              formats: {
                bold: true,
              },
            },
          ],
          formats: {
            paragraph: true,
          },
        },
      ],
      formats: {
        root: true,
      },
    })

    expect(html).toContain('<p>Hello <strong>Typex</strong></p>')
  })

  test('renders header blocks from editor document format keys', () => {
    const html = renderPreviewHtml({
      data: [
        {
          data: [
            {
              data: 'Section title',
              formats: {},
            },
          ],
          formats: {
            header: 1,
          },
        },
      ],
      formats: {
        root: true,
      },
    })

    expect(html).toContain('<h1>Section title</h1>')
  })

  test('renders canonical document input with heading level and bold marks', () => {
    const html = renderPreviewHtml({
      version: 1,
      type: 'document',
      children: [
        {
          kind: 'block',
          type: 'heading',
          attrs: {
            level: 2,
          },
          children: [
            {
              kind: 'text',
              type: 'text',
              text: 'Canonical ',
            },
            {
              kind: 'text',
              type: 'text',
              text: 'Title',
              marks: [
                {
                  type: 'bold',
                },
              ],
            },
          ],
        },
      ],
    })

    expect(html).toContain('<h2>Canonical <strong>Title</strong></h2>')
  })

  test('returns safe empty html for null or unsupported values', () => {
    expect(renderPreviewHtml(null)).toBe('')
    expect(renderPreviewHtml(undefined)).toBe('')
    expect(renderPreviewHtml({ foo: 'bar' })).toBe('')
  })

  test('escapes raw html before rendering preview output', () => {
    const html = renderPreviewHtml('<script>alert(1)</script> **safe**')

    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; <strong>safe</strong>')
  })
})
