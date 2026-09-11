/** Gives bun test a DOM, so the modules that touch document/window can run */
import { GlobalRegistrator } from '@happy-dom/global-registrator'

if (!(globalThis as any).document) {
  GlobalRegistrator.register({ url: 'http://localhost/' })
}

// Lets react-dom run updates inside act() without warning
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
