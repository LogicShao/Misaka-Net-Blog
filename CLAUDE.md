# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Misaka Network Blog 是一个基于 Astro 5.x 构建的现代化静态博客系统，采用 TypeScript + Tailwind CSS 技术栈，部署在 Cloudflare Pages 上。项目以"御坂网络"和"超电磁炮"为主题，具有科技感的设计风格。

**核心技术栈：**
- 框架：Astro 5.x (静态站点生成器)
- 语言：TypeScript 5.0 (严格类型检查)
- 样式：Tailwind CSS 3.4 + 自定义主题系统
- 内容：Markdown/MDX + Astro 内容集合 API
- 数学公式：remark-math + rehype-katex
- 代码高亮：Shiki (Dracula 主题)
- 部署：Cloudflare Pages (全球 CDN)

## 常用命令

### 开发命令
```bash
npm run dev          # 启动开发服务器 (localhost:4321，支持 HMR)
npm run build        # 构建生产版本到 ./dist/
npm run preview      # 本地预览构建结果
npm run new          # 交互式创建新博客文章 (自动生成时间戳文件名)
```

### 构建和部署
```bash
npm run build-and-preview  # 一键构建并预览
npm run astro -- --help    # 查看 Astro CLI 完整帮助
```

## 项目架构

### 核心目录结构
```
src/
├── components/         # 可复用 Astro 组件
│   ├── BaseHead.astro  # SEO 和主题初始化 (防止 FOUC)
│   ├── Header.astro    # 顶部导航 + 移动菜单
│   ├── Footer.astro    # 页脚
│   ├── ThemeToggle.astro  # 深/浅色主题切换
│   ├── TableOfContents.astro  # 浮动目录 (右侧固定)
│   ├── CopyCodeButton.astro  # 代码块复制 (MutationObserver)
│   ├── Card.astro      # 文章卡片
│   └── ...
├── layouts/
│   ├── Layout.astro    # 全局布局 (Header + Footer + 电路板背景)
│   └── BlogPost.astro  # 文章详情页布局 (面包屑、目录、前后导航)
├── pages/              # 基于文件的路由系统
│   ├── index.astro     # 首页 (最新 6 篇 + 侧栏)
│   ├── blog/
│   │   ├── index.astro     # 博客列表
│   │   └── [...slug].astro # 文章详情 (动态路由)
│   └── tags/[tag].astro    # 标签归档 (动态路由)
├── content/
│   └── blog/           # 博客文章 Markdown/MDX 文件
│       └── YY-MM-DD-HH-MM.md  # 时间戳命名格式
├── styles/
│   └── global.css      # 全局样式 (CSS 变量 + @layer 结构)
├── scripts/
│   └── theme.ts        # 主题管理工具函数
├── consts.ts           # 全局常量 (站点信息、友链)
└── content.config.ts   # 内容集合 Schema 定义
```

### 内容管理系统

**文章命名约定：** 文件名格式为 `YY-MM-DD-HH-MM.md` (时间戳)，由 `npm run new` 自动生成。

**Frontmatter Schema** (严格类型验证)：
```typescript
{
  title: string,              // 文章标题
  description: string,        // SEO 描述
  pubDate: Date,              // 发布日期 (自动转换)
  updatedDate?: Date,         // 更新日期 (可选)
  heroImage?: ImageMetadata,  // 封面图片 (可选，Astro 图片优化)
  tags: string[],             // 标签数组 (默认 [])
  draft: boolean              // 草稿标记 (默认 false)
}
```

**内容处理管道：**
```
Markdown/MDX 文件
  ↓ Astro 内容集合加载
  ↓ TypeScript Schema 验证
  ↓ remark-math (数学公式解析)
  ↓ rehype-katex (KaTeX 渲染)
  ↓ Shiki (代码语法高亮)
  ↓ @tailwindcss/typography (Prose 排版)
  ↓ 渲染为 HTML
```

### 样式系统架构

**双层主题系统：**

1. **CSS 变量层** (支持主题切换)：
   ```css
   :root {
     --bg-primary: #0f172a;      /* 深色模式主背景 */
     --text-primary: #f0f8ff;    /* 深色模式主文本 */
     --border-color: rgba(74, 222, 128, 0.2);
   }

   :root:not(.dark) {
     --bg-primary: #ffffff;      /* 浅色模式主背景 */
     --text-primary: #0f172a;    /* 浅色模式主文本 */
   }
   ```

2. **品牌色彩系统** (Tailwind 扩展)：
   - `misaka-circuit` (#4ade80) - 电路板绿 (强调色)
   - `misaka-blue` (#00bfff) - 电磁炮蓝 (交互色)
   - `misaka-accent` (#38bdf8) - 辅助蓝
   - `misaka-bg` (#0f172a) - 深色背景
   - `misaka-dark` (#1e293b) - 深蓝灰

**@layer 组织结构：**
- `@layer base` - 根级样式、字体、CSS 变量
- `@layer components` - `.btn-misaka`, `.card-misaka`, `.tag-misaka` 等可复用组件类
- `@layer utilities` - `.text-glow`, `.pulse-circuit` 等工具类

**主题切换机制：**
- `BaseHead.astro` 中的内联脚本在渲染前执行，读取 localStorage 或系统偏好
- 通过切换 `document.documentElement.classList` 中的 `.dark` 类实现
- 避免 FOUC (Flash of Unstyled Content)

## 开发指南

### 添加新文章

**推荐方式：** 使用 `npm run new` 命令
```bash
npm run new
# 交互式提示输入：
# - 文章标题 (必填)
# - 描述 (可选)
# - 标签 (逗号分隔)
# - 是否草稿 (y/N)
# - 封面图片路径 (可选)
# - 发布日期 (默认今天)
#
# 自动生成文件名：YY-MM-DD-HH-MM.md
```

**手动创建：** 在 `src/content/blog/` 创建 `.md` 文件
```markdown
---
title: '文章标题'
description: '文章描述'
pubDate: 2025-01-15
updatedDate: 2025-01-20  # 可选
heroImage: ../../assets/your-image.jpg  # 可选
tags: ['标签1', '标签2']
draft: false  # true=仅开发环境显示
---

# 文章内容

支持所有 Markdown 语法，包括：
- 数学公式：$E = mc^2$ 或 $$\int_0^\infty f(x)dx$$
- 代码高亮：```typescript ... ```
- 表格、列表、引用等
```

### 路由系统

Astro 使用基于文件的路由：

**静态路由：**
- `/` → `src/pages/index.astro` (首页)
- `/blog` → `src/pages/blog/index.astro` (博客列表)
- `/about` → `src/pages/about.astro` (关于页)

**动态路由：**
- `/blog/[slug]` → `src/pages/blog/[...slug].astro` (文章详情)
  - 使用 `getStaticPaths()` 在构建时生成所有文章页面
  - 文章的 `id` (文件路径) 作为 slug
- `/tags/[tag]` → `src/pages/tags/[tag].astro` (标签归档)
  - 自动聚合所有唯一标签
  - 按标签筛选并排序文章

**前后文章导航逻辑：**
```typescript
// 文章按 pubDate 降序排列
const allPosts = sortedPosts; // 最新的在前
const currentIndex = allPosts.findIndex(p => p.id === post.id);

// 注意：因为降序，prev 指向更新的文章
const prevPost = allPosts[currentIndex + 1]; // 时间更早的
const nextPost = allPosts[currentIndex - 1]; // 时间更新的
```

### 组件开发模式

**Astro 群岛架构：**
- 默认所有组件静态渲染 (零 JavaScript)
- 需要交互时使用 `<script>` 标签或 `client:*` 指令
- 示例：`ThemeToggle.astro` 使用客户端脚本监听点击

**组件通信：**
```astro
---
// Props 定义 (TypeScript)
interface Props {
  title: string;
  description?: string;
}

const { title, description = '默认描述' } = Astro.props;
---

<div>
  <h1>{title}</h1>
  <p>{description}</p>
</div>
```

**关键组件说明：**

- **BaseHead** - 必须在 `<head>` 中使用，包含 SEO、主题初始化
- **TableOfContents** - 动态生成目录，使用 `IntersectionObserver` 高亮当前章节
- **CopyCodeButton** - 使用 `MutationObserver` 监听动态插入的代码块

### 样式开发规范

1. **优先使用 Tailwind 类**
   ```astro
   <div class="bg-misaka-dark text-misaka-circuit p-4 rounded-lg">
   ```

2. **需要主题切换时使用 CSS 变量**
   ```css
   .my-component {
     background-color: var(--bg-secondary);
     color: var(--text-primary);
   }
   ```

3. **自定义可复用组件类使用 @layer components**
   ```css
   @layer components {
     .my-card {
       @apply card-misaka hover:shadow-lg;
     }
   }
   ```

4. **数学公式样式适配**
   - 深色模式下 KaTeX 颜色已在 `global.css` 中适配
   - 修改公式样式编辑 `.dark .katex` 相关规则

5. **响应式设计**
   - 移动优先：`class="text-sm md:text-base lg:text-lg"`
   - 断点：sm (640px), md (768px), lg (1024px), xl (1280px)

## 技术特性

### 数学公式渲染
- 使用 remark-math + rehype-katex 处理数学表达式
- 行内公式：`$E = mc^2$` 渲染为 $E = mc^2$
- 块级公式：`$$\int_0^\infty f(x)dx$$`
- 深色/浅色模式自动适配 (`.dark .katex` 规则)
- 公式背景色和边框样式已优化

### 代码高亮
- Shiki 引擎 + Dracula 主题
- 支持自动换行 (`wrap: true`)
- 代码块自动添加复制按钮 (CopyCodeButton 组件)
- 使用 `navigator.clipboard.writeText()` API

### SEO 优化
- 自动生成 sitemap.xml 和 RSS feed
- Open Graph 和 Twitter Card 元标签
- 结构化数据 (通过 BaseHead 组件)
- 语义化 HTML 标签
- 图片 alt 属性和懒加载

### 图片处理
- Astro Image 集成，自动优化
- Sharp 引擎，生成 WebP 格式
- 响应式图片 (自动生成多尺寸)
- 懒加载 (`loading="lazy"`)

### 性能优化策略

| 优化策略 | 实现方式 | 效果 |
|---------|---------|------|
| 零 JS 默认 | Astro 静态生成 | 首屏加载 < 1s |
| 代码分割 | 动态导入 | 按需加载 |
| CSS 最小化 | Tailwind PurgeCSS | 生产 < 50KB |
| 图片优化 | Sharp + WebP | 减少 60-80% 体积 |
| 字体预加载 | `rel="preload"` | 减少 FOUT |
| 静态生成 | SSG | 零运行时开销 |

## 部署配置

项目配置为 Cloudflare Pages 部署：
- 构建命令: `npm run build`
- 输出目录: `dist`
- 站点 URL: `https://blog.misaka-net.top`

## 重要注意事项

### 内容编写
- **所有博客文章必须包含有效的 frontmatter**，否则构建失败
- **草稿文章**：设置 `draft: true` 在生产环境不显示，但开发环境可见
- **文件命名**：使用 `npm run new` 生成的时间戳格式 (`YY-MM-DD-HH-MM.md`)，避免文件名冲突
- **数学公式**：
  - 行内公式使用 `$...$`，不要使用下标字符 (如 `λ₀`) 或代码段 (`` `λ_0` ``)
  - 块级公式使用 `$$...$$`
  - 数学符号与中文之间建议添加空格，提升可读性
- **代码块**：使用 ` ```语言名 ` 格式，支持的语言见 Shiki 文档

### 样式开发
- **主题切换**：所有颜色使用 CSS 变量或 Tailwind 类，避免硬编码颜色值
- **列表缩进**：一级列表 `ml-3` (12px)，嵌套列表相对缩进 `ml-3`
- **响应式**：移动优先，使用 Tailwind 断点类
- **KaTeX 样式**：修改数学公式样式编辑 `src/styles/global.css` 中 `.dark .katex` 相关规则

### 组件开发
- **遵循单一职责原则**：每个组件只负责一个功能
- **避免客户端 JavaScript**：除非必要，优先静态渲染
- **Props 类型安全**：使用 TypeScript interface 定义 Props
- **可访问性**：添加 aria-label、alt 等属性

### 构建部署
- **构建前检查**：运行 `npm run build` 确保无错误
- **环境变量**：不要在代码中硬编码敏感信息
- **Cloudflare Pages 自动部署**：推送到 GitHub 后自动触发
- **站点 URL**：在 `astro.config.mjs` 中配置，用于生成 sitemap 和 RSS

### 已知配置
- 代码块反引号问题已修复：`.prose code::before/::after { content: '' !important; }`
- 数学公式深色模式已适配
- 列表缩进已优化为 12px (一级和嵌套)