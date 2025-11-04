// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://example.com', // 替换为你的实际域名
	// 静态生成模式（默认）- 适合博客
	// Cloudflare Pages 会自动检测并部署静态文件
	integrations: [mdx(), sitemap()],
});
