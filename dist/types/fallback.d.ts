import type { PrintParams } from './types';
export declare function isFallbackRequired(params: PrintParams): boolean;
export declare function openFallbackWindow(url?: string): Window | null;
export declare function isWindowBlocked(newWindow: Window | null): boolean;
export declare function popupBlockedError(): Error;
/**
 * Last resort when the browser blocked the tab: ask the user for the click that
 * lets us open it. This is what a print job started after an await runs into,
 * since the original click is long gone by then.
 */
export declare function requestWindowFromUser(params: PrintParams, onWindow: (newWindow: Window) => void): void;
