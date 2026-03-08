/** @jest-environment jsdom */

import { initSiteShell } from '../src/siteShell'

describe('site shell navigation', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <header>
        <a class="site-nav__link" href="#home" data-view-target="home">Home</a>
        <a class="site-nav__link" href="#docs" data-view-target="docs">Docs</a>
        <a class="site-nav__link" href="#demo" data-view-target="demo">Demo</a>
      </header>
      <main>
        <section data-view-panel="home">home</section>
        <section data-view-panel="docs" hidden>
          <button class="docs-tab" type="button" data-docs-target="guide">Guide</button>
          <button class="docs-tab" type="button" data-docs-target="api">API</button>
          <div data-docs-panel="guide" hidden>guide</div>
          <div data-docs-panel="api" hidden>
            <iframe data-api-frame title="api"></iframe>
          </div>
        </section>
        <section data-view-panel="demo" hidden>demo</section>
      </main>
    `
    window.history.replaceState(null, '', 'http://localhost/')
  })

  test('shows home by default and opens docs guide by default', () => {
    const shell = initSiteShell({
      documentRef: document,
      windowRef: window,
    })

    expect(shell.getActiveView()).toBe('home')
    expect(shell.getActiveDocsTab()).toBe('guide')
    expect(document.querySelector('[data-view-panel="home"]').hidden).toBe(false)
    expect(document.querySelector('[data-view-panel="docs"]').hidden).toBe(true)

    document.querySelector('[data-view-target="docs"]').click()

    expect(shell.getActiveView()).toBe('docs')
    expect(shell.getActiveDocsTab()).toBe('guide')
    expect(document.querySelector('[data-docs-panel="guide"]').hidden).toBe(false)
    expect(window.location.hash).toBe('#docs')
  })

  test('opens api tab and lazy-loads api iframe', () => {
    const shell = initSiteShell({
      documentRef: document,
      windowRef: window,
    })

    shell.setActiveView('docs', { docsTab: 'api' })

    expect(shell.getActiveView()).toBe('docs')
    expect(shell.getActiveDocsTab()).toBe('api')
    expect(document.querySelector('[data-docs-panel="api"]').hidden).toBe(false)
    expect(document.querySelector('[data-api-frame]').getAttribute('src')).toBe('api/index.html')
  })

  test('switches docs subviews without changing the page hash', () => {
    const shell = initSiteShell({
      documentRef: document,
      windowRef: window,
    })

    shell.setActiveView('docs', { docsTab: 'api' })
    document.querySelector('[data-docs-target="guide"]').click()

    expect(shell.getActiveView()).toBe('docs')
    expect(shell.getActiveDocsTab()).toBe('guide')
    expect(document.querySelector('[data-docs-panel="guide"]').hidden).toBe(false)
    expect(document.querySelector('[data-docs-panel="api"]').hidden).toBe(true)
    expect(window.location.hash).toBe('#docs')
  })

  test('honors legacy api and guide hashes on first render', () => {
    window.history.replaceState(null, '', 'http://localhost/#guide')

    let shell = initSiteShell({
      documentRef: document,
      windowRef: window,
    })

    expect(shell.getActiveView()).toBe('docs')
    expect(shell.getActiveDocsTab()).toBe('guide')

    window.history.replaceState(null, '', 'http://localhost/#api')
    document.body.innerHTML = `
      <header>
        <a class="site-nav__link" href="#home" data-view-target="home">Home</a>
        <a class="site-nav__link" href="#docs" data-view-target="docs">Docs</a>
        <a class="site-nav__link" href="#demo" data-view-target="demo">Demo</a>
      </header>
      <main>
        <section data-view-panel="home">home</section>
        <section data-view-panel="docs" hidden>
          <button class="docs-tab" type="button" data-docs-target="guide">Guide</button>
          <button class="docs-tab" type="button" data-docs-target="api">API</button>
          <div data-docs-panel="guide" hidden>guide</div>
          <div data-docs-panel="api" hidden>
            <iframe data-api-frame title="api"></iframe>
          </div>
        </section>
        <section data-view-panel="demo" hidden>demo</section>
      </main>
    `

    shell = initSiteShell({
      documentRef: document,
      windowRef: window,
    })

    expect(shell.getActiveView()).toBe('docs')
    expect(shell.getActiveDocsTab()).toBe('api')
    expect(document.querySelector('[data-docs-panel="api"]').hidden).toBe(false)
  })
})
