export function useContainerWidth(explicitWidth?: number | (() => number | undefined)) {
  let _element = $state<HTMLDivElement | null>(null)
  let _width = $state(
    typeof explicitWidth === "function" ? explicitWidth() ?? 600 : explicitWidth ?? 600,
  )

  $effect(() => {
    const w = typeof explicitWidth === "function" ? explicitWidth() : explicitWidth
    if (w != null) {
      _width = w
      return
    }
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
