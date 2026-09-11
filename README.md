# Print.js

[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat)](LICENSE)
[![npm](https://img.shields.io/npm/v/print-js.svg)](https://www.npmjs.com/package/print-js)

> This fork is written in TypeScript, built and tested with [Bun](https://bun.sh), ships React hooks,
> and fixes printing in Safari, Firefox and mobile browsers. See
> [Browser support](#browser-support-this-fork) and [React](#react).

A tiny javascript library to help printing from the web.

> For documentation and examples please visit: [printjs.crabbly.com](http://printjs.crabbly.com)

## Installation

You can download the latest version of Print.js from the [GitHub releases](https://github.com/crabbly/Print.js/releases/latest) or use the [Print.js CDN](http://printjs.crabbly.com/#cdn) available on the documentation page.

To install via npm:

```bash
npm install print-js --save
```

To install via yarn:

```bash
yarn add print-js
```

Import the library into your project:

```js
import printJS from 'print-js'
import 'print-js/dist/print.css'   // only needed when using showModal
```

TypeScript types ship with the package, so configuration objects are checked as you write them:

```ts
import printJS, { type Configuration } from 'print-js'

const job: Configuration = { printable: 'invoice', type: 'html', targetStyles: ['*'] }

printJS(job)
```

Or as a plain script tag, which exposes the global `printJS`:

```html
<link rel="stylesheet" href="dist/print.css">
<script src="dist/print.js"></script>
<button onclick="printJS('docs/invoice.pdf')">Print</button>
```

## React

```tsx
import { usePrint } from 'print-js/react'

function Invoice () {
  const { print, targetRef, isPrinting, error } = usePrint({ type: 'html', targetStyles: ['*'] })

  return (
    <>
      <div ref={targetRef}>
        <h1>Invoice #1042</h1>
      </div>

      <button onClick={() => print()} disabled={isPrinting}>Print</button>
      {error && <p role="alert">{error.message}</p>}
    </>
  )
}
```

`usePrint()` takes every Print.js option, and `print()` accepts overrides for a single job.
There are shortcuts for the other print types:

```tsx
import { usePrintPdf, usePrintJson, usePrintImage, usePrintHtml } from 'print-js/react'

const { print: printInvoice, isPrinting } = usePrintPdf('/docs/invoice.pdf', { showModal: true })
const { print: printTeam } = usePrintJson(people, ['name', 'role'], { header: 'Team' })
```

Call `print()` straight from the event handler (not after an `await`): browsers that need
to open a tab only allow it while the click is still being handled. React is an optional
peer dependency — plain `printJS` users never load it.

## Using this fork in another project

This fork is not published to npm under its own name — install it straight from git,
or copy the built files into your project.

```bash
bun add github:saileshkush95/Print.js      # bun
npm install github:saileshkush95/Print.js  # npm
yarn add github:saileshkush95/Print.js     # yarn
```

The package ships prebuilt files under `dist/`, so nothing needs to be compiled in your app.
If you cloned the repo instead, run `bun install && bun run build` first and point your
project at the folder (`npm install ../Print.js`).

##### Plain HTML page (no build step)

Copy `dist/print.js` and `dist/print.css` next to your page:

```html
<link rel="stylesheet" href="print.css">
<script src="print.js"></script>

<button onclick="printJS({ printable: 'invoice', type: 'html' })">Print</button>
```

##### Vite, webpack, Rollup, Parcel

```js
import printJS from 'print-js'
import 'print-js/dist/print.css'   // only needed for showModal

printJS({ printable: 'docs/invoice.pdf', type: 'pdf' })
```

##### React

See [React](#react) above. `import { usePrint } from 'print-js/react'`.

##### Next.js / any SSR framework

Print.js needs `window`, so keep it on the client:

```tsx
'use client'

import { usePrint } from 'print-js/react'

export function PrintButton () {
  const { print, targetRef } = usePrint({ type: 'html' })
  return <div ref={targetRef}><button onClick={() => print()}>Print</button></div>
}
```

For a non-React SSR setup, import it inside the handler instead: `const { default: printJS } = await import('print-js')`.
Remember to `await` the import *before* the click (for example at module load), so the print
call itself still runs inside the user gesture.

##### Vue 3

```vue
<script setup>
import printJS from 'print-js'
import 'print-js/dist/print.css'
import { ref } from 'vue'

const invoice = ref(null)
const print = () => printJS({ printable: invoice.value, type: 'html', targetStyles: ['*'] })
</script>

<template>
  <div ref="invoice">Invoice #1042</div>
  <button @click="print">Print</button>
</template>
```

##### Angular

```ts
import printJS from 'print-js'

@Component({ /* ... */ })
export class InvoiceComponent {
  print () {
    printJS({ printable: 'invoice', type: 'html', targetStyles: ['*'] })
  }
}
```

Add `"node_modules/print-js/dist/print.css"` to the `styles` array in `angular.json` when using `showModal`.

##### Svelte

```svelte
<script>
  import printJS from 'print-js'
  let invoice
</script>

<div bind:this={invoice}>Invoice #1042</div>
<button on:click={() => printJS({ printable: invoice, type: 'html' })}>Print</button>
```

##### Things to know wherever you use it

* Call `printJS()` **directly from the click handler**. Safari, iOS and Android print PDFs from a
  new tab, and browsers only allow opening one while the click is still being handled.
* **PDFs must be served from the same origin** as your page (Same Origin Policy), or fetched
  through your own proxy. Base64 works from anywhere: `{ printable: base64, base64: true }`.
* `dist/print.css` is only needed for the loading modal (`showModal: true`).
* Pages served over `file://` can't print PDFs: use a local server (`bun run serve`, or any other).


## Documentation

You can find documentation at [printjs.crabbly.com](http://printjs.crabbly.com/#documentation).

## Contributing to Print.js

[![devDependencies Status](https://david-dm.org/crabbly/print.js/dev-status.svg)](https://david-dm.org/crabbly/print.js?type=dev)
[![dependencies Status](https://david-dm.org/crabbly/print.js/status.svg)](https://david-dm.org/crabbly/print.js)

Contributions to Print.js are greatly welcomed and encouraged.

##### Using issues

The [issue tracker](https://github.com/crabbly/Print.js/issues) is the preferred channel for reporting bugs, requesting new features and submitting pull requests.

Keep in mind that we would like to keep this a lightweight library.

Please do not use the issues channel for support requests. For help with using Print.js, please ask questions on Stack Overflow and use the tag `printjs`.

##### Reporting bugs

Well structured, detailed bug reports are hugely valuable for the project.

* Check the issue search to see if it has already been reported.
* Isolate the problem to a simple test case.
* Create a codepen, fiddle, codesandbox or similar online example replicating the issue.

Please provide any additional details associated with the bug.

##### Pull requests

Clear, concise pull requests are excellent at continuing the project's community driven growth.  

Please make your commits in logical sections with clear commit messages.  

##### Setting up a dev environment

```bash
bun install
bun run watch      # rebuilds dist/ on every change
```

##### Tests

```bash
bun run typecheck       # tsc --noEmit
bun run test            # unit tests (bun test + happy-dom)
bun run test:browsers   # every documented feature, in Chromium, Firefox and WebKit
bun run test:all        # all of the above, plus a production build
```

`bun run test:browsers` drives real engines through Playwright with the print dialog stubbed
out, and asserts on what *would* have been printed: the print types, headers and footers,
styles, ignored elements, json columns, image arrays, the modal, the callbacks, and the
new tab fallback. WebKit is run twice, once with an iPhone user agent, because that is the
engine behind Safari and every iOS browser.

Engines are installed once with `bunx playwright install`.

To try the library by hand:

```bash
bun run start
```

This builds an unminified bundle and serves `demo.html` on `http://localhost:8099`.

## Browser support (this fork)

Print.js prints from a hidden iframe. Some browsers can't do that:

| Browser | PDF | HTML / image / JSON |
| --- | --- | --- |
| Chrome, Edge, Opera (desktop) | hidden iframe | hidden iframe |
| Firefox (desktop) | hidden iframe (rendered with `opacity: 0`, required by Firefox) | hidden iframe |
| Safari (desktop) | opened in a new tab — Safari prints a blank page from an iframe | iframe, rendered but transparent (a hidden, zero sized frame prints blank) |
| iOS (Safari, Chrome, Firefox — all WebKit) | opened in a new tab | printed from a new window — an iframe print prints the parent page |
| Android (Chrome, Firefox) | opened in a new tab — no inline PDF viewer | hidden iframe |

When a new tab is used, `onIncompatibleBrowser()` is called so you can show a message.
The tab is opened during the click that called `printJS()`, otherwise the browser
blocks it as a popup — call `printJS()` directly from the event handler, not after
an `await`/`setTimeout`. If it is blocked anyway, `onError()` receives an explanatory error.

Override the behaviour with `fallbackToNewTab`:

```js
printJS({
  printable: 'docs/invoice.pdf',
  type: 'pdf',
  fallbackToNewTab: 'auto',  // default: decide per browser
  // fallbackToNewTab: true,  // always open a new tab
  // fallbackToNewTab: false, // always use the hidden iframe (pre-fork behaviour)
  onIncompatibleBrowser: () => alert('Use the print button in the tab that just opened.')
})
```

##### Building and trying it out

The toolchain is [Bun](https://bun.sh) — no webpack, no karma, no node-sass.

```bash
bun install
bun run build       # dist/print.js (global), print.mjs, print.cjs, react.mjs, print.css, types/
bun run start       # unminified build + http://localhost:8099/demo.html
```

`demo.html` covers all five print types and shows what the current browser is detected as.

## License

Print.js is available under the [MIT license](https://github.com/crabbly/Print.js/blob/master/LICENSE).
