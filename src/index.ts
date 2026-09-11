import print from './init'
import type { PrintJS } from './types'

const printJS = print.init as PrintJS

if (typeof window !== 'undefined') {
  ;(window as any).printJS = printJS
}

export default printJS
export { printJS }
export type {
  Configuration,
  PrintType,
  PrintJS,
  PrintParams,
  JsonProperty,
  NormalizedJsonProperty
} from './types'
