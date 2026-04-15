<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'

defineProps<{ text: string }>()

type Position = 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
const DEFAULT_POSITION: Position = 'top'
const SAFE_MARGIN = 50
const OFFSET = 10

const show = ref(false)
const activator = ref<HTMLElement | null>(null)
const tooltip = ref<HTMLElement | null>(null)
const tooltipPosition = ref<{ top: number; left: number; actualPosition: Position }>({
  top: 0,
  left: 0,
  actualPosition: DEFAULT_POSITION,
})

const getTooltipPosition = (): { top: number; left: number; actualPosition: Position } => {
  if (!activator.value || !tooltip.value) {
    return { top: 0, left: 0, actualPosition: DEFAULT_POSITION }
  }

  const { top, left, right, bottom, width: activatorWidth, height: activatorHeight } =
    activator.value.getBoundingClientRect()
  const { width: tooltipWidth, height: tooltipHeight } = tooltip.value.getBoundingClientRect()

  const isHittingRightLimit = right + tooltipWidth > window.innerWidth - SAFE_MARGIN
  const isHittingLeftLimit = left - tooltipWidth < SAFE_MARGIN
  const isHittingTopLimit = top - tooltipHeight < SAFE_MARGIN
  const isHittingBottomLimit = bottom + tooltipHeight > window.innerHeight - SAFE_MARGIN

  let actualPosition: Position
  switch (true) {
    case isHittingRightLimit && isHittingTopLimit:
      actualPosition = 'bottom-left'
      break
    case isHittingRightLimit && isHittingBottomLimit:
      actualPosition = 'top-left'
      break
    case isHittingLeftLimit && isHittingTopLimit:
      actualPosition = 'bottom-right'
      break
    case isHittingLeftLimit && isHittingBottomLimit:
      actualPosition = 'top-right'
      break
    case isHittingRightLimit:
      actualPosition = 'left'
      break
    case isHittingLeftLimit:
      actualPosition = 'right'
      break
    case isHittingTopLimit:
      actualPosition = 'bottom'
      break
    case isHittingBottomLimit:
      actualPosition = 'top'
      break
    default:
      actualPosition = DEFAULT_POSITION
      break
  }

  switch (actualPosition) {
    case 'left':
      return {
        top: window.scrollY + top + activatorHeight / 2 - tooltipHeight / 2,
        left: window.scrollX + left - tooltipWidth - OFFSET,
        actualPosition,
      }
    case 'right':
      return {
        top: window.scrollY + top + activatorHeight / 2 - tooltipHeight / 2,
        left: window.scrollX + right + OFFSET,
        actualPosition,
      }
    case 'top':
      return {
        top: window.scrollY + top - tooltipHeight - OFFSET,
        left: window.scrollX + left + activatorWidth / 2 - tooltipWidth / 2,
        actualPosition,
      }
    case 'bottom':
      return {
        top: window.scrollY + bottom + OFFSET,
        left: window.scrollX + left + activatorWidth / 2 - tooltipWidth / 2,
        actualPosition,
      }
    case 'bottom-left':
      return {
        top: window.scrollY + bottom + OFFSET,
        left: window.scrollX + left - tooltipWidth + activatorWidth + OFFSET,
        actualPosition,
      }
    case 'bottom-right':
      return {
        top: window.scrollY + bottom + OFFSET,
        left: window.scrollX + right - activatorWidth - OFFSET,
        actualPosition,
      }
    case 'top-left':
      return {
        top: window.scrollY + top - tooltipHeight - OFFSET,
        left: window.scrollX + left - tooltipWidth + activatorWidth + OFFSET,
        actualPosition,
      }
    case 'top-right':
      return {
        top: window.scrollY + top - tooltipHeight - OFFSET,
        left: window.scrollX + right - activatorWidth - OFFSET,
        actualPosition,
      }
  }
}

const updateTooltipPosition = () => {
  tooltipPosition.value = getTooltipPosition()
}

const onViewportChange = () => {
  if (show.value) {
    updateTooltipPosition()
  }
}

const showTooltip = async () => {
  show.value = true
  await nextTick()
  updateTooltipPosition()
  window.addEventListener('resize', onViewportChange)
  window.addEventListener('scroll', onViewportChange, true)
}

const hideTooltip = () => {
  show.value = false
  window.removeEventListener('resize', onViewportChange)
  window.removeEventListener('scroll', onViewportChange, true)
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', onViewportChange)
  window.removeEventListener('scroll', onViewportChange, true)
})
</script>

<template>
  <span
    ref="activator"
    class="relative inline-flex items-center"
    @mouseenter="showTooltip"
    @mouseleave="hideTooltip"
  >
    <button
      type="button"
      class="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-400 text-[10px] font-bold text-slate-500 dark:border-slate-500 dark:text-slate-300"
      @focus="showTooltip"
      @blur="hideTooltip"
    >
      ?
    </button>
    <Teleport to="body">
      <span
        ref="tooltip"
        :data-position="tooltipPosition.actualPosition"
        class="atx-like-tooltip pointer-events-none absolute z-[9999] w-72 max-w-[calc(100vw-1rem)] rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-700 shadow-xl whitespace-normal break-words transition-opacity duration-150 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
        :style="{ top: `${tooltipPosition.top}px`, left: `${tooltipPosition.left}px` }"
        :class="show ? 'opacity-100 visible' : 'opacity-0 invisible'"
      >
        {{ text }}
      </span>
    </Teleport>
  </span>
</template>
