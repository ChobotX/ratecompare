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

const notationAria: Record<string, string> = {
  P: 'capital P',
  r: 'lowercase r',
  rm: 'r sub m',
  n: 'lowercase n',
  M: 'capital M',
  g: 'lowercase g',
  gm: 'g sub m',
  i: 'lowercase i',
  im: 'i sub m',
  Bk: 'B sub k',
  Ik: 'I sub k',
  N: 'capital N',
}

const figureCls = 'mb-4'
const capCls = 'mb-1 text-[0.7rem] uppercase tracking-wider text-slate-500 dark:text-slate-400'
const formulaCls = 'flex flex-wrap items-center gap-x-2 gap-y-1 overflow-x-auto rounded border-l-2 border-sky-300 bg-slate-100 px-3 py-2 font-serif text-base text-slate-900 dark:border-sky-700 dark:bg-slate-800/60 dark:text-slate-100'
const fracCls = 'inline-flex flex-col items-center align-middle leading-tight'
const numCls = 'border-b border-current px-1.5 pb-0.5'
const denCls = 'px-1.5 pt-0.5'
const annotCls = 'italic text-slate-500 dark:text-slate-400'
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
          id="methodology-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="methodology-title"
          aria-describedby="methodology-intro"
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
              <span aria-hidden="true">✕</span>
            </button>
          </header>

          <div class="max-h-[75vh] space-y-6 overflow-y-auto px-6 py-5 text-sm leading-relaxed">
            <p id="methodology-intro" class="text-slate-600 dark:text-slate-300">{{ t('methodology.intro') }}</p>

            <section aria-labelledby="methodology-notation">
              <h3 id="methodology-notation" class="mb-2 text-base font-semibold">
                {{ t('methodology.notationTitle') }}
              </h3>
              <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                <template v-for="k in notationKeys" :key="k">
                  <dt class="font-mono text-slate-900 dark:text-slate-200" :aria-label="notationAria[k]" v-html="notationSymbolHtml[k]" />
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

              <figure :class="figureCls">
                <figcaption :class="capCls">{{ t('methodology.sectionA.annuity') }}</figcaption>
                <div :class="formulaCls" role="math" aria-label="M equals P times r sub m times open paren one plus r sub m close paren to the power of n, divided by open paren one plus r sub m close paren to the power of n minus one">
                  <span>M =</span>
                  <span :class="fracCls">
                    <span :class="numCls">P · r<sub>m</sub> · (1 + r<sub>m</sub>)<sup>n</sup></span>
                    <span :class="denCls">(1 + r<sub>m</sub>)<sup>n</sup> − 1</span>
                  </span>
                </div>
              </figure>

              <figure :class="figureCls">
                <figcaption :class="capCls">{{ t('methodology.sectionA.count') }}</figcaption>
                <div :class="formulaCls" role="math" aria-label="n equals natural log of M divided by open paren M minus P times r sub m close paren, divided by natural log of open paren one plus r sub m close paren">
                  <span>n =</span>
                  <span :class="fracCls">
                    <span :class="numCls">ln(M / (M − P · r<sub>m</sub>))</span>
                    <span :class="denCls">ln(1 + r<sub>m</sub>)</span>
                  </span>
                </div>
              </figure>

              <p class="mb-3 text-slate-600 dark:text-slate-300">{{ t('methodology.sectionA.rate') }}</p>

              <figure :class="figureCls">
                <figcaption :class="capCls">{{ t('methodology.sectionA.amort') }}</figcaption>
                <div :class="[formulaCls, 'flex-col items-start']" role="math" aria-label="I sub k equals B sub k minus one times r sub m. B sub k equals B sub k minus one minus open paren M minus I sub k close paren">
                  <span>I<sub>k</sub> = B<sub>k−1</sub> · r<sub>m</sub></span>
                  <span>B<sub>k</sub> = B<sub>k−1</sub> − (M − I<sub>k</sub>)</span>
                </div>
              </figure>

              <figure :class="figureCls">
                <figcaption :class="capCls">{{ t('methodology.sectionA.realInterest') }}</figcaption>
                <div :class="formulaCls" role="math" aria-label="I real equals sum from k equals one to N of I sub k divided by open paren one plus i sub m close paren to the power of k">
                  <span>I<sub>real</sub> =</span>
                  <span class="inline-flex flex-col items-center leading-none mx-1" aria-hidden="true">
                    <span class="text-[0.7rem]">N</span>
                    <span class="text-2xl leading-none">∑</span>
                    <span class="text-[0.7rem]">k=1</span>
                  </span>
                  <span :class="fracCls">
                    <span :class="numCls">I<sub>k</sub></span>
                    <span :class="denCls">(1 + i<sub>m</sub>)<sup>k</sup></span>
                  </span>
                </div>
              </figure>

              <figure :class="figureCls">
                <figcaption :class="capCls">{{ t('methodology.sectionA.invest') }}</figcaption>
                <div :class="formulaCls" role="math" aria-label="B sub k equals open paren B sub k minus one plus C sub k close paren times open paren one plus g sub m close paren">
                  <span>B<sub>k</sub> = (B<sub>k−1</sub> + C<sub>k</sub>) · (1 + g<sub>m</sub>)</span>
                </div>
              </figure>

              <figure :class="figureCls">
                <figcaption :class="capCls">{{ t('methodology.sectionA.realBalance') }}</figcaption>
                <div :class="formulaCls" role="math" aria-label="B sub N superscript real equals B sub N divided by open paren one plus i sub m close paren to the power of N">
                  <span>B<sub>N</sub><sup>real</sup> =</span>
                  <span :class="fracCls">
                    <span :class="numCls">B<sub>N</sub></span>
                    <span :class="denCls">(1 + i<sub>m</sub>)<sup>N</sup></span>
                  </span>
                </div>
              </figure>

              <h4 class="mb-1 text-sm font-semibold">{{ t('methodology.sectionA.pathsTitle') }}</h4>
              <ul class="mb-3 list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-300">
                <li>{{ t('methodology.sectionA.pathInvest') }}</li>
                <li>{{ t('methodology.sectionA.pathPaydown') }}</li>
                <li>{{ t('methodology.sectionA.pathBoth') }}</li>
              </ul>

              <figure :class="figureCls">
                <figcaption :class="capCls">{{ t('methodology.sectionA.recast') }}</figcaption>
                <div :class="formulaCls" role="math" aria-label="M prime equals annuity of open paren P minus payoff, r, n close paren">
                  <span>M′ = annuity(P − payoff, r, n)</span>
                </div>
              </figure>

              <p class="text-slate-600 dark:text-slate-300">{{ t('methodology.sectionA.winner') }}</p>
            </section>

            <section aria-labelledby="methodology-section-b">
              <h3 id="methodology-section-b" class="mb-2 text-base font-semibold">
                {{ t('methodology.sectionB.title') }}
              </h3>
              <p class="mb-3 text-slate-600 dark:text-slate-300">{{ t('methodology.sectionB.intro') }}</p>

              <figure :class="figureCls">
                <figcaption :class="capCls">{{ t('methodology.sectionB.phase1') }}</figcaption>
                <div :class="formulaCls" role="math" aria-label="C sub k equals max of zero and B minus M, for one less than or equal to k less than or equal to min of term and N">
                  <span>C<sub>k</sub> = max(0, B − M)</span>
                  <span :class="annotCls">for 1 ≤ k ≤ min(term, N)</span>
                </div>
              </figure>

              <figure :class="figureCls">
                <figcaption :class="capCls">{{ t('methodology.sectionB.phase2') }}</figcaption>
                <div :class="formulaCls" role="math" aria-label="C sub k equals B for k greater than term">
                  <span>C<sub>k</sub> = B</span>
                  <span :class="annotCls">for k &gt; term</span>
                </div>
              </figure>

              <figure :class="figureCls">
                <figcaption :class="capCls">{{ t('methodology.sectionB.horizonCaption') }}</figcaption>
                <div :class="formulaCls" role="math" aria-label="N equals max of n sub long and n sub short">
                  <span>N = max(n<sub>long</sub>, n<sub>short</sub>)</span>
                </div>
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
