<script setup lang="ts">
import { PAGE } from './tokens'
import AppIcon from './AppIcon.vue'
import PrimaryCTA from './PrimaryCTA.vue'
import FeatureTabs from './FeatureTabs.vue'

defineEmits<{
  (e: 'cta-mounted', el: HTMLElement): void
  (e: 'cta-unmounted'): void
}>()
</script>

<template>
  <section
    :style="{
      padding: '28px 24px 16px',
      maxWidth: '720px',
      margin: '0 auto',
      textAlign: 'center',
    }"
  >
    <AppIcon />

    <h1
      :style="{
        fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif`,
        fontSize: 'clamp(36px, 8vw, 56px)',
        fontWeight: 700,
        lineHeight: 1.05,
        letterSpacing: '-0.03em',
        margin: '0 0 28px',
        color: PAGE.text,
      }"
    >
      <span :style="{ display: 'block' }">Мой дизайн.</span>
      <span
        :style="{
          display: 'block',
          backgroundImage: `linear-gradient(120deg, ${PAGE.rose} 0%, ${PAGE.roseLight} 28%, ${PAGE.roseGlow} 50%, ${PAGE.roseLight} 72%, ${PAGE.rose} 100%)`,
          backgroundSize: '220% 100%',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
          animation: 'goldShimmer 7s ease-in-out infinite',
        }"
      >Мой свет.</span>
    </h1>

    <!--
      Subtitle — two stacked blocks on EVERY viewport (mobile + desktop).

      Behaviour:
        • .lp-line is `display: block` universally now (was mobile-only in
          the previous revision). This means the two sentences always read
          as two separate blocks, with the bold-600 «Идеальное пространство
          для света WOODLED.» sitting above the regular-400 «Настраивайте…»
          paragraph, separated by a 14px gap.
        • Side-effect benefit: the previous desktop bug — where the space
          between </span><span> in the source was being stripped by the
          template compiler, gluing «WOODLED.Настраивайте» together — is
          mooted, because block elements stack vertically regardless of
          the whitespace between them in source.

      Mobile-specific line breaks (the <br class="lp-mobile-only">s) stay
      mobile-only: on iPhone widths, «Идеальное пространство» / «для света
      WOODLED.» splits onto two lines, and «уголок дома.» is pinned to its
      own line. On desktop, those breaks are hidden and each block wraps
      naturally inside the 540px maxWidth container.
    -->
    <p
      :style="{
        fontSize: '18px',
        lineHeight: 1.5,
        color: PAGE.text,
        maxWidth: '540px',
        margin: '0 auto 32px',
      }"
    >
      <span class="lp-line lp-line--bold">Идеальное пространство <br class="lp-mobile-only" />для света WOODLED.</span>
      <span class="lp-line lp-line--regular">Настраивайте светильники, расставляйте мебель, перекрасьте стены — наполните каждый <br class="lp-mobile-only" />уголок дома.</span>
    </p>

    <div :style="{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }">
      <PrimaryCTA
        size="large"
        @mounted="(el) => $emit('cta-mounted', el)"
        @unmounted="$emit('cta-unmounted')"
      />
    </div>

    <FeatureTabs />
  </section>
</template>

<style scoped>
/*
  Subtitle weight contrast — applied universally so desktop and mobile
  read the same way: bold-600 lead, regular-400 body.
*/
.lp-line--bold {
  font-weight: 600;
}
.lp-line--regular {
  font-weight: 400;
}

/*
  Block stacking applied EVERYWHERE (no @media wrapper) so desktop matches
  mobile: two visually distinct blocks separated by a 14px gap. The
  adjacent-sibling selector means only the second block carries the
  margin, so the first block sits flush with the H1 above.
*/
.lp-line {
  display: block;
}
.lp-line + .lp-line {
  margin-top: 14px;
}

/*
  Mobile-only line-break utility. The <br>s engage at ≤600px to break
  «Идеальное пространство» / «для света WOODLED.» across two lines and to
  pin «уголок дома.» to its own line. On desktop they're hidden — the
  text in each block wraps naturally inside the 540px container.
*/
@media (min-width: 601px) {
  .lp-mobile-only {
    display: none;
  }
}
</style>
