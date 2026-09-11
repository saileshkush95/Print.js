/** Static server for the demo site and the manual tests: `bun run serve` */
const port = Number(process.env.PORT || 8099)
const root = new URL('..', import.meta.url).pathname

Bun.serve({
  port,
  async fetch (request) {
    const url = new URL(request.url)
    const path = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname)
    const file = Bun.file(root + path.replace(/^\/+/, ''))

    if (await file.exists()) return new Response(file)

    return new Response('Not found: ' + path, { status: 404 })
  }
})

console.log(`Print.js demo: http://localhost:${port}`)
