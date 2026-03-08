const DEFAULT_VIEW = 'demo'
const DEFAULT_DOCS_TAB = 'api'
const VIEW_NAMES = new Set(['demo', 'docs'])
const DOCS_TAB_NAMES = new Set(['guide', 'api'])

function normalizeDocsTab(candidate) {
  if (!candidate) {
    return DEFAULT_DOCS_TAB
  }

  const normalized = candidate.replace(/^#/, '')
  return DOCS_TAB_NAMES.has(normalized) ? normalized : DEFAULT_DOCS_TAB
}

function resolveLocationState(windowRef) {
  const hashValue = (windowRef.location.hash || '').replace(/^#/, '')

  if (DOCS_TAB_NAMES.has(hashValue)) {
    return {
      view: 'docs',
      docsTab: hashValue,
    }
  }

  return {
    view: VIEW_NAMES.has(hashValue) ? hashValue : DEFAULT_VIEW,
    docsTab: DEFAULT_DOCS_TAB,
  }
}

export function initSiteShell({
  documentRef = document,
  windowRef = window,
} = {}) {
  const navLinks = [...documentRef.querySelectorAll('[data-view-target]')]
  const panels = [...documentRef.querySelectorAll('[data-view-panel]')]
  const docsTabs = [...documentRef.querySelectorAll('.docs-tab[data-docs-target]')]
  const docsPanels = [...documentRef.querySelectorAll('[data-docs-panel]')]
  const apiFrame = documentRef.querySelector('[data-api-frame]')

  if (navLinks.length === 0 || panels.length === 0) {
    return {
      setActiveView: () => DEFAULT_VIEW,
      getActiveView: () => DEFAULT_VIEW,
      getActiveDocsTab: () => DEFAULT_DOCS_TAB,
    }
  }

  let { view: activeView, docsTab: activeDocsTab } = resolveLocationState(windowRef)

  function syncApiFrame(viewName, docsTabName) {
    if (!apiFrame || viewName !== 'docs' || docsTabName !== 'api' || apiFrame.getAttribute('src')) {
      return
    }

    apiFrame.setAttribute('src', 'api/index.html')
  }

  function renderDocsTab(docsTabName) {
    activeDocsTab = normalizeDocsTab(docsTabName)

    docsTabs.forEach((tab) => {
      const isActive = tab.dataset.docsTarget === activeDocsTab
      tab.classList.toggle('docs-tab--active', isActive)
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false')
      tab.setAttribute('tabindex', isActive ? '0' : '-1')
    })

    docsPanels.forEach((panel) => {
      const isActive = panel.dataset.docsPanel === activeDocsTab
      panel.classList.toggle('docs-subview--active', isActive)
      panel.hidden = !isActive
    })

    syncApiFrame(activeView, activeDocsTab)

    return activeDocsTab
  }

  function render(viewName, { syncHash = true, docsTab = activeDocsTab } = {}) {
    const nextDocsTab = normalizeDocsTab(docsTab)
    activeView = VIEW_NAMES.has(viewName) ? viewName : DEFAULT_VIEW

    navLinks.forEach((link) => {
      const matchesView = link.dataset.viewTarget === activeView
      const matchesDocsTarget = activeView !== 'docs' || !link.dataset.docsTarget || link.dataset.docsTarget === nextDocsTab
      const isActiveView = matchesView && matchesDocsTarget
      const isActiveDocsAction = activeView === 'docs' && link.dataset.docsTarget === nextDocsTab

      if (link.classList.contains('site-nav__link')) {
        link.classList.toggle('site-nav__link--active', isActiveView)
      }
      if (link.classList.contains('docs-action')) {
        link.classList.toggle('docs-action--active', isActiveDocsAction)
      }
      link.setAttribute('aria-current', isActiveView ? 'page' : 'false')
    })

    panels.forEach((panel) => {
      const isActive = panel.dataset.viewPanel === activeView
      panel.classList.toggle('site-view--active', isActive)
      panel.hidden = !isActive
    })

    renderDocsTab(nextDocsTab)

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
      render(link.dataset.viewTarget, {
        docsTab: link.dataset.docsTarget || activeDocsTab,
      })
    })
  })

  docsTabs.forEach((tab) => {
    if (!DOCS_TAB_NAMES.has(tab.dataset.docsTarget || '')) {
      return
    }

    tab.addEventListener('click', () => {
      if (activeView !== 'docs') {
        render('docs', { docsTab: tab.dataset.docsTarget })
        return
      }

      renderDocsTab(tab.dataset.docsTarget)

      navLinks.forEach((link) => {
        if (link.classList.contains('docs-action')) {
          const isActive = link.dataset.docsTarget === activeDocsTab
          link.classList.toggle('docs-action--active', isActive)
        }
      })
    })
  })

  windowRef.addEventListener('hashchange', () => {
    const nextState = resolveLocationState(windowRef)
    render(nextState.view, {
      syncHash: false,
      docsTab: nextState.docsTab,
    })
  })

  render(activeView, {
    syncHash: false,
    docsTab: activeDocsTab,
  })

  return {
    setActiveView: (viewName, options = {}) => render(viewName, options),
    getActiveView: () => activeView,
    getActiveDocsTab: () => activeDocsTab,
  }
}
