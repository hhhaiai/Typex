function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;')
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
    if (mark?.type === 'bold') {
      return `<strong>${content}</strong>`
    }
    return content
  }, text)
}

function renderLegacyTextNode(node) {
  const text = escapeHtml(node.data || '')
  if (node.formats?.bold) {
    return `<strong>${text}</strong>`
  }
  return text
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
    return `<h1>${content}</h1>`
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
