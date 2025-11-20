# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Misaka Network Blog - 基于 Astro 5.x 的现代化静态博客系统，主题灵感来自《某科学的超电磁炮》中的御坂网络，采用深色科技风格设计。

**核心技术栈：**
- Astro 5.15.3 (静态站点生成器，群岛架构)
- TypeScript 5.0 (严格类型检查)
- Tailwind CSS 3.4.18 (实用优先 + 自定义 Misaka 主题)
- Markdown/MDX (内容格式，Astro 内容集合 API)
- 数学公式：remark-math + rehype-katex + KaTeX CDN
- 代码高亮：Shiki (Dracula 主题)
- 流程图：Mermaid.js (CDN 动态加载)
- 搜索：Fuse.js (客户端模糊搜索)

**部署：** Cloudflare Pages (站点：https://blog.misaka-net.top)

## 常用命令

```bash
npm run dev          # 启动开发服务器 (localhost:4321)
npm run build        # 构建生产版本到 ./dist/
npm run preview      # 预览构建结果
npm run new          # 交互式创建新博客文章 (推荐)
```

## 核心架构要点

### 1. 内容管理系统 (Astro 5.x 新 API)

**关键变化：** Astro 5.x 使用新的 `glob` loader API 替代旧的文件系统扫描

```typescript
// src/content.config.ts
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: image().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  })
});
```

**文章创建：**
- 使用 `npm run new` 自动生成时间戳格式文件名 (`YY-MM-DD-HH-MM.md`)
- 必填字段：`title`, `description`, `pubDate`
- `draft: true` 仅在开发环境显示，生产环境自动过滤

**草稿过滤方式：**
```typescript
getCollection('blog', ({ data }) => data.draft !== true)
```

### 2. 主题系统架构

**双层设计：**
1. **CSS 变量层** (`src/styles/global.css`) - 支持深色/浅色模式切换
2. **Tailwind 品牌色** (`tailwind.config.mjs`) - Misaka 主题色

**防止 FOUC (闪烁) 关键：**
- `BaseHead.astro` 中使用 `is:inline` 内联脚本
- 在 DOM 渲染前从 localStorage 读取主题并应用
- 优先级：localStorage > 系统偏好 > 默认浅色

**主题切换机制：**
- Tailwind `darkMode: 'class'` 配置
- 通过切换 `<html>` 元素的 `.dark` 类实现
- 所有主题敏感样式使用 CSS 变量或 Tailwind 的 `dark:` 前缀

### 3. Astro 群岛架构 - 组件间通信

**关键原则：**
- 默认所有组件静态渲染（零 JavaScript）
- 需要交互时在组件内部使用 `<script>` 标签
- 不需要 `client:*` 指令（除非使用 React/Vue）

**跨组件通信模式：**
```javascript
// 发送方 (SearchButton.astro)
window.dispatchEvent(new CustomEvent('open-search'));

// 接收方 (SearchModal.astro)
window.addEventListener('open-search', openSearch);
```

**持久化状态：** 使用 localStorage (如主题偏好)

### 4. 搜索功能实现

**架构：**
- 搜索索引：`/search.json` API 端点（构建时静态生成）
- 搜索引擎：Fuse.js (权重：标题 3 > 描述 2 > 标签 1)
- 懒加载：首次打开搜索框时才从 `/search.json` 加载数据

**快捷键：** `Cmd/Ctrl + K` 全局触发

### 5. 数学公式渲染管道

```
Markdown 文件
  ↓ remark-math (构建时解析 $...$ 和 $$...$$)
  ↓ rehype-katex (构建时渲染为 KaTeX HTML)
  ↓ KaTeX CSS (客户端 CDN 加载)
  ↓ 深色模式适配 (.dark .katex 规则覆盖默认黑色)
```

**注意事项：**
- 行内公式使用 `$...$`，避免使用 Unicode 下标或代码段
- 复杂公式使用块级格式 `$$...$$`
- KaTeX CSS 在 `BaseHead.astro` 中预加载

### 6. Mermaid 流程图渲染

**实现要点：**
- 仅在 `BlogPost.astro` 布局中引入 `MermaidRenderer.astro`
- 客户端动态加载 Mermaid.js (CDN)
- 查找目标：`pre[data-language="mermaid"] code` (Shiki 渲染的代码块)
- 主题响应：使用 `MutationObserver` 监听 `.dark` 类变化

**主题配置：** Misaka 品牌色（电路板绿 #4ade80、电磁炮蓝 #38bdf8）

**已知限制：**
- 避免在节点标签中使用过于复杂的数学公式
- 简单公式（如 `$E=mc^2$`）通常可以正常渲染

### 7. 路由系统关键逻辑

**文章前后导航逻辑：**
```typescript
// 文章按 pubDate 降序排列 (最新在前)
const allPosts = sortedPosts;
const currentIndex = allPosts.findIndex(p => p.id === post.id);

// 注意：因为降序排列
const prevPost = allPosts[currentIndex + 1]; // 时间更早的文章
const nextPost = allPosts[currentIndex - 1]; // 时间更新的文章
```

**动态路由：**
- `/blog/[...slug]` - 文章的 `id` (文件路径不含扩展名) 作为 slug
- `/tags/[tag]` - 自动聚合所有唯一标签

### 8. 样式开发规范

**优先级：**
1. Tailwind 类（优先）
2. CSS 变量（主题切换需求）
3. `@layer components`（可复用组件）
4. `:global()` 作用域（全局样式）

**字体系统：**
- 全站无衬线字体栈（Inter + PingFang SC/Microsoft YaHei）
- 代码块：JetBrains Mono
- **注意：** 避免在组件级设置 `font-family`，继承全局字体栈

**响应式断点：** sm (640px), md (768px), lg (1024px), xl (1280px)

## 关键开发陷阱

### 1. Tailwind Typography 反引号问题

**问题：** 默认在行内 `<code>` 前后添加反引号
**解决：** 在 `global.css` 中强制覆盖
```css
.prose code::before,
.prose code::after {
  content: '' !important;
}
```

### 2. 列表缩进不足

**统一设置：** 所有列表使用 `ml-3` (12px) 缩进，保证层级清晰

### 3. 代码块语言标识

**必须指定语言：** ` ```typescript ` 而不是 ` ``` `
- 启用 Shiki 语法高亮
- 自动添加 `data-language` 属性（Mermaid 渲染依赖此属性）

### 4. 主题切换闪烁 (FOUC)

**错误做法：** 在组件 `<script>` 中读取主题
**正确做法：** 在 `BaseHead.astro` 中使用 `is:inline` 内联脚本

### 5. 组件客户端 JavaScript

**常见错误：** 使用 `client:load` 等指令导致不必要的水合
**正确做法：** 直接在 Astro 组件中使用 `<script>` 标签

## 部署配置

**Cloudflare Pages：**
- 构建命令：`npm run build`
- 输出目录：`dist`
- Node 版本：18+ (推荐 20.x)
- 自动部署：推送到 GitHub 自动触发构建

**站点配置：**
```javascript
// astro.config.mjs
site: 'https://blog.misaka-net.top'  // 用于 sitemap 和 RSS
```

## 最佳实践

### 文章创建
1. 使用 `npm run new` 命令（推荐）
2. 填写完整 frontmatter（title, description, tags）
3. 草稿使用 `draft: true`

### 数学公式
- 简单公式：行内格式 `$...$`
- 复杂公式：块级格式 `$$...$$`
- 避免在 Mermaid 节点中使用复杂公式

### 代码高亮
- 始终添加语言标识
- 长代码行会自动换行 (`wrap: true`)

### 性能优化
- 避免在页面中加载大量图片
- 使用 Astro Image 组件自动优化
- 第三方库优先使用 CDN (如 Mermaid, KaTeX)

## 关键文件说明

| 文件 | 用途 |
|------|------|
| `src/content.config.ts` | 内容集合 Schema 定义（Zod 验证） |
| `src/consts.ts` | 站点信息、友链配置 |
| `astro.config.mjs` | Astro 配置（插件、Markdown 处理） |
| `tailwind.config.mjs` | Tailwind 扩展（Misaka 主题色、字体） |
| `src/styles/global.css` | 全局样式（CSS 变量、@layer 结构） |
| `scripts/new-post.js` | 交互式创建文章工具 |

## 常见问题速查

**添加友链：** 编辑 `src/consts.ts` 中的 `FRIEND_LINKS` 数组

**自定义主题颜色：** 编辑 `tailwind.config.mjs` 的 `theme.extend.colors` 或 `global.css` 的 CSS 变量

**构建失败：** 检查所有文章 frontmatter 是否符合 Schema（必填字段：title, description, pubDate）

**更改代码高亮主题：** 编辑 `astro.config.mjs` 的 `markdown.shikiConfig.theme`（参考 [Shiki Themes](https://shiki.style/themes)）

## 变更记录

### 2025-11-20
- 添加标签列表页面 (`/tags`) 及彩色卡片设计
- 优化字体系统：全站使用无衬线字体栈
- 改进目录组件：智能自适应展开/收起（窗口宽度 < 1400px 自动收起）
- 修复 Mermaid 放大按钮位置（左上角）

### 2025-11-19
- 完善 Mermaid 流程图渲染实现文档
- 添加搜索功能架构详细说明
- 更新数学公式渲染流程文档
- 补充内容集合系统（Zod Schema）细节
