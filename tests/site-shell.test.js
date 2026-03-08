/** @jest-environment jsdom */

import { initSiteShell } from '../src/siteShell'

describe('site shell navigation', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <header>
        <a class="site-nav__link" href="#demo" data-view-target="demo">Demo</a>
        <a class="site-nav__link" href="#guide" data-view-target="guide">Guide</a>
        <a class="site-nav__link" href="#api" data-view-target="api">API</a>
      </header>
      <main>
        <section data-view-panel="demo">demo</section>
        <section data-view-panel="guide" hidden>guide</section>
        <section data-view-panel="api" hidden>
          <iframe data-api-frame title="api"></iframe>
        </section>
      </main>
    `
    window.history.replaceState(null, '', 'http://localhost/')
  })

  test('shows demo by default and updates active tab on click', () => {
    const shell = initSiteShell({
      documentRef: document,
      windowRef: window,
    })

    expect(shell.getActiveView()).toBe('demo')
    expect(document.querySelector('[data-view-panel="demo"]').hidden).toBe(false)
    expect(document.querySelector('[data-view-panel="guide"]').hidden).toBe(true)

    document.querySelector('[data-view-target="guide"]').click()

    expect(shell.getActiveView()).toBe('guide')
    expect(document.querySelector('[data-view-panel="guide"]').hidden).toBe(false)
    expect(document.querySelector('[data-view-target="guide"]').classList.contains('site-nav__link--active')).toBe(true)
    expect(window.location.hash).toBe('#guide')
  })

  test('loads embedded api docs without leaving the page', () => {
    initSiteShell({
      documentRef: document,
      windowRef: window,
    })

    document.querySelector('[data-view-target="api"]').click()

    expect(document.querySelector('[data-view-panel="api"]').hidden).toBe(false)
    expect(document.querySelector('[data-api-frame]').getAttribute('src')).toBe('api/index.html')
    expect(window.location.hash).toBe('#api')
  })

  test('honors initial hash on first render', () => {
    window.history.replaceState(null, '', 'http://localhost/#api')

    const shell = initSiteShell({
      documentRef: document,
      windowRef: window,
    })

    expect(shell.getActiveView()).toBe('api')
    expect(document.querySelector('[data-view-panel="api"]').hidden).toBe(false)
  })
})
