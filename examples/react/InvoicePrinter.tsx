/**
 * Print.js React hooks, end to end.
 *
 *   bun add print-js react
 */
import { usePrint, usePrintPdf, usePrintJson } from 'print-js/react'
import 'print-js/dist/print.css'

type Person = { name: string; role: string; city: string }

const team: Person[] = [
  { name: 'Ada Lovelace', role: 'Engineer', city: 'London' },
  { name: 'Grace Hopper', role: 'Admiral', city: 'New York' }
]

export function InvoicePrinter () {
  // 1. Print a piece of this component: attach targetRef to any element
  const invoice = usePrint<HTMLDivElement>({
    type: 'html',
    targetStyles: ['*'],
    documentTitle: 'Invoice 1042',
    header: '<h3 style="text-align:center">Invoice</h3>'
  })

  // 2. Print a pdf, with the loading modal while it downloads
  const receipt = usePrintPdf('/docs/receipt.pdf', {
    showModal: true,
    modalMessage: 'Fetching your receipt…',
    // Safari, iOS and Android open the document in a tab instead
    onIncompatibleBrowser: () => console.info('Printed from a new tab')
  })

  // 3. Print data as a table
  const roster = usePrintJson<Person>(team, ['name', 'role', 'city'], { header: 'Team' })

  return (
    <main>
      <div ref={invoice.targetRef}>
        <h1>Invoice #1042</h1>
        <p>Acme Corp</p>
      </div>

      <button onClick={() => invoice.print()} disabled={invoice.isPrinting}>
        Print invoice
      </button>

      {/* per job overrides */}
      <button onClick={() => invoice.print({ header: null, footer: 'Copy' })}>
        Print without header
      </button>

      <button onClick={() => receipt.print()} disabled={receipt.isPrinting}>
        {receipt.isPrinting ? 'Preparing…' : 'Print receipt'}
      </button>

      <button onClick={() => roster.print()}>Print team</button>

      {receipt.error && <p role="alert">{receipt.error.message}</p>}
    </main>
  )
}
