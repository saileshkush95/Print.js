import { describe, it, expect } from 'bun:test'
import { addWrapper, capitalizePrint, isRawHTML, addHeader, addFooter } from '../../src/functions'
import type { PrintParams } from '../../src/types'

const params = (overrides: Partial<PrintParams> = {}): PrintParams => ({
  font: 'TimesNewRoman',
  font_size: '12px',
  header: null,
  headerStyle: 'font-weight: 300;',
  footer: null,
  footerStyle: 'font-weight: 300;',
  ...overrides
} as PrintParams)

describe('addWrapper()', () => {
  it('adds a div wrapper to raw html', () => {
    const p = params()
    expect(addWrapper('<span>Test</span>', p)).toBe(
      '<div style="font-family:' + p.font + ' !important; font-size: ' + p.font_size + ' !important; width:100%;"><span>Test</span></div>'
    )
  })
})

describe('capitalizePrint()', () => {
  it('capitalizes the first letter of a string', () => {
    expect(capitalizePrint('test')).toBe('Test')
  })
})

describe('isRawHTML()', () => {
  it('returns false for plain text', () => {
    expect(isRawHTML('My Header')).toBe(false)
  })

  it('returns true for html', () => {
    expect(isRawHTML('<h1>My HTML Header</h1>')).toBe(true)
  })

  it('returns false for null', () => {
    expect(isRawHTML(null)).toBe(false)
  })
})

describe('addHeader()', () => {
  it('inserts plain text as an h1 at the top of the element', () => {
    const element = document.createElement('div')
    element.innerHTML = '<p>body</p>'

    addHeader(element, params({ header: 'My Header' }))

    expect(element.firstElementChild!.innerHTML).toBe('<h1 style="font-weight: 300;">My Header</h1>')
  })

  it('inserts raw html as is', () => {
    const element = document.createElement('div')
    addHeader(element, params({ header: '<h3>Raw</h3>' }))

    expect(element.firstElementChild!.innerHTML).toBe('<h3>Raw</h3>')
  })
})

describe('addFooter()', () => {
  it('appends the footer after the content', () => {
    const element = document.createElement('div')
    element.innerHTML = '<p>body</p>'

    addFooter(element, params({ footer: 'My Footer' }))

    expect(element.lastElementChild!.innerHTML).toBe('<h1 style="font-weight: 300;">My Footer</h1>')
    expect(element.children.length).toBe(2)
  })
})
