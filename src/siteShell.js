const DEFAULT_VIEW = 'demo'
const VIEW_NAMES = new Set(['demo', 'guide', 'api'])

function normalizeView(candidate) {
  if (!candidate) {
    return DEFAULT_VIEW
  }

  const normalized = candidate.replace(/^#/, '')
  return VIEW_NAMES.has(normalized) ? normalized : DEFAULT_VIEW
}

function getHashView(windowRef) {
  return normalizeView(windowRef.location.hash)
}

export function initSiteShell({
  documentRef = document,
  windowRef = window,
} = {}) {
  const navLinks = [...documentRef.querySelectorAll('[data-view-target]')]
  const panels = [...documentRef.querySelectorAll('[data-view-panel]')]
  const apiFrame = documentRef.querySelector('[data-api-frame]')

  if (navLinks.length === 0 || panels.length === 0) {
    return {
      setActiveView: () => DEFAULT_VIEW,
      getActiveView: () => DEFAULT_VIEW,
    }
  }

  let activeView = getHashView(windowRef)

  function syncApiFrame(viewName) {
    if (!apiFrame || viewName !== 'api' || apiFrame.getAttribute('src')) {
      return
    }

    apiFrame.setAttribute('src', 'api/index.html')
  }

  function render(viewName, { syncHash = true } = {}) {
    activeView = normalizeView(viewName)

    navLinks.forEach((link) => {
      const isActive = link.dataset.viewTarget === activeView
      if (link.classList.contains('site-nav__link')) {
        link.classList.toggle('site-nav__link--active', isActive)
      }
      if (link.classList.contains('docs-action')) {
        link.classList.toggle('docs-action--active', isActive)
      }
      link.setAttribute('aria-current', isActive ? 'page' : 'false')
    })

    panels.forEach((panel) => {
      const isActive = panel.dataset.viewPanel === activeView
      panel.classList.toggle('site-view--active', isActive)
      panel.hidden = !isActive
    })

    syncApiFrame(activeView)

    if (syncHash) {
      windowRef.history.replaceState(null, '', `#${activeView}`)
    }

    return activeView
  }

  navLinks.forEach((link) => {
    if (!VIEW_NAMES.has(link.dataset.viewTarget || '')) {
      return
    }

    link.addEventListener('click', (event) => {
      event.preventDefault()
      render(link.dataset.viewTarget)
    })
  })

  windowRef.addEventListener('hashchange', () => {
    render(getHashView(windowRef), { syncHash: false })
  })

  render(activeView, { syncHash: false })

  return {
    setActiveView: (viewName) => render(viewName),
    getActiveView: () => activeView,
  }
}
