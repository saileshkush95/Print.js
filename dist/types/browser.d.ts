declare const Browser: {
    isFirefox: () => boolean;
    getFirefoxMajorVersion: (ua?: string) => number | undefined;
    isIE: () => boolean;
    isEdge: () => boolean;
    isChrome: (context?: any) => boolean;
    isChromium: () => boolean;
    isSafari: () => boolean;
    isIOSChrome: () => boolean;
    isIOS: () => boolean;
    isAndroid: () => boolean;
    isMobile: () => boolean;
    canPrintPdfFromIframe: () => boolean;
    canPrintHtmlFromIframe: () => boolean;
    requiresRenderedFrame: () => boolean;
};
export default Browser;
