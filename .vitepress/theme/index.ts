import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
    })
  }
}
