<script lang="ts">
  import { lineChart, defaultDimensions } from "@ronzz/ronstats-core/charts"
  import type { Datapoint } from "@ronzz/ronstats-core"
  import { useContainerWidth } from "./useContainerWidth.svelte.js"

  let {
    datapoints,
    width: explicitWidth,
    height = 400,
  }: {
    datapoints: Datapoint[]
    width?: number
    height?: number
  } = $props()

  let cw = useContainerWidth(() => explicitWidth)

  let dim = $derived(defaultDimensions(cw.width, height))
  let result = $derived(lineChart(datapoints, dim))

  let innerH = $derived(dim.height - dim.margin.top - dim.margin.bottom)
</script>

<div bind:this={cw.element} class="w-full">
  <svg width={cw.width} height={height} class="overflow-visible">
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

      <!-- Line path -->
      <path
        d={result.path}
        class="stroke-blue-500 fill-none"
        stroke-width="2"
      />
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
        x={cw.width - 10}
        y={14}
        text-anchor="end"
        class="fill-gray-400 text-xs"
      >
        {result.unit}
      </text>
    {/if}
  </svg>
</div>
