export const SITE_URL = 'https://ratecompare.owebs.cz'
export const DEFAULT_LOCALE = 'en'
export const LOCALES = ['en', 'cs', 'de', 'sk', 'pl']
export const TABS = ['payoff', 'term']
export const DEFAULT_TAB = 'payoff'

const OG_IMAGE = `${SITE_URL}/og-image.png`

const SEO = {
  en: {
    lang: 'en',
    ogLocale: 'en_US',
    imageAlt: 'RateCompare — Loan vs Investment Simulator',
    payoff: {
      title: 'RateCompare — Loan vs Investment Simulator',
      description:
        'Interactive, inflation-adjusted calculator that compares paying down your loan against investing spare cash over the full loan horizon.',
      ogDescription:
        'Inflation-adjusted calculator comparing loan paydown, investing spare cash, or combining both — over the full loan horizon.',
    },
    term: {
      title: 'RateCompare — Loan Term Length: Long vs Short',
      description:
        'Compare a long loan with a lower monthly payment (invest the difference) against a short loan with invest-after-payoff — inflation-adjusted, over the full horizon.',
      ogDescription:
        'Long-term loan with invested surplus vs short-term loan with delayed investing — which builds more wealth when loan rate is below investment return?',
    },
  },
  cs: {
    lang: 'cs',
    ogLocale: 'cs_CZ',
    imageAlt: 'RateCompare — Simulátor úvěru vs investice',
    payoff: {
      title: 'RateCompare — Simulátor úvěru vs investice',
      description:
        'Interaktivní kalkulačka s inflačním očištěním, která porovnává doplacení úvěru s investováním volné hotovosti po celou dobu splácení.',
      ogDescription:
        'Porovnejte, zda se vyplatí úvěr doplatit, investovat volnou hotovost, nebo oba přístupy zkombinovat — reálně po inflaci.',
    },
    term: {
      title: 'RateCompare — Délka úvěru: dlouhý vs krátký',
      description:
        'Porovnejte dlouhý úvěr s nižší splátkou (rozdíl investovaný každý měsíc) proti krátkému úvěru s investováním až po doplacení — reálně po inflaci.',
      ogDescription:
        'Dlouhý úvěr s investováním rozdílu vs krátký úvěr s pozdějším investováním — co vybuduje víc, když je sazba úvěru nižší než výnos?',
    },
  },
  de: {
    lang: 'de',
    ogLocale: 'de_DE',
    imageAlt: 'RateCompare — Kredit- vs Investment-Simulator',
    payoff: {
      title: 'RateCompare — Kredit- vs Investment-Simulator',
      description:
        'Interaktiver, inflationsbereinigter Rechner: Kredittilgung gegen Investieren von überschüssigem Geld über die gesamte Kreditlaufzeit.',
      ogDescription:
        'Vergleichen Sie Kredittilgung, Investieren von überschüssigem Geld oder die Kombination aus beidem — inflationsbereinigt.',
    },
    term: {
      title: 'RateCompare — Kreditlaufzeit: lang vs kurz',
      description:
        'Vergleich: Langer Kredit mit niedriger Rate (Differenz investieren) gegen kurzen Kredit mit spätem Investieren — inflationsbereinigt.',
      ogDescription:
        'Langer Kredit + monatliche Investition vs kurzer Kredit + späteres Investieren — was bringt mehr, wenn der Kreditzins unter der Rendite liegt?',
    },
  },
  sk: {
    lang: 'sk',
    ogLocale: 'sk_SK',
    imageAlt: 'RateCompare — Simulátor úveru vs investície',
    payoff: {
      title: 'RateCompare — Simulátor úveru vs investície',
      description:
        'Interaktívna inflačne očistená kalkulačka, ktorá porovnáva doplatenie úveru s investovaním voľnej hotovosti počas celej doby splácania.',
      ogDescription:
        'Porovnajte, či sa oplatí úver doplatiť, investovať voľnú hotovosť alebo oba prístupy skombinovať — reálne po inflácii.',
    },
    term: {
      title: 'RateCompare — Dĺžka úveru: dlhý vs krátky',
      description:
        'Porovnajte dlhý úver s nižšou splátkou (rozdiel investovaný každý mesiac) proti krátkemu úveru s investovaním až po doplatení — reálne po inflácii.',
      ogDescription:
        'Dlhý úver s investovaním rozdielu vs krátky úver s neskorším investovaním — čo vybuduje viac, keď je sadzba úveru nižšia než výnos?',
    },
  },
  pl: {
    lang: 'pl',
    ogLocale: 'pl_PL',
    imageAlt: 'RateCompare — Symulator kredytu vs inwestycji',
    payoff: {
      title: 'RateCompare — Symulator kredytu vs inwestycji',
      description:
        'Interaktywny kalkulator uwzględniający inflację, który porównuje spłatę kredytu z inwestowaniem wolnych środków przez cały okres kredytowania.',
      ogDescription:
        'Porównaj spłatę kredytu, inwestowanie wolnych środków lub połączenie obu podejść — w ujęciu realnym po inflacji.',
    },
    term: {
      title: 'RateCompare — Długość kredytu: długi vs krótki',
      description:
        'Porównaj długi kredyt z niższą ratą (inwestuj różnicę) z krótkim kredytem i inwestowaniem po spłacie — z uwzględnieniem inflacji.',
      ogDescription:
        'Długi kredyt z inwestowaną różnicą vs krótki kredyt z późniejszym inwestowaniem — co buduje większy majątek, gdy oprocentowanie jest niższe niż zwrot?',
    },
  },
}

export function tabPath(tab) {
  return tab === DEFAULT_TAB ? '' : `${tab}/`
}

export function localeTabPath(locale, tab) {
  const base = locale === DEFAULT_LOCALE ? '/' : `/${locale}/`
  return base + tabPath(tab)
}

function tabMeta(locale, tab) {
  const entry = SEO[locale] || SEO[DEFAULT_LOCALE]
  return entry[tab] || entry[DEFAULT_TAB]
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeJsonLd(s) {
  return String(s).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
}

function renderJsonLd(locale, tab) {
  const entry = SEO[locale] || SEO[DEFAULT_LOCALE]
  const meta = tabMeta(locale, tab)
  const canonical = `${SITE_URL}${localeTabPath(locale, tab)}`
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'RateCompare',
    alternateName: meta.title,
    description: meta.description,
    url: canonical,
    inLanguage: entry.lang,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  }
  return `<script type="application/ld+json">${escapeJsonLd(JSON.stringify(data))}</script>`
}

export function renderSeoBlock(locale, tab = DEFAULT_TAB) {
  const entry = SEO[locale] || SEO[DEFAULT_LOCALE]
  const meta = tabMeta(locale, tab)
  const canonical = `${SITE_URL}${localeTabPath(locale, tab)}`

  const hreflangLinks = LOCALES.map(
    (l) => `<link rel="alternate" hreflang="${l}" href="${SITE_URL}${localeTabPath(l, tab)}" />`,
  ).join('\n    ')
  const xDefault = `<link rel="alternate" hreflang="x-default" href="${SITE_URL}${localeTabPath(DEFAULT_LOCALE, tab)}" />`

  const alternateOgLocales = LOCALES.filter((l) => l !== locale)
    .map((l) => `<meta property="og:locale:alternate" content="${SEO[l].ogLocale}" />`)
    .join('\n    ')

  return `<title>${escapeAttr(meta.title)}</title>
    <meta name="description" content="${escapeAttr(meta.description)}" />
    <link rel="canonical" href="${canonical}" />
    ${hreflangLinks}
    ${xDefault}

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="RateCompare" />
    <meta property="og:title" content="${escapeAttr(meta.title)}" />
    <meta property="og:description" content="${escapeAttr(meta.ogDescription)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeAttr(entry.imageAlt)}" />
    <meta property="og:locale" content="${entry.ogLocale}" />
    ${alternateOgLocales}

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttr(meta.title)}" />
    <meta name="twitter:description" content="${escapeAttr(meta.ogDescription)}" />
    <meta name="twitter:image" content="${OG_IMAGE}" />
    <meta name="twitter:image:alt" content="${escapeAttr(entry.imageAlt)}" />

    ${renderJsonLd(locale, tab)}`
}

export function renderLocaleHtml(template, locale, tab = DEFAULT_TAB) {
  const entry = SEO[locale] || SEO[DEFAULT_LOCALE]
  return template.replace('__SEO_LANG__', entry.lang).replace('<!--SEO-->', renderSeoBlock(locale, tab))
}
