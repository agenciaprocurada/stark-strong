// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

// Stark Strong — loja por orçamento. Protótipo estático (sem backend).
export default defineConfig({
  site: 'https://starkstrong.com.br',
  integrations: [icon()],
});
