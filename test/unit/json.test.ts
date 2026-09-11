import { describe, it, expect } from 'bun:test'
import Json from '../../src/json'
import type { PrintParams } from '../../src/types'

const baseParams = (overrides: Partial<PrintParams> = {}): PrintParams => ({
  printable: [{ name: 'Ada', address: { city: 'London' } }],
  type: 'json',
  properties: ['name'],
  repeatTableHeader: true,
  gridHeaderStyle: 'font-weight: bold;',
  gridStyle: 'border: 1px solid lightgray;',
  header: null,
  footer: null,
  printableElement: null,
  printableWindow: null,
  documentTitle: 'Document',
  onError: (e: any) => { throw e },
  ...overrides
} as PrintParams)

const frame = () => document.createElement('iframe')

describe('Json.print()', () => {
  it('rejects non object data', () => {
    expect(() => Json.print(baseParams({ printable: 'nope' }), frame())).toThrow(/Invalid javascript data object/)
  })

  it('rejects a non boolean repeatTableHeader', () => {
    expect(() => Json.print(baseParams({ repeatTableHeader: 'yes' as any }), frame())).toThrow(/repeatTableHeader/)
  })

  it('requires a properties array', () => {
    expect(() => Json.print(baseParams({ properties: null }), frame())).toThrow(/Invalid properties array/)
  })

  it('builds a table with a header row and the selected fields', () => {
    const params = baseParams()
    Json.print(params, frame())

    const html = params.printableElement!.innerHTML
    expect(html).toContain('<thead>')
    expect(html).toContain('Name')
    expect(html).toContain('Ada')
  })

  it('supports nested properties and custom column names', () => {
    const params = baseParams({
      properties: [{ field: 'address.city', displayName: 'city', columnSize: '50%' }]
    })
    Json.print(params, frame())

    const html = params.printableElement!.innerHTML
    expect(html).toContain('London')
    expect(html).toContain('City')
    expect(html).toContain('50%')
  })

  it('omits the thead when repeatTableHeader is false', () => {
    const params = baseParams({ repeatTableHeader: false })
    Json.print(params, frame())

    expect(params.printableElement!.innerHTML).not.toContain('<thead>')
  })
})
