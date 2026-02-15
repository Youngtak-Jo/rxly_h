/**
 * CSS Custom Highlight API type declarations.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API
 */

declare class Highlight {
  constructor(...ranges: AbstractRange[])
  add(range: AbstractRange): void
  delete(range: AbstractRange): boolean
  has(range: AbstractRange): boolean
  clear(): void
  readonly size: number
  priority: number
}

interface CSSHighlightsMap {
  set(name: string, highlight: Highlight): void
  get(name: string): Highlight | undefined
  has(name: string): boolean
  delete(name: string): boolean
  clear(): void
}

declare namespace CSS {
  const highlights: CSSHighlightsMap
}
