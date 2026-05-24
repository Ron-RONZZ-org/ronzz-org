import { onMount } from "svelte"

export function useContainerWidth(explicitWidth?: number) {
  let _element = $state<HTMLDivElement | null>(null)
  let _width = $state(explicitWidth ?? 600)

  $effect(() => {
    if (explicitWidth != null) return
    if (!_element) return
    const ro = new ResizeObserver(([entry]) => {
      _width = entry.contentRect.width
    })
    ro.observe(_element)
    return () => ro.disconnect()
  })

  return {
    get element() {
      return _element
    },
    set element(v: HTMLDivElement | null) {
      _element = v
    },
    get width() {
      return _width
    },
  }
}
