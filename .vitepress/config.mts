import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'WOODLED',
  description: 'WOODLED — дизайнерские светильники из дерева',
  lang: 'ru-RU',

  head: [
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
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
