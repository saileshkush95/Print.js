/**
 * Builds Print.js with Bun.
 *
 *   dist/print.js    UMD-ish bundle for <script> tags, exposes window.printJS
 *   dist/print.mjs   ES module (bundlers, `import printJS from 'print-js'`)
 *   dist/print.cjs   CommonJS (`require('print-js')`)
 *   dist/react.mjs   React hooks (`import { usePrint } from 'print-js/react'`)
 *   dist/react.cjs
 *   dist/print.css   compiled from src/sass
 *   dist/types/      .d.ts files, emitted by tsc (index.d.ts is the package entry)
 */
import { rm, mkdir } from 'node:fs/promises'
import { compile } from 'sass'

const outdir = 'dist'
const minify = !process.argv.includes('--no-minify')

await rm(outdir, { recursive: true, force: true })
await mkdir(outdir, { recursive: true })

type Target = {
  label: string
  entrypoints: string[]
  format: 'esm' | 'cjs' | 'iife'
  naming: string
  external?: string[]
}

const targets: Target[] = [
  { label: 'browser (window.printJS)', entrypoints: ['src/index.ts'], format: 'iife', naming: 'print.js' },
  { label: 'esm', entrypoints: ['src/index.ts'], format: 'esm', naming: 'print.mjs' },
  { label: 'cjs', entrypoints: ['src/index.ts'], format: 'cjs', naming: 'print.cjs' },
  { label: 'react esm', entrypoints: ['src/react/index.ts'], format: 'esm', naming: 'react.mjs', external: ['react'] },
  { label: 'react cjs', entrypoints: ['src/react/index.ts'], format: 'cjs', naming: 'react.cjs', external: ['react'] }
]

for (const target of targets) {
  const result = await Bun.build({
    entrypoints: target.entrypoints,
    outdir,
    format: target.format,
    naming: target.naming,
    external: target.external,
    target: 'browser',
    minify,
    sourcemap: 'linked'
  })

  if (!result.success) {
    console.error(`✗ ${target.label}`)
    for (const log of result.logs) console.error(log)
    process.exit(1)
  }

  const bytes = (await Bun.file(`${outdir}/${target.naming}`).arrayBuffer()).byteLength
  console.log(`✓ ${target.naming.padEnd(11)} ${(bytes / 1024).toFixed(1).padStart(6)} kb   ${target.label}`)
}

// Styles (modal + spinner)
const css = compile('src/sass/index.scss', { style: minify ? 'compressed' : 'expanded' })
await Bun.write(`${outdir}/print.css`, css.css)
console.log(`✓ print.css   ${(css.css.length / 1024).toFixed(1).padStart(6)} kb   modal + spinner styles`)

// Type declarations
const tsc = Bun.spawnSync(['bunx', 'tsc', '--project', 'tsconfig.json'], { stdout: 'inherit', stderr: 'inherit' })

if (tsc.exitCode !== 0) {
  console.error('✗ type declarations failed')
  process.exit(1)
}

console.log('✓ types/      .d.ts declarations for the package and the react hooks')
