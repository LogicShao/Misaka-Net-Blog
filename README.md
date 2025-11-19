<div align="center">

# Misaka Network Blog

<img src="public/favicon.svg" alt="Misaka Network Logo" width="100" align="right" />

![Misaka Network](https://img.shields.io/badge/Level-5_Railgun-00bfff?style=for-the-badge)
![Astro](https://img.shields.io/badge/Astro-5.0-ff5d01?style=for-the-badge&logo=astro)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript)

御坂网络 - 科学实验日志与技术观测站

*A Certain Scientific Blog Theme*

[在线演示](#) | [快速开始](#快速开始) | [文档](#) | [反馈问题](https://github.com/LogicShao/misaka-network-blog/issues)

</div>

---

## ✨ 特性

### 🎨 视觉设计

- **科技感主题** - 灵感来自《某科学的超电磁炮》中的御坂网络
- **暗色调设计** - 深蓝灰主色调 + 电路板绿 + 电磁炮蓝
- **电路板纹理** - 细腻的背景效果和网格装饰
- **响应式布局** - 完美适配桌面、平板和移动设备
- **流畅动画** - 精心设计的过渡效果和交互反馈

### ⚡ 性能优化

- **零 JavaScript 默认** - Astro 的群岛架构，极致性能
- **100/100 Lighthouse** - 完美的性能评分
- **SEO 友好** - 内置 SEO 优化和 Open Graph 支持
- **自动图片优化** - 使用 Astro 的图片优化功能
- **代码高亮** - Shiki 语法高亮，Dracula 主题

### 📝 内容管理

- **Markdown/MDX 支持** - 灵活的内容创作
- **标签系统** - 文章分类和标签归档
- **草稿功能** - 支持草稿状态的文章
- **内容集合** - 类型安全的内容管理
- **RSS 订阅** - 自动生成 RSS feed

### 🛠️ 开发体验

- **TypeScript** - 完整的类型支持
- **Tailwind CSS** - 实用优先的样式框架
- **热模块替换** - 快速的开发反馈
- **组件化** - 可复用的 Astro 组件
- **易于定制** - 清晰的项目结构

## 🚀 快速开始

### 前置要求

- Node.js 18+
- npm 或 pnpm

### 安装

```bash
# 克隆项目
git clone https://github.com/yourusername/misaka-network-blog.git
cd misaka-network-blog

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:4321 查看你的博客！

## 📁 项目结构

```text
misaka-network-blog/
├── public/                 # 静态资源
│   ├── favicon.svg
│   └── fonts/
├── src/
│   ├── assets/            # 图片等资源
│   │   └── blog-placeholder-*.jpg
│   ├── components/        # 可复用组件
│   │   ├── Header.astro        # 顶部导航
│   │   ├── Footer.astro        # 页脚
│   │   ├── Card.astro          # 文章卡片
│   │   ├── Tag.astro           # 标签组件
│   │   ├── NetworkStats.astro  # 网络状态面板
│   │   └── ...
│   ├── content/           # 内容集合
│   │   └── blog/              # 博客文章
│   │       ├── welcome-misaka-network.md
│   │       ├── astro-static-site-generation.md
│   │       └── tailwind-css-guide.md
│   ├── layouts/           # 布局组件
│   │   ├── Layout.astro       # 主布局
│   │   └── BlogPost.astro     # 博客文章布局
│   ├── pages/             # 路由页面
│   │   ├── index.astro        # 首页
│   │   ├── about.astro        # 关于页面
│   │   ├── blog/
│   │   │   ├── index.astro    # 博客列表
│   │   │   └── [...slug].astro # 文章详情
│   │   └── tags/
│   │       └── [tag].astro    # 标签归档
│   ├── styles/            # 样式文件
│   │   └── global.css         # 全局样式
│   ├── consts.ts          # 全局常量
│   └── content.config.ts  # 内容集合配置
├── astro.config.mjs       # Astro 配置
├── tailwind.config.mjs    # Tailwind 配置
├── tsconfig.json          # TypeScript 配置
└── package.json
```

## 📝 使用指南

### 添加新文章

在 `src/content/blog/` 目录下创建新的 `.md` 或 `.mdx` 文件：

```markdown
---
title: '你的文章标题'
description: '文章描述，会显示在SEO和文章卡片中'
pubDate: 2024-01-15
heroImage: '../../assets/your-image.jpg'
tags: ['标签1', '标签2', 'Web开发']
draft: false
---

# 你的文章内容

这里开始写你的文章...

## 支持的功能

- Markdown 语法
- 代码高亮
- 图片优化
- MDX 组件
```

### 自定义主题颜色

编辑 `tailwind.config.mjs`：

```javascript
theme: {
    extend: {
        colors: {
            // Misaka Network 主题色
            'misaka-dark': '#1e293b',      // 深蓝灰
            'misaka-circuit': '#4ade80',   // 电路板绿
            'misaka-light': '#f0f8ff',     // 淡蓝白
            'misaka-blue': '#00bfff',      // 电磁炮蓝
            'misaka-accent': '#38bdf8',    // 辅助蓝
            'misaka-bg': '#0f172a',        // 深色背景
            'misaka-gray': '#64748b',      // 中灰
        },
    },
},
```

### 修改网站信息

编辑 `src/consts.ts`：

```typescript
export const SITE_TITLE = 'Misaka Network';
export const SITE_DESCRIPTION = '御坂网络 - 科学实验日志与技术观测站';
```

### 更新配置

编辑 `astro.config.mjs`：

```javascript
export default defineConfig({
    site: 'https://yourdomain.com', // 替换为你的域名
    integrations: [mdx(), sitemap(), tailwind()],
    // ...更多配置
});
```

## 🧞 命令

所有命令都在项目根目录运行：

| 命令                        | 功能                       |
|---------------------------|--------------------------|
| `npm install`             | 安装依赖                     |
| `npm run dev`             | 启动开发服务器 `localhost:4321` |
| `npm run build`           | 构建生产版本到 `./dist/`        |
| `npm run preview`         | 本地预览构建结果                 |
| `npm run astro ...`       | 运行 Astro CLI 命令          |
| `npm run astro -- --help` | 查看 Astro CLI 帮助          |

## 🚢 部署

### Cloudflare Pages（推荐）

1. 推送代码到 GitHub
2. 在 Cloudflare Pages 创建新项目
3. 连接你的 GitHub 仓库
4. 构建设置：
    - 构建命令：`npm run build`
    - 输出目录：`dist`
5. 部署！

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/yourusername/misaka-network-blog)

### Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/misaka-network-blog)

## 🎨 设计哲学

### 色彩系统

```css
--misaka-dark: #1e293b /* 主背景色 - 深蓝灰 */
--misaka-circuit: #4ade80 /* 强调色 - 电路板绿 */
--misaka-light: #f0f8ff /* 文本色 - 淡蓝白 */
--misaka-blue: #00bfff /* 交互色 - 电磁炮蓝 */
--misaka-accent: #38bdf8 /* 辅助色 - 天蓝 */
--misaka-bg: #0f172a /* 深色背景 */
--misaka-gray: #64748b

/* 次要文本 */
```

### 字体

- **正文**：Inter / system-ui
- **标题**：Inter（加粗）
- **代码**：JetBrains Mono / Fira Code

### 间距系统

遵循 Tailwind 的 spacing scale（4px 基数）

## 🤝 贡献

欢迎贡献！请随时提交 Issue 或 Pull Request。

### 开发流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可

MIT License © 2024

## 🙏 致谢

- [Astro](https://astro.build/) - 现代化的静态站点生成器
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [《某科学的超电磁炮》](https://toaru-project.com/) - 设计灵感来源
- [Shiki](https://shiki.matsu.io/) - 代码语法高亮

---

<div align="center">

**⚡ Built with [Astro](https://astro.build/) | Styled with [Tailwind CSS](https://tailwindcss.com/) | Powered by Level 5
⚡**

*「不管是多么微不足道的能力，只要使用方式正确，就能发挥出惊人的威力。」*

Made with ❤️ by the Misaka Network

</div>
