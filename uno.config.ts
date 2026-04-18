import { defineConfig, presetUno } from 'unocss'
import presetIcons from 'unocss/preset-icons'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      // Explicit collection: node FS loader often fails inside Vite/Rolldown transform,
      // so i-carbon-* utilities would emit no CSS in production.
      collections: {
        carbon: () => import('@iconify-json/carbon').then((m) => m.icons),
      },
    }),
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
