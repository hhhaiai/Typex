import { renderPreviewHtml } from '../src/demo/markdownPreview'

describe('demo markdown preview renderer', () => {
  test('renders markdown heading and bold text from plain string input', () => {
    const html = renderPreviewHtml('# Hello\n\nThis is **Typex**')

    expect(html).toContain('<h1>Hello</h1>')
    expect(html).toContain('<p>This is <strong>Typex</strong></p>')
  })

  test('renders paragraph and rich inline formats from legacy document input', () => {
    const html = renderPreviewHtml({
      data: [
        {
          data: [
            {
              data: 'Styled',
              formats: {
                bold: true,
                underline: true,
                deleteline: true,
                color: 'rgb(255, 0, 0)',
                fontSize: '24px',
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

    expect(html).toContain('<p>')
    expect(html).toContain('font-size: 24px;')
    expect(html).toContain('color: rgb(255, 0, 0);')
    expect(html).toContain('<strong>')
    expect(html).toContain('<u>')
    expect(html).toContain('<del>')
  })

  test('renders header blocks from editor document format keys', () => {
    const html = renderPreviewHtml({
      data: [
        {
          data: [
            {
              data: 'Section Title',
              formats: {},
            },
          ],
          formats: {
            header: 2,
          },
        },
      ],
      formats: {
        root: true,
      },
    })

    expect(html).toContain('<h2>Section Title</h2>')
  })

  test('renders canonical document input with heading level and inline marks', () => {
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
                {
                  type: 'color',
                  attrs: {
                    value: '#ff6600',
                  },
                },
              ],
            },
          ],
        },
      ],
    })

    expect(html).toContain('<h2>Canonical <span style="color: #ff6600;"><strong>Title</strong></span></h2>')
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
