import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'WOODLED',
  description: 'WOODLED — дизайнерские светильники из дерева',
  lang: 'ru-RU',

  head: [
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/woodled-studio/apple-touch-icon.png' }],
    // iOS home-screen icon. sizes указывать обязательно (иначе iOS иногда
    // молча отказывается грузить), и желательно дублировать на /apple-touch-icon.png
    // в корне — некоторые версии Safari дёргают именно этот путь.
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/woodled-studio/apple-touch-icon.png' }],
    ['link', { rel: 'apple-touch-icon-precomposed', sizes: '180x180', href: '/woodled-studio/apple-touch-icon.png' }],
    // iOS standalone mode (когда добавлено на экран Домой):
    //   • capable=yes  — запускать без Safari-хрома
    //   • title        — подпись под иконкой на спрингборде
    //   • status-bar   — прозрачный тёмный статус-бар (под тему сайта)
    //   • theme-color  — цвет статус-бара на Android
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-title', content: 'WOODLED' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }],
    ['meta', { name: 'mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'theme-color', content: '#13110E' }],
    // Full-screen app pages: dark base + hide default chrome from the first paint
    // (kills the white flash and the "WOODLED" nav bar blink between routes).
    // Цвет — T.bg (#13110E), чтобы первый paint совпадал с темой кастомайзера.
    ['style', {}, `
      html, body { background: #13110E; }
      #app, .Layout, .VPContent { background: #13110E; }
      .VPNav, .VPLocalNav, .VPBackToTop, .VPFooter, .VPSidebar { display: none !important; }
      .VPContent { padding: 0 !important; }
    `],
  ],

  base: '/woodled-studio/',
  cleanUrls: true,
  appearance: false,
  outDir: '.vitepress/dist',

  themeConfig: {
    siteTitle: 'WOODLED',
    nav: [],
    sidebar: {},
  },
})
