---
title: 'Astro 快速入门指南'
description: '学习如何使用 Astro 构建高性能的静态网站'
pubDate: '2025-11-04'
heroImage: '../../assets/blog-placeholder-2.jpg'
---

Astro 是一个全新的静态网站生成器，它通过独特的"群岛架构"(Islands Architecture)提供了卓越的性能。

## 核心概念

### 1. 零 JavaScript 默认策略

Astro 默认生成纯静态 HTML，没有客户端 JavaScript。这意味着：

- 页面加载速度极快
- SEO 友好
- 低资源消耗

### 2. 群岛架构

只在需要交互的组件中添加 JavaScript：

```astro
---
import InteractiveButton from '../components/InteractiveButton.jsx';
---

<div>
  <h1>这是静态内容</h1>
  <!-- 只有这个组件会加载 JavaScript -->
  <InteractiveButton client:load />
</div>
```

### 3. 多框架支持

在同一个项目中混用不同框架：

```astro
---
import ReactComponent from './ReactComponent.jsx';
import VueComponent from './VueComponent.vue';
import SvelteComponent from './SvelteComponent.svelte';
---

<ReactComponent client:load />
<VueComponent client:visible />
<SvelteComponent client:idle />
```

## 项目结构

```
src/
├── components/     # 可复用组件
├── layouts/        # 页面布局
├── pages/          # 路由页面
├── content/        # 内容集合（博客文章等）
└── styles/         # 全局样式
```

## 内容集合

Astro 的内容集合功能非常适合管理博客文章：

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.string(),
    heroImage: z.string().optional(),
  }),
});

export const collections = { blog };
```

## 获取内容

```astro
---
import { getCollection } from 'astro:content';

const posts = await getCollection('blog');
---

{posts.map(post => (
  <article>
    <h2>{post.data.title}</h2>
    <p>{post.data.description}</p>
  </article>
))}
```

## 性能优化

Astro 内置了多种优化功能：

1. **自动图片优化**：使用 `<Image>` 组件自动优化图片
2. **CSS 作用域**：组件样式自动隔离
3. **代码分割**：自动进行智能代码分割
4. **资源预加载**：自动添加关键资源的预加载

## 总结

Astro 适合构建：

- 博客和文档网站
- 营销网站
- 作品集网站
- 任何内容驱动的网站

开始你的 Astro 之旅吧！
