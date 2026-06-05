---
layout: page
sidebar: false
aside: false
title: Как пользоваться WOODLED Студией на айфоне
description: Добавьте веб-приложение WOODLED на домашний экран айфона и включите уведомления — пошаговая инструкция.
head:
  - - meta
    - name: description
      content: Добавьте веб-приложение WOODLED на домашний экран айфона и включите уведомления — пошаговая инструкция.
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:site_name
      content: WOODLED Студия
  - - meta
    - property: og:title
      content: Как пользоваться WOODLED Студией на айфоне
  - - meta
    - property: og:description
      content: Добавьте веб-приложение WOODLED на домашний экран айфона и включите уведомления.
  - - meta
    - property: og:url
      content: https://mihail-izumov.github.io/woodled-studio/app
  - - meta
    - property: og:image
      content: https://mihail-izumov.github.io/woodled-studio/og-cover.png
---

<script setup>
import { onMounted, onUnmounted } from 'vue'
import AppPage from './.vitepress/lp/AppPage.vue'

let styleEl = null

onMounted(() => {
  styleEl = document.createElement('style')
  styleEl.textContent = `
    .VPNav, .VPLocalNav, .VPBackToTop, .VPFooter, .VPSidebar {
      display: none !important;
    }
    .VPContent { padding: 0 !important; }
    html, body { background: #FAE8DB; }
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

<AppPage />
