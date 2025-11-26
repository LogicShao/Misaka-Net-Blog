// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import {defineConfig} from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.misaka-net.top', // 替换为你的 Cloudflare Pages URL 或自定义域名
  // 静态生成模式（默认）- 适合博客
  // Cloudflare Pages 会自动检测并部署静态文件
  integrations: [
    mdx(),
    sitemap(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      theme: 'dracula',
      wrap: true,
    },
  },
});
