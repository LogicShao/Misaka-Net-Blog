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
npm run dev                 # 启动开发服务器 (localhost:4321)
npm run build               # 构建生产版本到 ./dist/
npm run preview             # 预览构建结果
npm run build-and-preview   # 构建后立即预览
npm run new                 # 交互式创建新博客文章 (推荐)
npm run admin               # 启动 Admin 管理后台 (localhost:3001)
npm run astro -- --version  # 查看 Astro 版本
```

## 开发服务器运行规则

**重要：** 除非用户明确要求，否则不要执行以下命令：
- `npm run dev` / `npm start`
- `npm run build`（除非用户要求构建）
- 任何启动服务器的命令

**原则：**
- 仅在用户明确请求"启动开发服务器"或"运行 dev"时执行
- 不要假设用户需要预览更改
- 代码修改完成后，说明更改内容即可，不要自动启动服务器

## Git 提交规则

**重要：除非用户明确要求，否则绝对不要执行 Git 提交或分支操作。**

**禁止的操作（除非用户明确请求）：**
- `git commit`
- `git push`
- `git checkout -b` / `git branch`
- `git merge`
- `git rebase`
- 任何修改 Git 历史的操作

**原则：**
- 仅在用户明确请求"提交更改"或"创建提交"时执行
- 不要主动建议进行 Git 操作
- 代码修改完成后，仅说明更改内容，不要询问是否提交

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

**缩放查看功能（MermaidViewer.astro）：**
```javascript
// 自动为所有 Mermaid 图表添加放大按钮（左上角）
document.querySelectorAll('.mermaid-diagram').forEach(diagram => {
  const zoomBtn = document.createElement('button');
  zoomBtn.className = 'mermaid-zoom-btn';
  zoomBtn.innerHTML = '🔍 放大';

  zoomBtn.onclick = () => {
    const modal = document.getElementById('mermaid-viewer');
    modal.querySelector('.modal-content').innerHTML = diagram.innerHTML;
    modal.classList.remove('hidden');
  };

  // 定位到左上角
  diagram.style.position = 'relative';
  diagram.appendChild(zoomBtn);
});
```

**全屏模态框样式：**
```css
#mermaid-viewer {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
}
```

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

### 8.1 目录组件（TableOfContents）智能自适应

**关键逻辑：**
```javascript
const COLLAPSE_THRESHOLD = 1400;  // 阈值：1400px

// 窗口宽度 >= 1400px: 自动展开
// 窗口宽度 < 1400px:  自动收起（避免与正文重叠）
const initialWidth = window.innerWidth;
let isExpanded = initialWidth >= COLLAPSE_THRESHOLD;
```

**滚动高亮实现（性能优化）：**
```javascript
let ticking = false;

function updateActiveHeading() {
  const scrollPosition = window.scrollY + 100;  // 100px 偏移

  headings.forEach((heading) => {
    if (scrollPosition >= heading.offsetTop) {
      currentHeading = heading;
    }
  });

  // 更新 active 类
  tocList.querySelector('.active')?.classList.remove('active');
  tocList.querySelector(`a[href="#${currentHeading.id}"]`)?.classList.add('active');
}

// 使用 requestAnimationFrame 节流
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateActiveHeading();
      ticking = false;
    });
    ticking = true;
  }
});
```

**层级缩进样式：**
```css
li[data-level="2"] a { padding-left: 12px; }
li[data-level="3"] a { padding-left: 32px; }
li[data-level="4"] a { padding-left: 52px; }
```

### 8.2 标签可视化系统（/tags 页面）

**Chart.js 集成 - 响应式主题：**
```javascript
const isDark = document.documentElement.classList.contains('dark');

const chart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: sortedTags.map(item => item.tag),
    datasets: [{
      label: '文章数量',
      data: sortedTags.map(item => item.count),
      backgroundColor: isDark ? 'rgba(74, 222, 128, 0.1)' : 'rgba(74, 222, 128, 0.3)',
      borderColor: '#4ade80',
    }]
  },
  options: {
    responsive: true,
    scales: {
      y: {
        ticks: { color: isDark ? '#e2e8f0' : '#334155' }
      },
      x: {
        ticks: { color: isDark ? '#e2e8f0' : '#334155' }
      }
    }
  }
});

// 主题切换时重新初始化图表
observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['class']
});
```

**彩色标签卡片系统（6 种颜色循环）：**
```javascript
const colorSchemes = [
  { bg: 'rgba(74, 222, 128, 0.1)', border: '#4ade80', text: '#4ade80' },   // 绿色
  { bg: 'rgba(56, 189, 248, 0.1)', border: '#38bdf8', text: '#38bdf8' },   // 蓝色
  { bg: 'rgba(168, 85, 247, 0.1)', border: '#a855f7', text: '#a855f7' },   // 紫色
  { bg: 'rgba(251, 146, 60, 0.1)', border: '#fb923c', text: '#fb923c' },   // 橙色
  { bg: 'rgba(236, 72, 153, 0.1)', border: '#ec4899', text: '#ec4899' },   // 粉色
  { bg: 'rgba(234, 179, 8, 0.1)', border: '#eab308', text: '#eab308' }     // 黄色
];

const colorScheme = colorSchemes[index % colorSchemes.length];
```

### 8.3 代码复制功能（CopyCodeButton）

**自动注入所有代码块：**
```javascript
document.querySelectorAll('pre').forEach(pre => {
  const button = document.createElement('button');
  button.className = 'copy-code-btn';
  button.innerHTML = '复制';

  button.onclick = async () => {
    await navigator.clipboard.writeText(pre.textContent);
    button.innerHTML = '已复制！';
    setTimeout(() => button.innerHTML = '复制', 2000);
  };

  pre.appendChild(button);
});
```

**CSS 定位（右上角）：**
```css
.copy-code-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;
}

pre:hover .copy-code-btn {
  opacity: 1;
}
```

### 9. Admin 管理后台

**架构：**
- 后端：Express.js (`admin-server.js`, 端口 3001)
- 前端：纯 HTML/CSS/JS (`admin-ui/index.html`)
- Electron 桌面应用：`electron-admin/` (可选，通过 `launch-admin.bat` 启动)
- API：RESTful (GET/POST/PUT/DELETE `/api/posts/*`)

**启动方式：**
```bash
# 方式一：Web 界面（推荐开发时使用）
npm run admin  # 访问 http://localhost:3001

# 方式二：Electron 桌面应用（推荐生产使用）
launch-admin.bat          # Windows
./启动博客管理后台.bat      # Windows (中文)

# 方式三：Electron 开发模式（仅开发调试）
cd electron-admin
npm start                 # 启动 Electron（默认不显示开发者工具）
npm run dev               # 启动 Electron（带开发者工具）
```

**Electron 开发者工具配置：**
- 默认情况：Electron Admin 启动时**不显示**开发者工具（用户体验更好）
- 手动打开方式：
  - 快捷键：`F12` 或 `Ctrl+Shift+I`（Windows/Linux）/ `Cmd+Opt+I`（macOS）
  - 菜单：**视图 → 切换开发者工具**
- 如需默认显示开发者工具，在 `electron-admin/main.js:56` 中取消注释 `mainWindow.webContents.openDevTools();`

**核心功能：**
- 文章列表、创建、编辑、删除
- 触发 `npm run build` 构建
- Frontmatter 解析与生成
- 实时预览 Markdown 渲染（Electron 版）

**Frontmatter 处理关键实现：**

```javascript
// parseFrontmatter() - 解析 YAML 并转换类型
function parseFrontmatter(content) {
  // 关键：布尔值 "true"/"false" 需转为真正的 boolean
  if (value === 'true') return true;
  if (value === 'false') return false;

  // 处理数组
  if (value.startsWith('[') && value.endsWith(']')) {
    return JSON.parse(value.replace(/'/g, '"'));
  }

  return value;
}

// buildFrontmatter() - 生成 YAML
function buildFrontmatter(frontmatter) {
  // 布尔值和数字不加引号
  if (typeof value === 'boolean' || typeof value === 'number') {
    result += `${key}: ${value}\n`;
  }
  // 数组格式：tags: ['标签1', '标签2']
  else if (Array.isArray(value)) {
    result += `${key}: [${value.map(v => `'${v}'`).join(', ')}]\n`;
  }
  // 字符串加引号
  else {
    result += `${key}: '${value}'\n`;
  }
}
```

**API 端点完整列表：**
| 方法 | 端点 | 功能 |
|------|------|------|
| GET | `/api/posts` | 获取所有文章列表 |
| GET | `/api/posts/:id` | 获取单篇文章详情 |
| POST | `/api/posts` | 创建新文章 |
| PUT | `/api/posts/:id` | 更新文章 |
| DELETE | `/api/posts/:id` | 删除文章 |
| POST | `/api/build` | 触发 `npm run build` |

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

### 6. 数学公式中的 Unicode 字符

**问题：** KaTeX 不支持在数学公式中直接使用 Unicode 字符（如 Ω、μ、℃ 等）
**解决：** 必须使用 LaTeX 命令

**常见错误与修正：**
```markdown
❌ 错误: $100 kΩ$, $25℃$, $10μA$
✅ 正确: $100\ \text{k}\Omega$, $25\ ^\circ\text{C}$, $10\ \mu\text{A}$

❌ 错误: 10⁸ ~ 10¹⁰ Ω  (Unicode 上标和符号)
✅ 正确: $10^8 \sim 10^{10}\ \Omega$
```

**LaTeX 符号速查：**
| Unicode | LaTeX 命令 | 说明 |
|---------|-----------|------|
| Ω | `\Omega` | 欧姆 |
| μ | `\mu` | 微 (micro) |
| ℃ | `^\circ\text{C}` | 摄氏度 |
| ° | `^\circ` | 度数符号 |
| ± | `\pm` | 正负号 |
| × | `\times` | 乘号 |
| ÷ | `\div` | 除号 |
| ≈ | `\approx` | 约等于 |
| ≤ | `\leq` | 小于等于 |
| ≥ | `\geq` | 大于等于 |
| ∞ | `\infty` | 无穷大 |

**单位前缀规范：**
```latex
$\text{k}\Omega$  - 千欧 (kΩ)
$\text{M}\Omega$  - 兆欧 (MΩ)
$\text{G}\Omega$  - 吉欧 (GΩ)
$\text{m}\Omega$  - 毫欧 (mΩ)
$\mu\text{A}$     - 微安 (μA)
$\text{mA}$       - 毫安 (mA)
$\text{nF}$       - 纳法 (nF)
$\text{pF}$       - 皮法 (pF)
```

**检测方法：**
```bash
# 查找可能的 Unicode 字符问题
grep -n "[Ωμ℃°±×÷≈≤≥∞]" src/content/blog/*.md

# 构建时查看 KaTeX 警告
npm run build 2>&1 | grep -i "latex.*warn"
```

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

| 文件 | 用途 | 优先级 |
|------|------|--------|
| `src/content.config.ts` | 内容集合 Schema 定义（Zod 验证）| ⭐⭐⭐⭐⭐ |
| `astro.config.mjs` | Astro 配置（插件、Markdown 处理）| ⭐⭐⭐⭐⭐ |
| `src/consts.ts` | 站点信息、友链配置 | ⭐⭐⭐⭐ |
| `tailwind.config.mjs` | Tailwind 扩展（Misaka 主题色、字体）| ⭐⭐⭐⭐ |
| `src/styles/global.css` | 全局样式（CSS 变量、@layer 结构）| ⭐⭐⭐⭐⭐ |
| `src/components/BaseHead.astro` | 防 FOUC 脚本、SEO Meta 标签 | ⭐⭐⭐⭐⭐ |
| `src/components/SearchModal.astro` | Fuse.js 搜索实现 | ⭐⭐⭐⭐ |
| `src/components/MermaidRenderer.astro` | Mermaid 流程图渲染 | ⭐⭐⭐⭐ |
| `src/components/TableOfContents.astro` | 智能目录组件 | ⭐⭐⭐ |
| `src/pages/blog/[...slug].astro` | 动态路由、前后导航 | ⭐⭐⭐⭐⭐ |
| `src/pages/search.json.ts` | 搜索索引 API | ⭐⭐⭐⭐ |
| `scripts/new-post.js` | 交互式创建文章工具 | ⭐⭐⭐⭐ |
| `admin-server.js` | Admin 后台服务器 (Express, 端口 3001) | ⭐⭐⭐ |
| `admin-ui/index.html` | Admin 前端界面（文章 CRUD、构建触发）| ⭐⭐⭐ |
| `electron-admin/` | Electron 桌面管理应用（可选）| ⭐⭐ |

**优先级说明：**
- ⭐⭐⭐⭐⭐ - 核心文件，几乎每次开发都会涉及
- ⭐⭐⭐⭐ - 重要文件，常规开发经常使用
- ⭐⭐⭐ - 功能性文件，特定场景使用
- ⭐⭐ - 辅助工具，可选使用

## 常见问题速查

### 快速诊断

**构建失败：**
```bash
# 检查 frontmatter 验证错误
npm run build -- --verbose

# 常见原因：
# 1. 文章缺少必填字段 (title, description, pubDate)
# 2. pubDate 格式错误（必须是 YYYY-MM-DD）
# 3. tags 不是数组格式
# 4. heroImage 路径错误
```

**主题闪烁（FOUC）：**
- 确认 `BaseHead.astro` 中脚本使用 `is:inline` 属性
- 检查脚本是否在 `<head>` 中（不能在 `<body>` 中）
- 确保 localStorage 读取逻辑在 DOM 渲染前执行

**数学公式不显示：**
```bash
# 1. 检查 KaTeX CSS 是否加载
curl https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css

# 2. 检查 Markdown 配置
# astro.config.mjs 必须包含：
# remarkPlugins: [remarkMath],
# rehypePlugins: [rehypeKatex],

# 3. 深色模式适配
# global.css 必须有：.dark .katex { color: var(--text-primary); }

# 4. 检查 Unicode 字符问题
grep -n "[Ωμ℃°±×÷≈≤≥∞]" src/content/blog/*.md
# 如果有结果，需要替换为 LaTeX 命令（参见"关键开发陷阱"第 6 节）
```

**Mermaid 不渲染：**
- 代码块必须指定语言：` ```mermaid ` 而不是 ` ``` `
- 检查 Shiki 是否添加 `data-language="mermaid"` 属性
- 查看浏览器控制台是否有 Mermaid.js 加载错误

**搜索无结果：**
```bash
# 1. 确认搜索索引已生成
curl http://localhost:4321/search.json

# 2. 检查是否过滤了草稿
# getCollection('blog', ({ data }) => data.draft !== true)

# 3. 清除构建缓存
rm -rf node_modules/.astro dist
npm run build
```

**Admin 后台无法访问：**
```bash
# 检查端口是否被占用
netstat -ano | findstr :3001  # Windows
lsof -i :3001                 # macOS/Linux

# 更改端口（admin-server.js）
const PORT = 3002;  // 改为其他端口
```

### 配置修改

**添加友链：**
编辑 `src/consts.ts` 中的 `FRIEND_LINKS` 数组
```typescript
export const FRIEND_LINKS = [
  {
    title: '友链名称',
    description: '友链描述',
    url: 'https://example.com',
    avatar: '/avatars/friend.jpg'
  }
];
```

**自定义主题颜色：**
编辑 `tailwind.config.mjs` 的 `theme.extend.colors` 或 `global.css` 的 CSS 变量
```javascript
// tailwind.config.mjs
'misaka-circuit': '#4ade80',  // 修改电路板绿色

// global.css
--text-primary: #f0f8ff;  // 修改主文本颜色
```

**更改代码高亮主题：**
编辑 `astro.config.mjs` 的 `markdown.shikiConfig.theme`
```javascript
shikiConfig: {
  theme: 'nord',  // 参考 https://shiki.style/themes
  wrap: true
}
```

### 性能优化详细策略

**构建时优化：**
```bash
# 1. 静态预渲染（已自动启用）
# 所有页面在构建时生成 HTML，零客户端渲染

# 2. 图片优化
# 使用 Astro Image 组件（自动压缩、WebP 转换）
import { Image } from 'astro:assets';
<Image src={heroImage} alt="..." />

# 3. CSS 摇树优化
# Tailwind PurgeCSS 自动移除未使用的样式
# 配置：tailwind.config.mjs 的 content 数组

# 4. 代码分割
# Astro 自动为每个页面生成独立的 JavaScript bundle
```

**运行时优化：**
```javascript
// 1. 懒加载搜索数据
let searchData = null;
async function loadSearchData() {
  if (!searchData) {
    searchData = await fetch('/search.json').then(r => r.json());
  }
  return searchData;
}

// 2. 节流滚动事件（目录高亮）
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(updateActiveHeading);
    ticking = true;
  }
});

// 3. CDN 资源预连接（BaseHead.astro）
<link rel="preconnect" href="https://cdn.jsdelivr.net" />
<link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />

// 4. 关键 CSS 内联
<style is:inline>
  /* 首屏关键样式内联 */
  :root { --bg-primary: #0f172a; }
</style>
```

**SEO 优化完整配置：**
```astro
<!-- BaseHead.astro -->
<!-- Primary Meta Tags -->
<title>{title}</title>
<meta name="title" content={title} />
<meta name="description" content={description} />
<meta name="robots" content="index, follow" />
<meta name="googlebot" content="index, follow" />

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content={Astro.url} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content={new URL(image.src, Astro.url)} />
<meta property="og:site_name" content={SITE_TITLE} />

<!-- Twitter Cards -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content={Astro.url} />
<meta property="twitter:title" content={title} />
<meta property="twitter:description" content={description} />
<meta property="twitter:image" content={new URL(image.src, Astro.url)} />

<!-- Sitemap & RSS -->
<link rel="sitemap" href="/sitemap-index.xml" />
<link rel="alternate" type="application/rss+xml"
      title={SITE_TITLE} href={new URL('rss.xml', Astro.site)} />

<!-- Canonical URL -->
<link rel="canonical" href={Astro.url} />
```

### 调试技巧

**查看构建输出：**
```bash
npm run build -- --verbose
# 查看生成的文件大小、优化结果等详细信息
```

**本地预览生产构建：**
```bash
npm run build && npm run preview
# 在 localhost:4321 预览生产环境的构建结果
```

**检查 Astro 版本：**
```bash
npm run astro -- --version
# 确认使用 Astro 5.x 版本
```

**清除缓存重新构建：**
```bash
rm -rf node_modules/.astro dist .astro
npm run build
```

**查看运行时 JavaScript 大小：**
```bash
# 构建后检查 dist/ 目录
ls -lh dist/_astro/*.js
# 应该看到大部分页面的 JS 文件很小（< 10KB）
```

## 变更记录

### 2025-11-24
- **实现博客分页功能**：
  - 新增 `Pagination.astro` 分页组件，支持智能页码显示（总页数 > 7 时使用省略号）
  - 重构 `/blog` 路由为 `[...page].astro`，使用 Astro 的 `paginate()` API
  - 每页显示 10 篇文章，支持跳转到任意页面
  - URL 结构：`/blog`（第 1 页）、`/blog/2`（第 2 页）
- **重构主题切换事件系统**：
  - 使用自定义事件（`theme-changed`）替代 MutationObserver，避免无限循环
  - MermaidRenderer 监听主题切换事件，自动重新渲染流程图
  - 添加环境检测，生产环境自动禁用调试日志（`import.meta.env.DEV`）
- **新增拉康精神分析儿童读本**：创建 `25-11-24-16-00.md`（镜子里的秘密：他者与大他者）

### 2025-11-23
- **新增 Git 提交规则章节**：明确禁止未经用户明确请求的 Git 操作
- **完善常用命令**：添加 `build-and-preview` 和版本查询命令
- **增强 Electron Admin 文档**：
  - 添加开发模式启动说明（`npm start` vs `npm run dev`）
  - 详细说明开发者工具的配置和手动打开方式
  - 默认配置为不显示开发者工具，提升用户体验

### 2025-11-22 (下午更新)
- **新增关键开发陷阱**: 数学公式中的 Unicode 字符问题 (第 6 节)
- 添加 LaTeX 符号速查表（11 个常用符号）
- 添加单位前缀规范（8 个常用单位）
- 提供 Unicode 字符检测命令
- 说明 KaTeX 警告的诊断方法

### 2025-11-22
- **CLAUDE.md 大幅增强**：添加目录组件智能自适应逻辑详解
- 补充标签可视化系统（Chart.js 集成）完整实现
- 添加代码复制功能（CopyCodeButton）文档
- 增强 Admin 管理后台说明，包含 Electron 桌面应用启动方式
- 详细说明 Frontmatter 解析器类型转换逻辑
- 添加 Mermaid 缩放查看功能（MermaidViewer）文档
- 为关键文件列表添加优先级标识（⭐ 1-5 级）
- 大幅扩展故障排查章节：快速诊断、配置修改、调试技巧
- 添加性能优化详细策略：构建时/运行时/SEO 完整配置
- 补充 API 端点完整列表和使用示例

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
