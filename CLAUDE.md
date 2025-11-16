# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Misaka Network Blog 是一个基于 Astro 5.x 构建的现代化静态博客系统，采用 TypeScript + Tailwind CSS 技术栈，部署在 Cloudflare Pages 上。项目以"御坂网络"和"超电磁炮"为主题，具有科技感的设计风格。

## 常用命令

### 开发命令
```bash
npm run dev          # 启动开发服务器 (localhost:4321)
npm run build        # 构建生产版本到 ./dist/
npm run preview      # 本地预览构建结果
npm run new          # 交互式创建新博客文章
```

### 构建和部署
```bash
npm run build-and-preview  # 构建并预览
npm run astro -- --help    # 查看 Astro CLI 帮助
```

## 项目架构

### 核心目录结构
- `src/components/` - 可复用组件 (Header, Footer, Card, ThemeToggle 等)
- `src/layouts/` - 页面布局 (Layout.astro, BlogPost.astro)
- `src/pages/` - 路由页面 (首页、博客列表、文章详情、标签归档)
- `src/content/blog/` - 博客文章内容集合
- `src/consts.ts` - 全局常量配置
- `src/content.config.ts` - 内容集合类型定义

### 内容管理系统
- 使用 Astro 内容集合管理博客文章
- 支持 Markdown 和 MDX 格式
- 严格的前言数据验证 (title, description, pubDate, tags, draft 等)
- 自动生成 RSS 订阅和站点地图

### 样式系统
- Tailwind CSS 3.4 作为主要样式框架
- 自定义 Misaka Network 主题色彩系统：
  - `misaka-circuit` (#4ade80) - 电路板绿
  - `misaka-blue` (#00bfff) - 电磁炮蓝
  - `misaka-accent` (#38bdf8) - 辅助蓝
  - `misaka-bg` (#0f172a) - 深色背景
- 支持深色/浅色主题切换
- 电路板背景图案和电磁炮动画效果

## 开发指南

### 添加新文章
使用 `npm run new` 命令交互式创建新文章，或直接在 `src/content/blog/` 目录下创建 `.md` 文件：

```markdown
---
title: '文章标题'
description: '文章描述'
pubDate: 2024-01-15
tags: ['标签1', '标签2']
draft: false
---

# 文章内容
```

### 组件开发
- 使用 `.astro` 文件编写组件
- 遵循单一职责原则
- 组件间通过 props 传递数据
- 充分利用 Astro 的静态生成特性

### 样式开发
- 优先使用 Tailwind CSS 类
- 自定义样式放在 `src/styles/global.css`
- 遵循主题色彩系统
- 确保响应式设计

## 技术特性

### 集成功能
- 数学公式渲染 (remark-math + rehype-katex) - 支持深色/浅色模式适配
- 代码语法高亮 (Shiki + Dracula 主题)
- SEO 优化和 Open Graph 支持
- 图片优化和懒加载
- 文章目录导航
- 前后文章导航

### 性能优化
- 零 JavaScript 默认 (Astro 群岛架构)
- 静态站点生成
- 代码分割和懒加载
- 自动图片优化

## 部署配置

项目配置为 Cloudflare Pages 部署：
- 构建命令: `npm run build`
- 输出目录: `dist`
- 站点 URL: `https://blog.misaka-net.top`

## 注意事项

- 所有博客文章必须包含有效的前言数据
- 草稿文章设置 `draft: true` 不会在生产环境显示
- 使用 `npm run new` 命令确保文章格式正确
- 遵循现有的组件命名和文件组织约定
- 数学公式在深色模式下已适配，如需修改样式请更新 `src/styles/global.css` 中的 `.dark .katex` 相关样式