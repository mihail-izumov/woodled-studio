---
layout: page
sidebar: false
aside: false
title: Конфигуратор домашнего света WOODLED Rotor
description: Соберите свой лес света WOODLED — дизайнерские светильники из дерева для каждой комнаты
head:
  - - meta
    - name: description
      content: Соберите свой лес света WOODLED — дизайнерские светильники из дерева для каждой комнаты
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:site_name
      content: WOODLED
  - - meta
    - property: og:title
      content: Конфигуратор домашнего света
  - - meta
    - property: og:description
      content: Соберите свой лес света WOODLED — дизайнерские светильники из дерева для каждой комнаты
  - - meta
    - property: og:url
      content: https://mihail-izumov.github.io/woodled-studio/customizer
  - - meta
    - property: og:image
      content: https://mihail-izumov.github.io/woodled-studio/og-cover.jpg
  - - meta
    - property: og:image:width
      content: "1200"
  - - meta
    - property: og:image:height
      content: "630"
  - - meta
    - property: og:image:alt
      content: WOODLED Rotor
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: Конфигуратор домашнего света
  - - meta
    - name: twitter:description
      content: Соберите свой лес света WOODLED — дизайнерские светильники из дерева для каждой комнаты
  - - meta
    - name: twitter:image
      content: https://mihail-izumov.github.io/woodled-studio/og-cover.jpg
---

<script setup>
import { onMounted, onUnmounted } from 'vue'
import WoodledCustomizer from './.vitepress/customizer/components/App.vue'

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
  <WoodledCustomizer />
</ClientOnly>
