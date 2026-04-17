import { defineConfig, presetUno } from 'unocss'
import presetIcons from 'unocss/preset-icons'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons(),
  ],
  rules: [
    ['hide-scrollbar', {
      'scrollbar-width': 'none',
      '-ms-overflow-style': 'none',
    }],
  ],
  preflights: [
    {
      getCSS: () => `.hide-scrollbar::-webkit-scrollbar { display: none; }`,
    },
  ],
})
