import { usePrint } from './usePrint'
import type { UsePrintOptions, UsePrintResult } from './usePrint'
import type { JsonProperty } from '../types'

/** Print a pdf file (url or base64 string) */
export function usePrintPdf (url?: string, options: UsePrintOptions = {}): UsePrintResult {
  return usePrint({ printable: url, type: 'pdf', ...options })
}

/** Print an html element: pass an id, or attach the returned `targetRef` */
export function usePrintHtml<T extends HTMLElement = HTMLElement> (
  elementId?: string,
  options: UsePrintOptions = {}
): UsePrintResult<T> {
  return usePrint<T>({ printable: elementId, type: 'html', ...options })
}

/** Print one image or an array of images */
export function usePrintImage (src?: string | string[], options: UsePrintOptions = {}): UsePrintResult {
  return usePrint({ printable: src, type: 'image', ...options })
}

/** Print json data as a table */
export function usePrintJson<T> (
  data?: T[],
  properties?: JsonProperty[],
  options: UsePrintOptions = {}
): UsePrintResult {
  return usePrint({ printable: data, type: 'json', properties, ...options })
}
