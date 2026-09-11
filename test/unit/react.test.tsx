import { describe, it, expect, beforeEach } from 'bun:test'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { usePrint, usePrintJson } from '../../src/react'

function render (element: React.ReactElement): HTMLElement {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  act(() => { root.render(element) })

  return container
}

describe('usePrint()', () => {
  beforeEach(() => { document.body.innerHTML = '' })

  it('prints the element the ref is attached to', () => {
    function Invoice () {
      const { print, targetRef, isPrinting } = usePrint<HTMLDivElement>({ type: 'html', scanStyles: false, onError: () => {} })

      return (
        <>
          <div ref={targetRef} id="invoice">Invoice #1042</div>
          <button onClick={() => print()}>{isPrinting ? 'Printing' : 'Print'}</button>
        </>
      )
    }

    const container = render(<Invoice />)
    const button = container.querySelector('button')!

    act(() => { button.click() })

    // Print.js builds its print frame as soon as the job starts
    expect(document.getElementById('printJS')).not.toBeNull()
  })

  it('reports when there is nothing to print', () => {
    let reported: Error | null = null

    function Empty () {
      const { print, error } = usePrint({ type: 'html' })
      reported = error

      return <button onClick={() => print()}>Print</button>
    }

    const container = render(<Empty />)

    act(() => { container.querySelector('button')!.click() })

    expect(String(reported)).toContain('nothing to print')
  })

  it('passes per job overrides on to Print.js', () => {
    let title: string | null = null

    function Job () {
      const { print } = usePrint({ type: 'raw-html', printable: '<p>hi</p>', onError: () => {} })

      return (
        <button onClick={() => {
          print({ frameId: 'overriddenFrame' })
          title = document.getElementById('overriddenFrame') ? 'used' : 'ignored'
        }}>Print</button>
      )
    }

    const container = render(<Job />)
    act(() => { container.querySelector('button')!.click() })

    expect(title).toBe('used')
  })
})

describe('usePrintJson()', () => {
  it('builds a job from data and properties', () => {
    let frameFound = false

    function Table () {
      const { print } = usePrintJson([{ name: 'Ada' }], ['name'], { onError: () => {} })

      return (
        <button onClick={() => {
          print()
          frameFound = !!document.getElementById('printJS')
        }}>Print</button>
      )
    }

    const container = render(<Table />)
    act(() => { container.querySelector('button')!.click() })

    expect(frameFound).toBe(true)
  })
})
