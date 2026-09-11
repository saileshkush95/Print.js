import type { PrintParams } from './types';
export declare function isFallbackRequired(params: PrintParams): boolean;
export declare function openFallbackWindow(url?: string): Window | null;
export declare function isWindowBlocked(newWindow: Window | null): boolean;
export declare function popupBlockedError(): Error;
