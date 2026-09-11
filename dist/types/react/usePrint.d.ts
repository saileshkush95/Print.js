import type { MutableRefObject } from 'react';
import type { Configuration } from '../types';
export interface UsePrintOptions extends Partial<Configuration> {
}
export interface UsePrintResult<T extends HTMLElement = HTMLElement> {
    /**
     * Starts the print job. Call it directly from the event handler (not after an
     * await), so browsers that need to open a tab are still inside the user gesture.
     * Any option passed here overrides the ones given to the hook.
     */
    print: (overrides?: Partial<Configuration>) => void;
    /** True while the document is being retrieved (pdf downloads, image loading) */
    isPrinting: boolean;
    /** The last error reported by Print.js, if any */
    error: Error | null;
    /** Clears the last error */
    reset: () => void;
    /** Attach to the element you want to print, instead of passing `printable` */
    targetRef: MutableRefObject<T | null>;
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
export declare function usePrint<T extends HTMLElement = HTMLElement>(options?: UsePrintOptions): UsePrintResult<T>;
export default usePrint;
