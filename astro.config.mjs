// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://gdgc-mcet.github.io',
  base: '/gc-lwc-2026-dashboard',
  integrations: [react()],
});