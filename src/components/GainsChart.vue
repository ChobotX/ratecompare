<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export interface ChartSeries {
  key: string
  label: string
  color: string
  data: number[]
  dashed?: boolean
}

const props = defineProps<{
  series: ChartSeries[]
  horizonMonths: number
  title?: string
}>()

const { t, locale } = useI18n()

const W = 800
const H = 320
const PAD_L = 64
const PAD_R = 16
const PAD_T = 16
const PAD_B = 36

const chartTitle = computed(() => props.title ?? t('gainsOverTimeTitle'))

const maxMonths = computed(() => Math.max(1, props.horizonMonths))
const maxValue = computed(() => {
  const all = props.series.flatMap((s) => s.data)
  return Math.max(1, ...all)
})

const xScale = (m: number) => PAD_L + (m / maxMonths.value) * (W - PAD_L - PAD_R)
const yScale = (v: number) => PAD_T + (1 - v / maxValue.value) * (H - PAD_T - PAD_B)

const polylines = computed(() =>
  props.series.map((s) => ({
    ...s,
    points: s.data.map((v, i) => `${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' '),
  })),
)

const fmtCompact = (value: number): string =>
  new Intl.NumberFormat(locale.value, { notation: 'compact', maximumFractionDigits: 1 }).format(value)

const yTicks = computed(() => {
  const steps = 4
  return Array.from({ length: steps + 1 }, (_, i) => {
    const v = (maxValue.value * i) / steps
    return { v, y: yScale(v) }
  })
})

const xTicks = computed(() => {
  const months = maxMonths.value
  const yearStep = months > 240 ? 60 : months > 120 ? 36 : months > 60 ? 24 : 12
  const out: Array<{ m: number; x: number; label: string }> = []
  for (let m = 0; m <= months; m += yearStep) {
    out.push({ m, x: xScale(m), label: String(Math.round(m / 12)) + 'y' })
  }
  if (out[out.length - 1].m !== months) {
    out.push({ m: months, x: xScale(months), label: String(Math.round(months / 12)) + 'y' })
  }
  return out
})

</script>

<template>
  <figure class="mt-6" :aria-labelledby="`chart-caption-${chartTitle}`">
    <figcaption :id="`chart-caption-${chartTitle}`" class="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">{{ chartTitle }}</figcaption>
    <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="xMidYMid meet" class="w-full h-auto" role="img">
      <title>{{ chartTitle }}</title>
      <g class="text-slate-400 dark:text-slate-500">
        <line v-for="t_ in yTicks" :key="'gy'+t_.v" :x1="PAD_L" :x2="W - PAD_R" :y1="t_.y" :y2="t_.y" stroke="currentColor" stroke-opacity="0.2" />
      </g>
      <g class="text-slate-500 dark:text-slate-400" font-size="11">
        <text v-for="t_ in yTicks" :key="'yt'+t_.v" :x="PAD_L - 6" :y="t_.y + 3" text-anchor="end" fill="currentColor">{{ fmtCompact(t_.v) }}</text>
        <text v-for="t_ in xTicks" :key="'xt'+t_.m" :x="t_.x" :y="H - PAD_B + 16" text-anchor="middle" fill="currentColor">{{ t_.label }}</text>
      </g>
      <g class="text-slate-400 dark:text-slate-500">
        <line :x1="PAD_L" :y1="PAD_T" :x2="PAD_L" :y2="H - PAD_B" stroke="currentColor" stroke-opacity="0.4" />
        <line :x1="PAD_L" :y1="H - PAD_B" :x2="W - PAD_R" :y2="H - PAD_B" stroke="currentColor" stroke-opacity="0.4" />
      </g>
      <polyline
        v-for="s in polylines"
        :key="s.key"
        :points="s.points"
        fill="none"
        :stroke="s.color"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
        :stroke-dasharray="s.dashed ? '6 4' : undefined"
      />
    </svg>
    <ul class="mt-2 flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-300">
      <li v-for="s in series" :key="s.key" class="flex items-center gap-2">
        <span
          class="inline-block h-0 w-4"
          :style="s.dashed ? { borderTop: `2px dashed ${s.color}` } : { borderTop: `2px solid ${s.color}` }"
          aria-hidden="true"
        />
        {{ s.label }}
      </li>
    </ul>
  </figure>
</template>
