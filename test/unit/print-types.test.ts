import { describe, it, expect, beforeEach } from 'bun:test'
import Html from '../../src/html'
import Image from '../../src/image'
import RawHtml from '../../src/raw-html'
import Pdf from '../../src/pdf'
import Print from '../../src/print'
import Modal from '../../src/modal'
import type { PrintParams } from '../../src/types'

const params = (overrides: Partial<PrintParams> = {}): PrintParams => ({
  printable: null,
  type: 'html',
  header: null,
  headerStyle: 'font-weight: 300;',
  footer: null,
  footerStyle: 'font-weight: 300;',
  maxWidth: 800,
  scanStyles: false,
  ignoreElements: [],
  targetStyle: [],
  targetStyles: [],
  imageStyle: 'max-width: 100%;',
  font: 'TimesNewRoman',
  font_size: '12pt',
  documentTitle: 'Document',
  modalMessage: 'Retrieving Document...',
  printableElement: null,
  printableWindow: null,
  frameId: 'printJS',
  showModal: false,
  onError: (e: any) => { throw e },
  ...overrides
} as PrintParams)

const frame = () => document.createElement('iframe')

describe('modules', () => {
  it('all expose a print method', () => {
    expect(typeof Html.print).toBe('function')
    expect(typeof Image.print).toBe('function')
    expect(typeof RawHtml.print).toBe('function')
    expect(typeof Pdf.print).toBe('function')
    expect(typeof Pdf.printInNewTab).toBe('function')
    expect(typeof Print.send).toBe('function')
  })
})

describe('Html.print()', () => {
  beforeEach(() => { document.body.innerHTML = '' })

  it('clones the target element by id', () => {
    document.body.innerHTML = '<div id="target"><p>keep</p></div>'
    const p = params({ printable: 'target' })

    Html.print(p, frame())

    expect(p.printableElement!.innerHTML).toContain('keep')
  })

  it('accepts an element instead of an id', () => {
    const element = document.createElement('div')
    element.innerHTML = '<span>from element</span>'
    document.body.appendChild(element)

    const p = params({ printable: element })
    Html.print(p, frame())

    expect(p.printableElement!.innerHTML).toContain('from element')
  })

  it('skips the ids listed in ignoreElements', () => {
    document.body.innerHTML = '<div id="target"><p id="skip">drop</p><p>keep</p></div>'
    const p = params({ printable: 'target', ignoreElements: ['skip'] })

    Html.print(p, frame())

    expect(p.printableElement!.innerHTML).not.toContain('drop')
    expect(p.printableElement!.innerHTML).toContain('keep')
  })

  it('carries over the value of form fields', () => {
    document.body.innerHTML = '<div id="target"><input id="field"><textarea id="area"></textarea></div>'
    ;(document.getElementById('field') as HTMLInputElement).value = 'typed'
    ;(document.getElementById('area') as HTMLTextAreaElement).value = 'notes'

    const p = params({ printable: 'target' })
    Html.print(p, frame())

    const input = p.printableElement!.querySelector('input') as HTMLInputElement
    const area = p.printableElement!.querySelector('textarea') as HTMLTextAreaElement
    expect(input.value).toBe('typed')
    expect(area.value).toBe('notes')
  })
})

describe('Image.print()', () => {
  it('accepts a single image and an array of images', () => {
    const one = params({ printable: 'a.jpg', type: 'image' })
    Image.print(one, frame())
    expect(one.printableElement!.querySelectorAll('img').length).toBe(1)

    const many = params({ printable: ['a.jpg', 'b.jpg', 'c.jpg'], type: 'image' })
    Image.print(many, frame())
    expect(many.printableElement!.querySelectorAll('img').length).toBe(3)
  })

  it('adds the header and footer around the images', () => {
    const p = params({ printable: 'a.jpg', type: 'image', header: 'Top', footer: 'Bottom' })
    Image.print(p, frame())

    expect(p.printableElement!.firstElementChild!.textContent).toBe('Top')
    expect(p.printableElement!.lastElementChild!.textContent).toBe('Bottom')
  })
})

describe('RawHtml.print()', () => {
  it('uses the raw string as the printable content', () => {
    const p = params({ printable: '<h3>raw</h3>', type: 'raw-html' })
    RawHtml.print(p, frame())

    expect(p.printableElement!.innerHTML).toContain('<h3>raw</h3>')
  })
})

describe('Pdf.printInNewTab()', () => {
  it('reports a blocked popup through onError', () => {
    let error: any = null
    const p = params({ printable: 'file.pdf', type: 'pdf', onError: (e) => { error = e } })

    Pdf.printInNewTab(p, null)

    expect(String(error)).toContain('allow popups')
  })

  it('sends the document to the tab and reports it as opened', () => {
    const navigated: string[] = []
    let pdfOpened = false
    let incompatible = false

    const tab = {
      closed: false,
      focus () {},
      addEventListener () {},
      print () {},
      location: { set href (value: string) { navigated.push(value) } }
    } as unknown as Window

    const p = params({
      printable: 'docs/file.pdf',
      type: 'pdf',
      printFromNewTab: false,
      onPdfOpen: () => { pdfOpened = true },
      onIncompatibleBrowser: () => { incompatible = true }
    })

    Pdf.printInNewTab(p, tab)

    expect(navigated[0]).toContain('/docs/file.pdf')
    expect(pdfOpened).toBe(true)
    expect(incompatible).toBe(true)
  })
})

describe('Modal', () => {
  it('opens and closes', () => {
    Modal.show(params({ modalMessage: 'Loading...' }))
    expect(document.getElementById('printJS-Modal')).not.toBeNull()

    Modal.close()
    expect(document.getElementById('printJS-Modal')).toBeNull()
  })
})
