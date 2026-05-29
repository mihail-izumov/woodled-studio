import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import PageFade from './PageFade.vue'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'layout-top': () => h(PageFade)
    })
  }
}
