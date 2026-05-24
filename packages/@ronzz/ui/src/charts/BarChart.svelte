<script lang="ts">
  import { onMount } from "svelte"
  import { barChart, defaultDimensions } from "@ronzz/ronstats-core/charts"
  import type { Datapoint } from "@ronzz/ronstats-core"

  let {
    datapoints,
    width: explicitWidth,
    height = 400,
  }: {
    datapoints: Datapoint[]
    width?: number
    height?: number
  } = $props()

  let container: HTMLDivElement
  let width = explicitWidth ?? 600

  onMount(() => {
    if (explicitWidth) return
    const ro = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width
    })
    ro.observe(container)
    return () => ro.disconnect()
  })

  let dim = $derived(defaultDimensions(width, height))
  let result = $derived(barChart(datapoints, dim))

  let innerH = $derived(dim.height - dim.margin.top - dim.margin.bottom)
</script>

<div bind:this={container} class="w-full">
  <svg width={width} height={height} class="overflow-visible">
    <!-- Y axis grid + labels -->
    <g transform="translate({dim.margin.left}, {dim.margin.top})">
      {#each result.yTicks as tick}
        <text
          x={-10}
          y={tick.value}
          text-anchor="end"
          class="fill-gray-500 text-xs"
        >
          {tick.label}
        </text>
        <line
          x1={0}
          y1={tick.value}
          x2={dim.width - dim.margin.left - dim.margin.right}
          y2={tick.value}
          class="stroke-gray-200"
          stroke-width="1"
        />
      {/each}

      <!-- Bars -->
      {#each result.bars as bar}
        <rect
          x={bar.x}
          y={bar.y}
          width={bar.width}
          height={bar.height}
          class="fill-blue-500 hover:fill-blue-600"
          rx="2"
        >
          <title>{bar.key}: {bar.value}</title>
        </rect>
      {/each}
    </g>

    <!-- X axis labels -->
    <g transform="translate({dim.margin.left}, {dim.margin.top + innerH})">
      {#each result.xTicks as tick}
        <text
          x={tick.value}
          y={14}
          text-anchor="end"
          transform="rotate(-30, {tick.value}, 14)"
          class="fill-gray-500 text-xs"
        >
          {tick.label}
        </text>
      {/each}
    </g>

    {#if result.unit}
      <text
        x={width - 10}
        y={14}
        text-anchor="end"
        class="fill-gray-400 text-xs"
      >
        {result.unit}
      </text>
    {/if}
  </svg>
</div>
