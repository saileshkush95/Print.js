export type PrintType = 'pdf' | 'html' | 'image' | 'json' | 'raw-html'

/** A column of a json table: either a plain field name or a described column */
export type JsonProperty = string | {
  field: string
  displayName?: string
  columnSize?: string | number
}

/** A json column after Print.js has normalized it */
export interface NormalizedJsonProperty {
  field: string
  displayName: string
  columnSize: string
}

export interface PrintParams {
  /** pdf/image url, html element (or its id), raw html string, or json data */
  printable: any
  /** Alternative pdf url used by browsers that open the document in a new tab */
  fallbackPrintable: string | null
  type: PrintType
  header: string | null
  headerStyle: string
  footer: string | null
  footerStyle: string
  maxWidth: number
  properties: JsonProperty[] | NormalizedJsonProperty[] | null
  gridHeaderStyle: string
  gridStyle: string
  showModal: boolean
  onError: (error: any, xmlHttpRequest?: XMLHttpRequest) => void
  onLoadingStart: (() => void) | null
  onLoadingEnd: (() => void) | null
  onPrintDialogClose: () => void
  onIncompatibleBrowser: () => void
  modalMessage: string
  frameId: string
  frameRemoveDelay: number | null
  printableElement: HTMLElement | null
  documentTitle: string
  targetStyle: string[] | string
  targetStyles: string[] | string
  ignoreElements: string[] | string
  repeatTableHeader: boolean
  css: string | string[] | null
  style: string | null
  scanStyles: boolean
  base64: boolean

  /**
   * Browsers that can't print from a hidden iframe (Safari, iOS, Android) open
   * the document in a new tab instead. 'auto' decides per browser.
   */
  fallbackToNewTab: boolean | 'auto'
  /** Ask the fallback tab to open the print dialog by itself */
  printFromNewTab: boolean
  /** How long to wait for the document to render in the fallback tab, in ms */
  newTabPrintDelay: number
  /** Window used instead of the iframe, on browsers that need one (internal) */
  printableWindow: Window | null

  /** Called when a pdf is opened in a new tab instead of printed directly */
  onPdfOpen: (() => void) | null

  // Deprecated
  font: string
  font_size: string
  honorMarginPadding: boolean
  honorColor: boolean
  imageStyle: string
}

export type Configuration = Partial<PrintParams> & Pick<PrintParams, 'printable'>

export type PrintJS = {
  (configuration: Configuration): void
  (printable: string, type?: PrintType): void
}
