import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'WOODLED',
  description: 'WOODLED — дизайнерские светильники из дерева',
  lang: 'ru-RU',

  head: [
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/woodled-studio/apple-touch-icon.png' }],
    ['link', { rel: 'apple-touch-icon', href: '/woodled-studio/apple-touch-icon.png' }],
    // Full-screen app pages: dark base + hide default chrome from the first paint
    // (kills the white flash and the "WOODLED" nav bar blink between routes)
    ['style', {}, `
      html, body { background: #0A0908; }
      #app, .Layout, .VPContent { background: #0A0908; }
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
