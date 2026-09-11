/**
 * Runs every documented Print.js feature in Chromium, Firefox and WebKit
 * (the engine Safari and every iOS browser use), on desktop and with an
 * iPhone user agent.
 *
 *   bun run test:browsers            all engines
 *   bun run test:browsers webkit     one engine
 */
import { chromium, firefox, webkit, type Browser } from 'playwright'

const PORT = 8123
const BASE = `http://localhost:${PORT}/test/browser/fixture.html`
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

type Result = {
  printCalled: boolean
  via: string | null
  html: string
  title: string
  tabUrl: string | null
  events: string[]
  error: string | null
  modalText: string | null
  frameStyle: string | null
}

type Check = {
  name: string
  config: Record<string, any>
  expect: (r: Result, profile: Profile) => string | null
}

type Profile = { engine: string; mobile: boolean }

const ok = () => null
const fail = (message: string) => message

/** Every documented print type and option, from printjs.crabbly.com */
const checks: Check[] = [
  {
    name: 'pdf from url',
    config: { printable: '/test/manual/test.pdf', type: 'pdf' },
    expect: (r, p) => {
      if (p.mobile || p.engine === 'webkit') {
        return r.tabUrl && r.tabUrl.includes('test.pdf') && r.events.includes('onPdfOpen')
          ? ok() : fail(`expected a new tab with the pdf, got ${r.tabUrl} / ${r.events.join()}`)
      }
      return r.printCalled ? ok() : fail('print dialog was never requested')
    }
  },
  {
    name: 'pdf base64',
    config: { printable: 'JVBERi0xLjQKJZOMi54=', type: 'pdf', base64: true },
    expect: (r, p) => {
      if (p.mobile || p.engine === 'webkit') {
        return r.tabUrl && r.tabUrl.startsWith('blob:') ? ok() : fail(`expected a blob url, got ${r.tabUrl}`)
      }
      return r.printCalled ? ok() : fail('print dialog was never requested')
    }
  },
  {
    name: 'pdf: showModal + modalMessage',
    config: { printable: '/test/manual/test.pdf', type: 'pdf', showModal: true, modalMessage: 'Fetching…' },
    expect: (r, p) => {
      // A pdf that opens in a tab is on screen straight away, so no modal is shown
      if (p.mobile || p.engine === 'webkit') {
        return r.tabUrl && r.modalText === null
          ? ok() : fail(`expected the tab and no modal, got ${r.tabUrl} / ${r.modalText}`)
      }

      return r.modalText && r.modalText.includes('Fetching…') ? ok() : fail(`modal never showed (${r.modalText})`)
    }
  },
  {
    name: 'pdf: onLoadingStart / onLoadingEnd',
    config: { printable: '/test/manual/test.pdf', type: 'pdf' },
    expect: (r) => r.events.includes('onLoadingStart') && r.events.includes('onLoadingEnd')
      ? ok() : fail(`missing loading hooks: ${r.events.join() || 'none'}`)
  },
  {
    name: 'pdf: onError for a missing file',
    config: { printable: '/test/manual/does-not-exist.pdf', type: 'pdf', fallbackToNewTab: false },
    expect: (r) => r.error ? ok() : fail('no error reported for a 404 pdf')
  },
  {
    name: 'html element by id',
    config: { printable: 'invoice', type: 'html' },
    expect: (r) => r.html.includes('Invoice #1042') ? ok() : fail(`invoice missing from output: ${r.html.slice(0, 80)}`)
  },
  {
    name: 'html: ignoreElements',
    config: { printable: 'invoice', type: 'html', ignoreElements: ['screen-only'] },
    expect: (r) => !r.html.includes('not printed') ? ok() : fail('ignored element was printed')
  },
  {
    name: 'html: header, footer and their styles',
    config: {
      printable: 'invoice',
      type: 'html',
      header: 'Top header',
      headerStyle: 'font-weight: 900;',
      footer: 'Bottom footer',
      footerStyle: 'font-style: italic;'
    },
    expect: (r) => r.html.includes('Top header') && r.html.includes('font-weight: 900') &&
      r.html.includes('Bottom footer') && r.html.includes('font-style: italic')
      ? ok() : fail('header/footer or their styles missing')
  },
  {
    name: 'html: raw html header',
    config: { printable: 'invoice', type: 'html', header: '<h3 id="rawHeader">Raw</h3>' },
    expect: (r) => r.html.includes('id="rawHeader"') ? ok() : fail('raw html header missing')
  },
  {
    name: 'html: form field state is carried over',
    config: { printable: 'invoice', type: 'html' },
    expect: (r) => r.html.includes('typed value') || /value="typed value"/.test(r.html)
      ? ok() : fail('input value was not copied to the printout')
  },
  {
    name: 'html: scanStyles + targetStyles',
    config: { printable: 'invoice', type: 'html', targetStyles: ['*'] },
    expect: (r) => /style="[^"]*color/.test(r.html) ? ok() : fail('computed styles were not copied')
  },
  {
    name: 'html: scanStyles false leaves styles alone',
    config: { printable: 'invoice', type: 'html', scanStyles: false },
    expect: (r) => !/max-width: 800px/.test(r.html) ? ok() : fail('styles were scanned even though scanStyles was false')
  },
  {
    name: 'html: custom style string',
    config: { printable: 'invoice', type: 'html', style: '.x { color: red }' },
    expect: (r) => r.printCalled ? ok() : fail('print dialog was never requested')
  },
  {
    name: 'html: documentTitle',
    config: { printable: 'invoice', type: 'html', documentTitle: 'My Invoice' },
    expect: (r) => r.title === 'My Invoice' ? ok() : fail(`title was "${r.title}"`)
  },
  {
    name: 'html: css file',
    config: { printable: 'invoice', type: 'html', css: '/test/manual/test.css' },
    expect: (r) => r.printCalled ? ok() : fail('print dialog was never requested')
  },
  {
    name: 'html: custom frameId',
    config: { printable: 'invoice', type: 'html', frameId: 'myFrame' },
    expect: (r, p) => p.mobile || r.frameStyle !== null ? ok() : fail('custom frame id was not used')
  },
  {
    name: 'html: a NodeList of elements',
    config: { printable: 'NODE_LIST', type: 'html' },
    expect: (r) => r.html.includes('row one') && r.html.includes('row two')
      ? ok() : fail('elements from the NodeList are missing')
  },
  {
    name: 'image: a broken image does not block the dialog',
    config: { printable: ['/test/manual/test-01.jpg', '/test/manual/missing.jpg'], type: 'image' },
    expect: (r) => r.printCalled ? ok() : fail('the print dialog never opened')
  },
  {
    name: 'image: an img without a src does not block the dialog',
    config: { printable: '<p>text</p><img><img src="">', type: 'raw-html' },
    expect: (r) => r.printCalled ? ok() : fail('the print dialog never opened')
  },
  {
    name: 'image: single',
    config: { printable: '/test/manual/test-01.jpg', type: 'image' },
    expect: (r) => (r.html.match(/<img/g) || []).length === 1 ? ok() : fail(`expected 1 image, got ${(r.html.match(/<img/g) || []).length}`)
  },
  {
    name: 'image: array + imageStyle',
    config: {
      printable: ['/test/manual/test-01.jpg', '/test/manual/test-02.jpg'],
      type: 'image',
      imageStyle: 'width: 50%;'
    },
    expect: (r) => (r.html.match(/<img/g) || []).length === 2 && r.html.includes('width: 50%')
      ? ok() : fail('images or imageStyle missing')
  },
  {
    name: 'image: header',
    config: { printable: '/test/manual/test-01.jpg', type: 'image', header: 'Photo' },
    expect: (r) => r.html.includes('Photo') ? ok() : fail('header missing')
  },
  {
    name: 'json: table with properties',
    config: {
      printable: [{ name: 'Ada', role: 'Engineer' }, { name: 'Grace', role: 'Admiral' }],
      type: 'json',
      properties: ['name', 'role']
    },
    expect: (r) => r.html.includes('<table') && r.html.includes('Ada') && r.html.includes('Admiral') && r.html.includes('Name')
      ? ok() : fail('json table incomplete')
  },
  {
    name: 'json: object properties, displayName, columnSize',
    config: {
      printable: [{ user: { first: 'Ada' } }],
      type: 'json',
      properties: [{ field: 'user.first', displayName: 'first name', columnSize: '70%' }]
    },
    expect: (r) => r.html.includes('Ada') && r.html.includes('First name') && r.html.includes('70%')
      ? ok() : fail('nested field / displayName / columnSize missing')
  },
  {
    name: 'json: gridHeaderStyle and gridStyle',
    config: {
      printable: [{ name: 'Ada' }],
      type: 'json',
      properties: ['name'],
      gridHeaderStyle: 'color: rebeccapurple;',
      gridStyle: 'border: 2px dashed black;'
    },
    expect: (r) => r.html.includes('rebeccapurple') && r.html.includes('2px dashed')
      ? ok() : fail('grid styles missing')
  },
  {
    name: 'json: repeatTableHeader false',
    config: { printable: [{ name: 'Ada' }], type: 'json', properties: ['name'], repeatTableHeader: false },
    expect: (r) => !r.html.includes('<thead') ? ok() : fail('thead present although repeatTableHeader was false')
  },
  {
    name: 'json: header and footer',
    config: { printable: [{ name: 'Ada' }], type: 'json', properties: ['name'], header: 'Team', footer: 'End' },
    expect: (r) => r.html.includes('Team') && r.html.includes('End') ? ok() : fail('header/footer missing')
  },
  {
    name: 'raw-html string',
    config: { printable: '<h3>Hello raw</h3>', type: 'raw-html' },
    expect: (r) => r.html.includes('Hello raw') ? ok() : fail('raw html missing')
  },
  {
    name: 'raw-html: header and footer',
    config: { printable: '<p>body</p>', type: 'raw-html', header: 'H', footer: 'F' },
    expect: (r) => r.html.includes('H') && r.html.includes('F') ? ok() : fail('header/footer missing')
  },
  {
    name: 'fallbackToNewTab: true forces a tab',
    config: { printable: 'invoice', type: 'html', fallbackToNewTab: true },
    expect: (r) => r.via === 'new window' ? ok() : fail(`printed via ${r.via}`)
  },
  {
    name: 'fallbackToNewTab: false forces the iframe',
    config: { printable: 'invoice', type: 'html', fallbackToNewTab: false },
    expect: (r) => r.via === 'iframe' ? ok() : fail(`printed via ${r.via}`)
  },
  {
    name: 'print frame is rendered where the browser requires it',
    config: { printable: 'invoice', type: 'html', fallbackToNewTab: false },
    expect: (r, p) => {
      if (p.engine === 'chromium') return ok()
      return r.frameStyle && !r.frameStyle.includes('visibility: hidden')
        ? ok() : fail(`frame was not rendered: ${r.frameStyle}`)
    }
  }
]

// The chromium headless shell fails to start on some machines, so the full
// chromium build is used instead
const filter = process.argv[3]

const engines: Record<string, { launcher: any, options?: Record<string, any> }> = {
  chromium: { launcher: chromium, options: { channel: 'chromium' } },
  firefox: { launcher: firefox },
  webkit: { launcher: webkit }
}
const only = process.argv[2]

const server = Bun.serve({
  port: PORT,
  async fetch (request) {
    const path = decodeURIComponent(new URL(request.url).pathname)
    const file = Bun.file(process.cwd() + path)
    return await file.exists() ? new Response(file) : new Response('not found', { status: 404 })
  }
})

let failures = 0

for (const [engineName, engine] of Object.entries(engines)) {
  if (only && only !== engineName) continue

  let browser: Browser

  try {
    browser = await engine.launcher.launch(engine.options)
  } catch (error) {
    console.log(`\n▸ ${engineName}\n  ! skipped, could not launch: ${String(error).split('\n')[0]}`)
    console.log('    run `bunx playwright install` to download the engines')
    failures++
    continue
  }

  const profiles: Profile[] = engineName === 'webkit'
    ? [{ engine: engineName, mobile: false }, { engine: engineName, mobile: true }]
    : [{ engine: engineName, mobile: false }]

  for (const profile of profiles) {
    const label = profile.mobile ? `${engineName} (iPhone user agent)` : engineName
    console.log(`\n▸ ${label}`)

    const context = await browser.newContext(profile.mobile ? { userAgent: IPHONE_UA, hasTouch: true } : {})
    const page = await context.newPage()
    await page.goto(BASE)

    for (const check of checks) {
      if (filter && !check.name.includes(filter)) continue

      const startedAt = Date.now()
      const result = await page.evaluate(
        ([config]) => {
          const job: any = { ...(config as any) }
          if (job.printable === 'NODE_LIST') job.printable = document.querySelectorAll('.row')
          return (window as any).printTest(job)
        },
        [check.config] as const
      ) as Result

      const problem = check.expect(result, profile)
      const took = Date.now() - startedAt
      const slow = took > 5000 ? ` (${(took / 1000).toFixed(1)}s)` : ''

      if (problem) {
        failures++
        console.log(`  ✗ ${check.name}${slow}\n      ${problem}`)
      } else {
        console.log(`  ✓ ${check.name}${slow}`)
      }
    }

    await context.close()
  }

  await browser.close()
}

server.stop(true)

console.log(failures === 0 ? '\nAll browser checks passed.' : `\n${failures} browser check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
