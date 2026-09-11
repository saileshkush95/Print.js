import type { PrintParams } from './types';
export declare function addWrapper(htmlData: string, params: PrintParams): string;
export declare function capitalizePrint(obj: string): string;
export declare function collectStyles(element: Element, params: PrintParams): string;
export declare function addHeader(printElement: HTMLElement, params: PrintParams): void;
export declare function addFooter(printElement: HTMLElement, params: PrintParams): void;
export declare function cleanUp(params: PrintParams): void;
export declare function isRawHTML(raw: string | null): boolean;
