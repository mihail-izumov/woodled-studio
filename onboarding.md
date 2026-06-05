---
layout: page
sidebar: false
aside: false
title: Дом с WOODLED Rotor
description: Как работает свет WOODLED — познакомьтесь с философией и соберите свой лес света
head:
  - - meta
    - name: description
      content: Как работает свет WOODLED — познакомьтесь с философией и соберите свой лес света
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:site_name
      content: WOODLED
  - - meta
    - property: og:title
      content: Дом с WOODLED Rotor
  - - meta
    - property: og:description
      content: Как работает свет WOODLED — познакомьтесь с философией и соберите свой лес света
  - - meta
    - property: og:url
      content: https://woodled-studio.ru/onboarding
  - - meta
    - property: og:image
      content: https://woodled-studio.ru/og-cover.jpg
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
      content: Дом с WOODLED Rotor
  - - meta
    - name: twitter:description
      content: Как работает свет WOODLED — познакомьтесь с философией и соберите свой лес света
  - - meta
    - name: twitter:image
      content: https://woodled-studio.ru/og-cover.jpg
---

<script setup>
import { onMounted, onUnmounted } from 'vue'
import WoodledOnboarding from './.vitepress/WoodledOnboarding.vue'

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

function goNext() {
  window.location.href = '/customizer'
}
</script>

<ClientOnly>
  <WoodledOnboarding @finish="goNext" />
</ClientOnly>
