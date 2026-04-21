<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const { t } = useI18n()

const dialogRef = ref<HTMLDivElement | null>(null)
const closeButtonRef = ref<HTMLButtonElement | null>(null)
let previouslyFocused: HTMLElement | null = null

const isOpen = computed(() => props.open)

function close() {
  emit('update:open', false)
}

function onKeydown(e: KeyboardEvent) {
  if (!isOpen.value) return
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
    return
  }
  if (e.key !== 'Tab') return
  const root = dialogRef.value
  if (!root) return
  const focusables = root.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
  )
  if (focusables.length === 0) return
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  const active = document.activeElement as HTMLElement | null
  if (e.shiftKey && active === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && active === last) {
    e.preventDefault()
    first.focus()
  }
}

function onBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) close()
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      previouslyFocused = (document.activeElement as HTMLElement) ?? null
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', onKeydown)
      nextTick(() => closeButtonRef.value?.focus())
    } else {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeydown)
      previouslyFocused?.focus?.()
      previouslyFocused = null
    }
  },
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKeydown)
})

const notationKeys = ['P', 'r', 'rm', 'n', 'M', 'g', 'gm', 'i', 'im', 'Bk', 'Ik', 'N'] as const
const assumptionKeys = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'] as const

const notationSymbolHtml: Record<string, string> = {
  P: 'P',
  r: 'r',
  rm: 'r<sub>m</sub>',
  n: 'n',
  M: 'M',
  g: 'g',
  gm: 'g<sub>m</sub>',
  i: 'i',
  im: 'i<sub>m</sub>',
  Bk: 'B<sub>k</sub>',
  Ik: 'I<sub>k</sub>',
  N: 'N',
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150 motion-reduce:transition-none"
      leave-active-class="transition-opacity duration-150 motion-reduce:transition-none"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm sm:items-center"
        @mousedown="onBackdropClick"
      >
        <div
          ref="dialogRef"
          role="dialog"
          aria-modal="true"
          aria-labelledby="methodology-title"
          class="methodology-dialog relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          <header class="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4 dark:border-slate-700">
            <h2 id="methodology-title" class="text-lg font-semibold">
              {{ t('methodology.title') }}
            </h2>
            <button
              ref="closeButtonRef"
              type="button"
              class="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-slate-400 dark:hover:bg-slate-800"
              :aria-label="t('methodology.close')"
              @click="close"
            >
              ✕
            </button>
          </header>

          <div class="max-h-[75vh] space-y-6 overflow-y-auto px-6 py-5 text-sm leading-relaxed">
            <p class="text-slate-600 dark:text-slate-300">{{ t('methodology.intro') }}</p>

            <section aria-labelledby="methodology-notation">
              <h3 id="methodology-notation" class="mb-2 text-base font-semibold">
                {{ t('methodology.notationTitle') }}
              </h3>
              <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                <template v-for="k in notationKeys" :key="k">
                  <dt class="font-mono text-slate-900 dark:text-slate-200" v-html="notationSymbolHtml[k]" />
                  <dd class="text-slate-600 dark:text-slate-400">
                    {{ t(`methodology.notation.${k}`) }}
                  </dd>
                </template>
              </dl>
            </section>

            <section aria-labelledby="methodology-section-a">
              <h3 id="methodology-section-a" class="mb-2 text-base font-semibold">
                {{ t('methodology.sectionA.title') }}
              </h3>
              <p class="mb-3 text-slate-600 dark:text-slate-300">{{ t('methodology.sectionA.intro') }}</p>

              <figure class="mb-3">
                <figcaption class="mb-1 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {{ t('methodology.sectionA.annuity') }}
                </figcaption>
                <math display="block" xmlns="http://www.w3.org/1998/Math/MathML">
                  <mi>M</mi><mo>=</mo>
                  <mfrac>
                    <mrow><mi>P</mi><mo>·</mo><msub><mi>r</mi><mi>m</mi></msub><mo>·</mo><msup><mrow><mo>(</mo><mn>1</mn><mo>+</mo><msub><mi>r</mi><mi>m</mi></msub><mo>)</mo></mrow><mi>n</mi></msup></mrow>
                    <mrow><msup><mrow><mo>(</mo><mn>1</mn><mo>+</mo><msub><mi>r</mi><mi>m</mi></msub><mo>)</mo></mrow><mi>n</mi></msup><mo>−</mo><mn>1</mn></mrow>
                  </mfrac>
                </math>
              </figure>

              <figure class="mb-3">
                <figcaption class="mb-1 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {{ t('methodology.sectionA.count') }}
                </figcaption>
                <math display="block" xmlns="http://www.w3.org/1998/Math/MathML">
                  <mi>n</mi><mo>=</mo>
                  <mfrac>
                    <mrow><mi>ln</mi><mo>(</mo><mi>M</mi><mo>/</mo><mo>(</mo><mi>M</mi><mo>−</mo><mi>P</mi><mo>·</mo><msub><mi>r</mi><mi>m</mi></msub><mo>)</mo><mo>)</mo></mrow>
                    <mrow><mi>ln</mi><mo>(</mo><mn>1</mn><mo>+</mo><msub><mi>r</mi><mi>m</mi></msub><mo>)</mo></mrow>
                  </mfrac>
                </math>
              </figure>

              <p class="mb-3 text-slate-600 dark:text-slate-300">{{ t('methodology.sectionA.rate') }}</p>

              <figure class="mb-3">
                <figcaption class="mb-1 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {{ t('methodology.sectionA.amort') }}
                </figcaption>
                <math display="block" xmlns="http://www.w3.org/1998/Math/MathML">
                  <msub><mi>I</mi><mi>k</mi></msub><mo>=</mo><msub><mi>B</mi><mrow><mi>k</mi><mo>−</mo><mn>1</mn></mrow></msub><mo>·</mo><msub><mi>r</mi><mi>m</mi></msub>
                  <mspace width="1em" />
                  <msub><mi>B</mi><mi>k</mi></msub><mo>=</mo><msub><mi>B</mi><mrow><mi>k</mi><mo>−</mo><mn>1</mn></mrow></msub><mo>−</mo><mo>(</mo><mi>M</mi><mo>−</mo><msub><mi>I</mi><mi>k</mi></msub><mo>)</mo>
                </math>
              </figure>

              <figure class="mb-3">
                <figcaption class="mb-1 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {{ t('methodology.sectionA.realInterest') }}
                </figcaption>
                <math display="block" xmlns="http://www.w3.org/1998/Math/MathML">
                  <msub><mi>I</mi><mi>real</mi></msub><mo>=</mo>
                  <munderover><mo>∑</mo><mrow><mi>k</mi><mo>=</mo><mn>1</mn></mrow><mi>N</mi></munderover>
                  <mfrac><msub><mi>I</mi><mi>k</mi></msub><msup><mrow><mo>(</mo><mn>1</mn><mo>+</mo><msub><mi>i</mi><mi>m</mi></msub><mo>)</mo></mrow><mi>k</mi></msup></mfrac>
                </math>
              </figure>

              <figure class="mb-3">
                <figcaption class="mb-1 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {{ t('methodology.sectionA.invest') }}
                </figcaption>
                <math display="block" xmlns="http://www.w3.org/1998/Math/MathML">
                  <msub><mi>B</mi><mi>k</mi></msub><mo>=</mo>
                  <mo>(</mo><msub><mi>B</mi><mrow><mi>k</mi><mo>−</mo><mn>1</mn></mrow></msub><mo>+</mo><msub><mi>C</mi><mi>k</mi></msub><mo>)</mo><mo>·</mo><mo>(</mo><mn>1</mn><mo>+</mo><msub><mi>g</mi><mi>m</mi></msub><mo>)</mo>
                </math>
              </figure>

              <figure class="mb-3">
                <figcaption class="mb-1 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {{ t('methodology.sectionA.realBalance') }}
                </figcaption>
                <math display="block" xmlns="http://www.w3.org/1998/Math/MathML">
                  <msubsup><mi>B</mi><mi>N</mi><mi>real</mi></msubsup><mo>=</mo>
                  <mfrac>
                    <msub><mi>B</mi><mi>N</mi></msub>
                    <msup><mrow><mo>(</mo><mn>1</mn><mo>+</mo><msub><mi>i</mi><mi>m</mi></msub><mo>)</mo></mrow><mi>N</mi></msup>
                  </mfrac>
                </math>
              </figure>

              <h4 class="mb-1 text-sm font-semibold">{{ t('methodology.sectionA.pathsTitle') }}</h4>
              <ul class="mb-3 list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-300">
                <li>{{ t('methodology.sectionA.pathInvest') }}</li>
                <li>{{ t('methodology.sectionA.pathPaydown') }}</li>
                <li>{{ t('methodology.sectionA.pathBoth') }}</li>
              </ul>

              <figure class="mb-3">
                <figcaption class="mb-1 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {{ t('methodology.sectionA.recast') }}
                </figcaption>
                <math display="block" xmlns="http://www.w3.org/1998/Math/MathML">
                  <msup><mi>M</mi><mo>′</mo></msup><mo>=</mo>
                  <mtext>annuity</mtext><mo>(</mo><mi>P</mi><mo>−</mo><mi>payoff</mi><mo>,</mo><mspace width="0.2em" /><mi>r</mi><mo>,</mo><mspace width="0.2em" /><mi>n</mi><mo>)</mo>
                </math>
              </figure>

              <p class="text-slate-600 dark:text-slate-300">{{ t('methodology.sectionA.winner') }}</p>
            </section>

            <section aria-labelledby="methodology-section-b">
              <h3 id="methodology-section-b" class="mb-2 text-base font-semibold">
                {{ t('methodology.sectionB.title') }}
              </h3>
              <p class="mb-3 text-slate-600 dark:text-slate-300">{{ t('methodology.sectionB.intro') }}</p>

              <figure class="mb-3">
                <figcaption class="mb-1 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {{ t('methodology.sectionB.phase1') }}
                </figcaption>
                <math display="block" xmlns="http://www.w3.org/1998/Math/MathML">
                  <msub><mi>C</mi><mi>k</mi></msub><mo>=</mo><mi>max</mi><mo>(</mo><mn>0</mn><mo>,</mo><mi>B</mi><mo>−</mo><mi>M</mi><mo>)</mo>
                  <mspace width="1em" />
                  <mtext>for</mtext>
                  <mspace width="0.3em" />
                  <mn>1</mn><mo>≤</mo><mi>k</mi><mo>≤</mo><mi>min</mi><mo>(</mo><mi>term</mi><mo>,</mo><mi>N</mi><mo>)</mo>
                </math>
              </figure>

              <figure class="mb-3">
                <figcaption class="mb-1 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {{ t('methodology.sectionB.phase2') }}
                </figcaption>
                <math display="block" xmlns="http://www.w3.org/1998/Math/MathML">
                  <msub><mi>C</mi><mi>k</mi></msub><mo>=</mo><mi>B</mi>
                  <mspace width="1em" />
                  <mtext>for</mtext>
                  <mspace width="0.3em" />
                  <mi>k</mi><mo>&gt;</mo><mi>term</mi>
                </math>
              </figure>

              <figure class="mb-3">
                <figcaption class="mb-1 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {{ t('methodology.sectionB.horizonCaption') }}
                </figcaption>
                <math display="block" xmlns="http://www.w3.org/1998/Math/MathML">
                  <mi>N</mi><mo>=</mo><mi>max</mi><mo>(</mo><msub><mi>n</mi><mi>long</mi></msub><mo>,</mo><msub><mi>n</mi><mi>short</mi></msub><mo>)</mo>
                </math>
              </figure>

              <p class="text-slate-600 dark:text-slate-300">{{ t('methodology.sectionB.strategies') }}</p>
            </section>

            <section aria-labelledby="methodology-section-c">
              <h3 id="methodology-section-c" class="mb-2 text-base font-semibold">
                {{ t('methodology.sectionC.title') }}
              </h3>
              <ul class="list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-300">
                <li v-for="k in assumptionKeys" :key="k">{{ t(`methodology.sectionC.${k}`) }}</li>
              </ul>
            </section>

            <p class="text-xs text-slate-500 dark:text-slate-400">{{ t('methodology.sources') }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.methodology-dialog math {
  font-size: 1.05em;
  overflow-x: auto;
  max-width: 100%;
  display: block;
}
</style>
