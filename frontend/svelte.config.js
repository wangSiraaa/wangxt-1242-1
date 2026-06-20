import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      $lib: 'src/lib',
      $components: 'src/components',
      $stores: 'src/stores',
      $types: 'src/types',
      $utils: 'src/utils',
    },
  },
};

export default config;
