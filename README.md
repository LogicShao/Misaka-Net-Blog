<div align="center">

# Misaka Network Blog

<img src="public/favicon.svg" alt="Misaka Network Logo" width="96" align="right" />

御坂网络 - 科学实验日志与技术观测站  
*A Certain Scientific Blog Theme*

[![Astro](https://img.shields.io/badge/Astro-5.x-ff5d01?style=for-the-badge&logo=astro)](https://astro.build)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)

[在线演示](https://blog.misaka-net.top) | [快速开始](#快速开始) | [内容写作](#内容写作) | [管理端](#管理端)

</div>

---

## 特性
- Astro 5 + Tailwind + TypeScript
- Markdown/MDX 内容体系 + Shiki 代码高亮
- KaTeX 数学公式、RSS、Sitemap、SEO
- 搜索索引（Fuse.js）
- 友链/标签/草稿支持
- 本地管理端（Web）

## 快速开始
**前置要求**：Node.js 18+

```bash
npm install
npm run dev
```
访问 `http://localhost:4321`

## 常用命令
| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 开发模式 |
| `npm run build` | 构建生产版（输出到 `dist/`） |
| `npm run preview` | 本地预览构建结果 |
| `npm run new` | 新建文章脚本 |
| `npm run admin` | 启动本地 Web 管理端 |
| `npm run friends` | 友链管理脚本 |

## 内容写作
在 `src/content/blog/` 新建 `.md`/`.mdx`，或使用脚本：

```bash
npm run new
```

最小 Frontmatter 示例：

```yaml
---
title: '文章标题'
description: '文章摘要'
pubDate: 2024-01-15
tags: ['标签1', '标签2']
draft: false
---
```

## 管理端
- **Web 管理端**：`npm run admin`，默认地址 `http://localhost:3001`

## 项目结构（摘要）
```text
src/                站点源码
  pages/            路由页面
  components/       UI 组件
  content/blog/     博客内容
public/             静态资源
scripts/            脚本工具
admin-ui/           Web 管理端
```

## 部署
构建命令 `npm run build`，输出目录 `dist/`，可用于 Cloudflare Pages / Vercel / Netlify 等静态托管。

## 许可
MIT License

