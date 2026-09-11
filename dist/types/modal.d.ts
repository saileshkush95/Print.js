import type { PrintParams } from './types';
declare const Modal: {
    overlayStyle: string;
    show(params: PrintParams): void;
    /**
     * Shown when the browser blocked the tab we need to print from. A print job
     * started after an await (a download, a poll) is no longer inside the click
     * that triggered it, and browsers only open tabs during a user gesture, so
     * the document is offered behind a button the user can actually click.
     */
    prompt(params: PrintParams, message: string, label: string, onConfirm: () => void): void;
    close(): void;
};
export default Modal;
