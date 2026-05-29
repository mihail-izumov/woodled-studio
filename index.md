---
layout: page
sidebar: false
aside: false
title: Мой дизайн. Мой свет.
description: WOODLED Студия — Ваше идеальное пространство для света.
head:
  - - meta
    - name: description
      content: WOODLED Студия — Ваше идеальное пространство для света.
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:site_name
      content: WOODLED Студия
  - - meta
    - property: og:title
      content: Мой дизайн. Мой свет.
  - - meta
    - property: og:description
      content: WOODLED Студия — Ваше идеальное пространство для света.
  - - meta
    - property: og:url
      content: https://mihail-izumov.github.io/woodled-studio/
  - - meta
    - property: og:image
      content: https://mihail-izumov.github.io/woodled-studio/og-cover.png
  - - meta
    - property: og:image:width
      content: "1200"
  - - meta
    - property: og:image:height
      content: "630"
  - - meta
    - property: og:image:alt
      content: WOODLED Студия
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: Мой дизайн. Мой свет.
  - - meta
    - name: twitter:description
      content: WOODLED Студия — Ваше идеальное пространство для света.
  - - meta
    - name: twitter:image
      content: https://mihail-izumov.github.io/woodled-studio/og-cover.png
---

<script setup>
import { onMounted, onUnmounted } from 'vue'
import WoodledLanding from './.vitepress/lp/App.vue'

let styleEl = null

onMounted(() => {
  styleEl = document.createElement('style')
  styleEl.textContent = `
    .VPNav, .VPLocalNav, .VPBackToTop, .VPFooter, .VPSidebar {
      display: none !important;
    }
    .VPContent { padding: 0 !important; }
  `
  document.head.appendChild(styleEl)
})

onUnmounted(() => {
  if (styleEl) {
    styleEl.remove()
    styleEl = null
  }
})
</script>

<ClientOnly>
  <WoodledLanding />
</ClientOnly>
