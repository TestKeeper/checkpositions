import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 120000,
  use: {
    headless: false, // ← всегда запускается без UI
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
  },
});

