export const SITE_URL = 'https://ratecompare.owebs.cz'
export const DEFAULT_LOCALE = 'en'
export const LOCALES = ['en', 'cs', 'de', 'sk', 'pl']

const OG_IMAGE = `${SITE_URL}/og-image.svg`

const SEO = {
  en: {
    lang: 'en',
    ogLocale: 'en_US',
    title: 'RateCompare — Loan vs Investment Simulator',
    description:
      'Interactive, inflation-adjusted calculator that compares paying down your loan against investing spare cash over the full loan horizon.',
    ogDescription:
      'Inflation-adjusted calculator comparing loan paydown, investing spare cash, or combining both — over the full loan horizon.',
    imageAlt: 'RateCompare — Loan vs Investment Simulator',
  },
  cs: {
    lang: 'cs',
    ogLocale: 'cs_CZ',
    title: 'RateCompare — Simulátor úvěru vs investice',
    description:
      'Interaktivní kalkulačka s inflačním očištěním, která porovnává doplacení úvěru s investováním volné hotovosti po celou dobu splácení.',
    ogDescription:
      'Porovnejte, zda se vyplatí úvěr doplatit, investovat volnou hotovost, nebo oba přístupy zkombinovat — reálně po inflaci.',
    imageAlt: 'RateCompare — Simulátor úvěru vs investice',
  },
  de: {
    lang: 'de',
    ogLocale: 'de_DE',
    title: 'RateCompare — Kredit- vs Investment-Simulator',
    description:
      'Interaktiver, inflationsbereinigter Rechner: Kredittilgung gegen Investieren von überschüssigem Geld über die gesamte Kreditlaufzeit.',
    ogDescription:
      'Vergleichen Sie Kredittilgung, Investieren von überschüssigem Geld oder die Kombination aus beidem — inflationsbereinigt.',
    imageAlt: 'RateCompare — Kredit- vs Investment-Simulator',
  },
  sk: {
    lang: 'sk',
    ogLocale: 'sk_SK',
    title: 'RateCompare — Simulátor úveru vs investície',
    description:
      'Interaktívna inflačne očistená kalkulačka, ktorá porovnáva doplatenie úveru s investovaním voľnej hotovosti počas celej doby splácania.',
    ogDescription:
      'Porovnajte, či sa oplatí úver doplatiť, investovať voľnú hotovosť alebo oba prístupy skombinovať — reálne po inflácii.',
    imageAlt: 'RateCompare — Simulátor úveru vs investície',
  },
  pl: {
    lang: 'pl',
    ogLocale: 'pl_PL',
    title: 'RateCompare — Symulator kredytu vs inwestycji',
    description:
      'Interaktywny kalkulator uwzględniający inflację, który porównuje spłatę kredytu z inwestowaniem wolnych środków przez cały okres kredytowania.',
    ogDescription:
      'Porównaj spłatę kredytu, inwestowanie wolnych środków lub połączenie obu podejść — w ujęciu realnym po inflacji.',
    imageAlt: 'RateCompare — Symulator kredytu vs inwestycji',
  },
}

function localePath(locale) {
  return locale === DEFAULT_LOCALE ? '/' : `/${locale}/`
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function renderSeoBlock(locale) {
  const meta = SEO[locale] || SEO[DEFAULT_LOCALE]
  const canonical = `${SITE_URL}${localePath(locale)}`

  const hreflangLinks = LOCALES.map(
    (l) => `<link rel="alternate" hreflang="${l}" href="${SITE_URL}${localePath(l)}" />`,
  ).join('\n    ')
  const xDefault = `<link rel="alternate" hreflang="x-default" href="${SITE_URL}/" />`

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
    <meta property="og:image:type" content="image/svg+xml" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeAttr(meta.imageAlt)}" />
    <meta property="og:locale" content="${meta.ogLocale}" />
    ${alternateOgLocales}

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttr(meta.title)}" />
    <meta name="twitter:description" content="${escapeAttr(meta.ogDescription)}" />
    <meta name="twitter:image" content="${OG_IMAGE}" />
    <meta name="twitter:image:alt" content="${escapeAttr(meta.imageAlt)}" />`
}

export function renderLocaleHtml(template, locale) {
  const meta = SEO[locale] || SEO[DEFAULT_LOCALE]
  return template.replace('__SEO_LANG__', meta.lang).replace('<!--SEO-->', renderSeoBlock(locale))
}
