---
layout: page
sidebar: false
aside: false
title: Gallery Tagger — разметка интерьерных фото WOODLED
description: Внутренний инструмент разметки интерьерных фотографий тегами для WOODLED-кастомайзера
head:
  - - meta
    - name: robots
      content: noindex, nofollow
  - - meta
    - name: description
      content: Внутренний инструмент разметки интерьерных фотографий тегами для WOODLED-кастомайзера
---

<script setup>
import { onMounted, onUnmounted } from 'vue'
import GalleryTagger from './.vitepress/gallery-tagger/components/App.vue'

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
  <GalleryTagger />
</ClientOnly>

