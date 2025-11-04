# Misaka-Net-Blog

一个使用 Astro + Cloudflare Pages 搭建的现代化个人博客。

## ✨ 特性

- ⚡ **极致性能**：基于 Astro 构建，默认零 JavaScript
- 🌍 **全球加速**：部署在 Cloudflare Pages，全球 CDN 加速
- 📝 **Markdown 支持**：使用 Markdown/MDX 编写文章
- 🎨 **简洁设计**：专注于内容的极简设计
- 📱 **响应式布局**：完美适配各种设备
- 🔍 **SEO 优化**：自动生成 Sitemap 和 RSS Feed

## 🚀 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:4321
```

### 构建项目

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 📂 项目结构

```
├── src/
│   ├── components/      # 可复用组件
│   ├── content/
│   │   └── blog/       # 博客文章（Markdown/MDX）
│   ├── layouts/        # 页面布局
│   ├── pages/          # 路由页面
│   └── styles/         # 全局样式
├── public/             # 静态资源
├── astro.config.mjs    # Astro 配置
└── package.json
```

## 📝 写作指南

### 创建新文章

在 `src/content/blog/` 目录下创建新的 `.md` 或 `.mdx` 文件：

```markdown
---
title: '文章标题'
description: '文章描述'
pubDate: '2025-11-04'
heroImage: '../../assets/your-image.jpg'
---

文章内容...
```

### Front Matter 字段

- `title`: 文章标题（必填）
- `description`: 文章描述（必填）
- `pubDate`: 发布日期（必填）
- `heroImage`: 封面图片（可选）

## 🌐 部署到 Cloudflare Pages

### 方式一：通过 Cloudflare Dashboard（推荐）

1. **推送代码到 GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

2. **连接 Cloudflare Pages**

- 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
- 进入 **Workers & Pages** > **Pages**
- 点击 **Create a project** > **Connect to Git**
- 选择你的 GitHub 仓库

3. **配置构建设置**

```
构建命令：npm run build
构建输出目录：dist
Node.js 版本：20 或更高
```

4. **部署**

- 点击 **Save and Deploy**
- 等待构建完成
- 访问提供的 `*.pages.dev` 域名

### 方式二：使用 Wrangler CLI

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署
wrangler pages deploy dist
```

### 自定义域名

1. 在 Cloudflare Pages 项目设置中点击 **Custom domains**
2. 添加你的域名
3. Cloudflare 会自动配置 DNS 和 SSL

## 🛠️ 技术栈

- **框架**：[Astro](https://astro.build/) - 现代化静态网站生成器
- **部署**：[Cloudflare Pages](https://pages.cloudflare.com/) - 全球边缘网络
- **样式**：原生 CSS
- **内容**：Markdown/MDX
- **包管理器**：npm

## 📦 依赖包

- `astro` - Astro 核心
- `@astrojs/cloudflare` - Cloudflare Pages 适配器
- `@astrojs/mdx` - MDX 支持
- `@astrojs/rss` - RSS Feed 生成
- `@astrojs/sitemap` - Sitemap 生成

## 🎯 待办事项

- [ ] 添加评论功能
- [ ] 添加搜索功能
- [ ] 添加标签分类
- [ ] 添加深色模式
- [ ] 添加阅读时间统计
- [ ] 添加文章目录导航

## 📄 命令说明

| 命令 | 功能 |
| :--- | :--- |
| `npm install` | 安装依赖 |
| `npm run dev` | 启动开发服务器 (localhost:4321) |
| `npm run build` | 构建生产版本到 `./dist/` |
| `npm run preview` | 本地预览构建结果 |
| `npm run astro ...` | 运行 Astro CLI 命令 |

## 📝 环境变量配置

在 Cloudflare Pages 中配置环境变量：

1. 进入项目设置 > **Environment variables**
2. 添加需要的环境变量
3. 重新部署项目

## 🔧 自定义配置

### 修改网站信息

编辑 `src/consts.ts` 文件：

```typescript
export const SITE_TITLE = '你的博客标题';
export const SITE_DESCRIPTION = '你的博客描述';
```

### 修改域名

编辑 `astro.config.mjs` 文件：

```javascript
export default defineConfig({
  site: 'https://你的域名.com',
  // ...
});
```

## 📚 参考资源

- [Astro 官方文档](https://docs.astro.build/)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Markdown 语法指南](https://www.markdownguide.org/)

## 📄 License

MIT

---

使用 ❤️ 和 Astro 构建
