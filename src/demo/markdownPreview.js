function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/\n/g, ' ')
}

function renderInlineMarkdown(text) {
  const escapedText = escapeHtml(text)
  return escapedText.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

function renderMarkdown(markdown) {
  const blocks = String(markdown).trim().split(/\n\s*\n/).filter(Boolean)

  return blocks.map((block) => {
    const lines = block.split('\n')
    if (lines.length === 1 && /^#\s+/.test(lines[0])) {
      return `<h1>${renderInlineMarkdown(lines[0].replace(/^#\s+/, ''))}</h1>`
    }
    return `<p>${lines.map((line) => renderInlineMarkdown(line)).join('<br>')}</p>`
  }).join('')
}

function wrapWithMarks(text, marks = []) {
  return marks.reduce((content, mark) => {
    if (!mark || typeof mark !== 'object') {
      return content
    }

    if (mark.type === 'bold') return `<strong>${content}</strong>`
    if (mark.type === 'underline') return `<u>${content}</u>`
    if (mark.type === 'strike') return `<del>${content}</del>`
    if (mark.type === 'code') return `<code>${content}</code>`
    if (mark.type === 'sub') return `<sub>${content}</sub>`
    if (mark.type === 'sup') return `<sup>${content}</sup>`
    if (mark.type === 'color') return `<span style="color: ${escapeAttribute(mark.attrs?.value || '')};">${content}</span>`
    if (mark.type === 'background') return `<span style="background: ${escapeAttribute(mark.attrs?.value || '')};">${content}</span>`
    if (mark.type === 'font_size') return `<span style="font-size: ${escapeAttribute(mark.attrs?.value || '')};">${content}</span>`

    return content
  }, text)
}

function applyLegacyTextFormats(text, formats = {}) {
  let content = escapeHtml(text)

  if (formats.color) {
    content = `<span style="color: ${escapeAttribute(formats.color)};">${content}</span>`
  }
  if (formats.background) {
    content = `<span style="background: ${escapeAttribute(formats.background)};">${content}</span>`
  }
  if (formats.fontSize) {
    content = `<span style="font-size: ${escapeAttribute(formats.fontSize)};">${content}</span>`
  }
  if (formats.bold) {
    content = `<strong>${content}</strong>`
  }
  if (formats.underline) {
    content = `<u>${content}</u>`
  }
  if (formats.deleteline) {
    content = `<del>${content}</del>`
  }
  if (formats.sup) {
    content = `<sup>${content}</sup>`
  }
  if (formats.sub) {
    content = `<sub>${content}</sub>`
  }
  if (formats.code) {
    content = `<code>${content}</code>`
  }

  return content
}

function renderLegacyTextNode(node) {
  return applyLegacyTextFormats(node.data || '', node.formats || {})
}

function renderLegacyBlockNode(node) {
  if (!node || !Array.isArray(node.data)) {
    return ''
  }

  const content = node.data.map((child) => {
    if (typeof child?.data === 'string') {
      return renderLegacyTextNode(child)
    }
    return renderLegacyBlockNode(child)
  }).join('')

  if (node.formats?.heading || node.formats?.header) {
    const level = Math.min(Math.max(Number(node.formats?.heading || node.formats?.header) || 1, 1), 6)
    return `<h${level}>${content}</h${level}>`
  }

  return `<p>${content}</p>`
}

function renderLegacyDocument(documentValue) {
  if (!documentValue || !Array.isArray(documentValue.data)) {
    return ''
  }

  return documentValue.data.map(renderLegacyBlockNode).join('')
}

function renderCanonicalNode(node) {
  if (!node) {
    return ''
  }

  if (node.kind === 'text') {
    return wrapWithMarks(escapeHtml(node.text || ''), node.marks)
  }

  if (!Array.isArray(node.children)) {
    return ''
  }

  const content = node.children.map(renderCanonicalNode).join('')

  if (node.kind === 'block') {
    if (node.type === 'heading') {
      const level = Math.min(Math.max(node.attrs?.level || 1, 1), 6)
      return `<h${level}>${content}</h${level}>`
    }
    return `<p>${content}</p>`
  }

  return content
}

function renderCanonicalDocument(documentValue) {
  if (!documentValue || documentValue.type !== 'document' || !Array.isArray(documentValue.children)) {
    return ''
  }

  return documentValue.children.map(renderCanonicalNode).join('')
}

export function renderPreviewHtml(value) {
  if (typeof value === 'string') {
    const trimmedValue = value.trim()
    if (!trimmedValue) {
      return ''
    }
    return renderMarkdown(trimmedValue)
  }

  if (value && value.type === 'document' && Array.isArray(value.children)) {
    return renderCanonicalDocument(value)
  }

  if (value && Array.isArray(value.data)) {
    return renderLegacyDocument(value)
  }

  return ''
}
