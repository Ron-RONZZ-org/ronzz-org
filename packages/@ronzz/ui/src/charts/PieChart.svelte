<script lang="ts">
  import { pieChart, defaultDimensions } from "@ronzz/ronstats-core/charts"
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
  let result = $derived(pieChart(datapoints, dim))

  // Center of the pie
  let cx = $derived(cw.width / 2)
  let cy = $derived(height / 2)
  let radius = $derived(Math.min(cw.width, height) / 2 - 40)

  // Compute SVG arc paths
  let arcs = $derived(
    result.arcs.map((a) => {
      const p1 = polarToCartesian(cx, cy, radius, a.startAngle)
      const p2 = polarToCartesian(cx, cy, radius, a.endAngle)
      const largeArc = a.endAngle - a.startAngle > Math.PI ? 1 : 0
      const path = [
        `M ${cx} ${cy}`,
        `L ${p1.x} ${p1.y}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
        "Z",
      ].join(" ")

      // Label position (mid-angle)
      const midAngle = a.startAngle + (a.endAngle - a.startAngle) / 2
      const labelR = radius * 0.65
      const lp = polarToCartesian(cx, cy, labelR, midAngle)
      const percentage = ((a.value / result.total) * 100).toFixed(1)

      return { key: a.key, path, labelX: lp.x, labelY: lp.y, percentage }
    }),
  )

  function polarToCartesian(
    cx: number,
    cy: number,
    r: number,
    angle: number,
  ): { x: number; y: number } {
    return {
      x: cx + r * Math.sin(angle),
      y: cy - r * Math.cos(angle),
    }
  }

  const colors = [
    "#3b82f6", "#ef4444", "#22c55e", "#f59e0b",
    "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
    "#6366f1", "#84cc16",
  ]
</script>

<div bind:this={cw.element} class="w-full">
  <svg width={cw.width} height={height} class="overflow-visible">
    {#each arcs as arc, i}
      <path
        d={arc.path}
        fill={colors[i % colors.length]}
        class="hover:opacity-80"
        stroke="white"
        stroke-width="2"
      >
        <title>{arc.key}: {(arc.percentage)}%</title>
      </path>
      {#if Number.parseFloat(arc.percentage) > 3}
        <text
          x={arc.labelX}
          y={arc.labelY}
          text-anchor="middle"
          dominant-baseline="central"
          class="fill-white text-xs font-medium"
        >
          {arc.percentage}%
        </text>
      {/if}
    {/each}

    <!-- Legend -->
    <g transform="translate({Math.max(cw.width - 120, cw.width * 0.75)}, 20)">
      {#each arcs as arc, i}
        <g transform="translate(0, {i * 20})">
          <rect width="10" height="10" fill={colors[i % colors.length]} rx="2" />
          <text x="16" y="9" class="fill-gray-600 text-xs">{arc.key}</text>
        </g>
      {/each}
    </g>

    {#if result.unit}
      <text
        x={cw.width - 10}
        y={height - 6}
        text-anchor="end"
        class="fill-gray-400 text-xs"
      >
        {result.unit}
      </text>
    {/if}
  </svg>
</div>
