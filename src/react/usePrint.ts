import { useCallback, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import printJS from '../index'
import type { Configuration, PrintType } from '../types'

export interface UsePrintOptions extends Partial<Configuration> {}

export interface UsePrintResult<T extends HTMLElement = HTMLElement> {
  /**
   * Starts the print job. Call it directly from the event handler (not after an
   * await), so browsers that need to open a tab are still inside the user gesture.
   * Any option passed here overrides the ones given to the hook.
   */
  print: (overrides?: Partial<Configuration>) => void
  /** True while the document is being retrieved (pdf downloads, image loading) */
  isPrinting: boolean
  /** The last error reported by Print.js, if any */
  error: Error | null
  /** Clears the last error */
  reset: () => void
  /** Attach to the element you want to print, instead of passing `printable` */
  targetRef: MutableRefObject<T | null>
}

/**
 * Print anything Print.js supports from a React component.
 *
 * ```tsx
 * const { print, targetRef, isPrinting } = usePrint({ type: 'html' })
 *
 * return (
 *   <>
 *     <div ref={targetRef}>Invoice</div>
 *     <button onClick={() => print()} disabled={isPrinting}>Print</button>
 *   </>
 * )
 * ```
 */
export function usePrint<T extends HTMLElement = HTMLElement> (
  options: UsePrintOptions = {}
): UsePrintResult<T> {
  const [isPrinting, setIsPrinting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const targetRef = useRef<T | null>(null)

  // Keep the latest options without making `print` change on every render
  const optionsRef = useRef(options)
  optionsRef.current = options

  const reset = useCallback(() => setError(null), [])

  const print = useCallback((overrides: Partial<Configuration> = {}) => {
    const config = { ...optionsRef.current, ...overrides } as Configuration

    // Fall back to the element the ref is attached to
    if (config.printable === undefined || config.printable === null) {
      if (!targetRef.current) {
        const missing = new Error('usePrint: nothing to print. Pass `printable` or attach `targetRef` to an element.')
        setError(missing)
        if (config.onError) config.onError(missing)
        return
      }

      config.printable = targetRef.current
      config.type = (config.type || 'html') as PrintType
    }

    setError(null)
    setIsPrinting(true)

    const done = () => setIsPrinting(false)

    printJS({
      ...config,
      onLoadingStart: () => {
        setIsPrinting(true)
        if (config.onLoadingStart) config.onLoadingStart()
      },
      onLoadingEnd: () => {
        done()
        if (config.onLoadingEnd) config.onLoadingEnd()
      },
      onError: (err: any, xhr?: XMLHttpRequest) => {
        done()
        setError(err instanceof Error ? err : new Error(String(err)))

        // Print.js throws by default, which would break the React event handler
        if (config.onError) config.onError(err, xhr)
      },
      onPrintDialogClose: () => {
        done()
        if (config.onPrintDialogClose) config.onPrintDialogClose()
      }
    })

    // Jobs without a loading phase (html, json, raw-html, image) never call
    // onLoadingEnd, so release the flag once the print dialog has been requested
    if (config.type !== 'pdf' && !config.showModal) {
      setTimeout(done, 1500)
    }
  }, [])

  return { print, isPrinting, error, reset, targetRef }
}

export default usePrint
