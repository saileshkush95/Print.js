import { describe, it, expect, beforeEach } from 'bun:test'
import Init from '../../src/init'

describe('printJS()', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('exposes an init function', () => {
    expect(typeof Init.init).toBe('function')
  })

  it('requires an argument', () => {
    expect(() => (Init.init as any)()).toThrow('printJS expects at least 1 attribute.')
  })

  it('rejects unexpected argument types', () => {
    expect(() => (Init.init as any)(42)).toThrow(/Unexpected argument type/)
  })

  it('rejects an unknown print type', () => {
    expect(() => Init.init({ printable: 'x', type: 'docx' as any })).toThrow(/Invalid print type/)
  })

  it('requires printable information', () => {
    expect(() => Init.init({ printable: null } as any)).toThrow('Missing printable information.')
  })

  it('creates a print frame with the configured id', () => {
    Init.init({ printable: '<p>hello</p>', type: 'raw-html', frameId: 'customFrame', onError: () => {} })
    expect(document.getElementById('customFrame')).not.toBeNull()
  })

  it('replaces a frame left over from a previous job', () => {
    Init.init({ printable: '<p>one</p>', type: 'raw-html', onError: () => {} })
    Init.init({ printable: '<p>two</p>', type: 'raw-html', onError: () => {} })

    expect(document.querySelectorAll('#printJS').length).toBe(1)
  })

  it('reports a missing html element through onError', () => {
    let error: any = null
    Init.init({ printable: 'does-not-exist', type: 'html', onError: (e) => { error = e } })

    expect(String(error)).toContain('Invalid HTML element id')
  })

  it('shows the modal when asked to', () => {
    Init.init({ printable: '<p>hello</p>', type: 'raw-html', showModal: true, modalMessage: 'Working...', onError: () => {} })

    const modal = document.getElementById('printJS-Modal')
    expect(modal).not.toBeNull()
    expect(modal!.textContent).toContain('Working...')
  })
})
