import type { UsePrintOptions, UsePrintResult } from './usePrint';
import type { JsonProperty } from '../types';
/** Print a pdf file (url or base64 string) */
export declare function usePrintPdf(url?: string, options?: UsePrintOptions): UsePrintResult;
/** Print an html element: pass an id, or attach the returned `targetRef` */
export declare function usePrintHtml<T extends HTMLElement = HTMLElement>(elementId?: string, options?: UsePrintOptions): UsePrintResult<T>;
/** Print one image or an array of images */
export declare function usePrintImage(src?: string | string[], options?: UsePrintOptions): UsePrintResult;
/** Print json data as a table */
export declare function usePrintJson<T>(data?: T[], properties?: JsonProperty[], options?: UsePrintOptions): UsePrintResult;
