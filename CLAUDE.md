# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Misaka Network Blog - 基于 Astro 5.x 的现代化静态博客系统，采用深色科技风格设计。

**核心技术栈：**
- Astro 5.15.3 (静态站点生成器)
- TypeScript 5.0 (严格类型检查)
- Tailwind CSS 3.4.18 (自定义 Misaka 主题)
- Markdown/MDX (Astro 内容集合 API)
- 数学公式：remark-math + rehype-katex
- 流程图：Mermaid.js (CDN 动态加载)
- 搜索：Fuse.js (客户端模糊搜索)

**部署：** Cloudflare Pages (https://blog.misaka-net.top)

## 常用命令

```bash
npm run dev                 # 启动开发服务器 (localhost:4321)
npm run build               # 构建生产版本到 ./dist/
npm run preview             # 预览构建结果
npm run build-and-preview   # 构建后立即预览
npm run new                 # 交互式创建新博客文章
npm run friends             # 交互式友链管理工具 (增删改查)
npm run friends:test        # 测试友链数据读取功能
npm run admin               # 启动 Admin 管理后台 (localhost:3001)
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

## 核心架构要点

### 1. Astro 5.x 内容管理系统的关键变化

**从文件系统扫描到 Glob Loader API：**

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

**关键特性：**
- **构建时数据加载**：`loader: glob()` 在构建阶段扫描文件系统，生成静态内容集合
- **类型安全保证**：Zod schema 提供编译时类型检查和运行时验证
- **草稿过滤机制**：`draft: true` 的文章在生产环境被 `getCollection()` 自动过滤
- **文章 ID 规则**：`post.id` = 文件路径不含扩展名（如 `25-01-15-14-30.md` → `"25-01-15-14-30"`）

**动态路由实现：**
```typescript
// src/pages/blog/[...slug].astro
export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.id },
    props: post,
  }));
}
```

### 2. Astro 群岛架构的深层应用

**核心原则：零 JavaScript 默认 + 选择性激活**

```astro
<!-- ❌ 错误：不需要 client:* 指令（除非使用 React/Vue 等框架） -->
<Component client:load />

<!-- ✅ 正确：Astro 组件内部使用 <script> 标签 -->
<Component />
```

**跨组件通信模式（自定义事件总线）：**
```javascript
// 发送方 (SearchButton.astro)
window.dispatchEvent(new CustomEvent('open-search'));

// 接收方 (SearchModal.astro)
window.addEventListener('open-search', openSearch);
```

**主题切换系统示例：**
```javascript
// ThemeToggle.astro - 发送主题切换事件
window.dispatchEvent(new CustomEvent('theme-changed', {
  detail: { theme: newTheme, timestamp: Date.now() }
}));

// MermaidRendererOptimized.astro - 监听并重新渲染图表
window.addEventListener('theme-changed', async (event) => {
  const { theme } = event.detail;
  await rerenderMermaidDiagrams();
});
```

### 3. 路由系统的关键逻辑（易出错）

**文章前后导航的陷阱：**
```typescript
// 文章按 pubDate 降序排列（最新在前）
const allPosts = sortedPosts; // [新 → 旧]
const currentIndex = allPosts.findIndex(p => p.id === post.id);

// ⚠️ 注意：因为降序排列，索引逻辑颠倒
const prevPost = allPosts[currentIndex + 1]; // 时间更早的文章（向旧）
const nextPost = allPosts[currentIndex - 1]; // 时间更新的文章（向新）
```

### 4. Mermaid 渲染器的性能优化架构

**核心问题：**
- CDN 加载耗时
- 复杂图表渲染阻塞主线程
- 主题切换需要重新渲染

**解决方案：渲染队列 + 懒加载**

```javascript
// MermaidRendererOptimized.astro 的关键设计
const renderQueue = []; // 图表渲染队列
let isRendering = false; // 防并发锁

// 1️⃣ CDN 懒加载（仅在需要时加载）
async function loadMermaid() {
  if (window.mermaid) return window.mermaid;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
    script.onload = () => resolve(window.mermaid);
    document.head.appendChild(script);
  });
}

// 2️⃣ 逐个渲染（避免阻塞）
async function processRenderQueue(mermaid) {
  while (renderQueue.length > 0) {
    const { block, index } = renderQueue.shift();
    await renderSingleDiagram(block, index, mermaid);
    await new Promise(resolve => setTimeout(resolve, 100)); // 🔑 让出主线程
  }
}

// 3️⃣ 主题响应式重渲染
window.addEventListener('theme-changed', async (event) => {
  for (let diagram of mermaidDiagrams) {
    const { svg } = await mermaid.render(`${diagram.id}-rerender`, diagram.code);
    diagram.container.innerHTML = svg;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
});
```

**关键技术点：**
- **代码块识别**：`pre[data-language="mermaid"] code`（依赖 Shiki 的 `data-language` 属性）
- **DOM 健壮性检查**：`if (!block.isConnected) return;` 防止元素失效
- **全屏查看器集成**：通过 `open-mermaid-viewer` 事件触发 `MermaidViewer.astro`

### 5. 搜索系统的三层架构

**第 1 层：静态索引生成（构建时）**
```typescript
// src/pages/search.json.ts - API 端点
export const GET: APIRoute = async () => {
  const posts = await getCollection('blog', ({ data }) => data.draft !== true);
  const searchIndex = posts.map((post) => ({
    slug: post.id,
    title: post.data.title,
    description: post.data.description,
    tags: post.data.tags || [],
  }));
  return new Response(JSON.stringify(searchIndex));
};
```

**第 2 层：Fuse.js 模糊搜索（客户端）**
```javascript
// SearchModal.astro
fuse = new Fuse(searchData, {
  keys: [
    { name: 'title', weight: 3 },       // 标题权重最高
    { name: 'description', weight: 2 }, // 描述次之
    { name: 'tags', weight: 1 },        // 标签最低
  ],
  threshold: 0.4,
  ignoreLocation: true,
  minMatchCharLength: 2,
});
```

**第 3 层：懒加载策略**
```javascript
async function loadSearchData() {
  if (searchData.length > 0) return; // 🔑 缓存检查
  const response = await fetch('/search.json'); // 仅在首次打开时加载
  searchData = await response.json();
}
```

**快捷键：** `Cmd/Ctrl + K` 全局触发搜索框

### 6. 主题系统的 FOUC 防护策略

**问题：** 页面加载时出现主题闪烁（Flash of Unstyled Content）

**解决方案：内联脚本 + localStorage**

```astro
<!-- BaseHead.astro -->
<script is:inline>
(function() {
  function getTheme() {
    // 优先级：localStorage > 系统偏好 > 默认深色
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark';
  }

  function applyTheme() {
    const theme = getTheme();
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  applyTheme(); // 🔑 在 DOM 渲染前执行
})();
</script>
```

**关键技术细节：**
- `is:inline`：强制 Astro 内联脚本到 HTML（不打包到 JS 文件）
- **执行时机**：在 `<head>` 中，DOM 渲染前
- **双层主题系统**：CSS 变量（支持切换） + Tailwind 品牌色（固定）

### 7. 数学公式渲染管道

**处理流程：**
```
Markdown 源文件
  ↓ remark-math (构建时解析 $...$ 和 $$...$$)
  ↓ rehype-katex (构建时生成 KaTeX HTML)
  ↓ KaTeX CSS (客户端 CDN 加载)
  ↓ 深色模式适配 (.dark .katex 自定义样式)
```

**关键配置：**
```javascript
// astro.config.mjs
export default defineConfig({
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});
```

### 8. Admin 管理后台架构

**技术栈：** Express.js (后端) + 纯 HTML/CSS/JS (前端)

**启动方式：**
```bash
npm run admin  # 启动 Web 界面 (http://localhost:3001)
```

**RESTful API 设计：**
```javascript
// admin-server.js
app.get('/api/posts', (req, res) => { /* 文章列表 */ });
app.post('/api/posts', (req, res) => { /* 创建文章 */ });
app.put('/api/posts/:id', (req, res) => { /* 更新文章 */ });
app.delete('/api/posts/:id', (req, res) => { /* 删除文章 */ });

app.get('/api/friends', (req, res) => { /* 友链列表 */ });
app.post('/api/friends', (req, res) => { /* 添加友链 */ });

app.get('/api/profile', (req, res) => { /* 个人信息 */ });
app.put('/api/profile', (req, res) => { /* 更新个人信息 */ });

app.post('/api/build', async (req, res) => { /* 触发构建 */ });
```

**Frontmatter 解析器（关键实现）：**
```javascript
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  // 逐行解析字段（支持多行值）
  const lines = frontmatterStr.split('\n');
  let currentKey = null;
  let currentValue = '';

  for (const line of lines) {
    const keyMatch = line.match(/^(\w+):\s*(.*)$/);
    if (keyMatch) {
      if (currentKey) frontmatter[currentKey] = parseValue(currentValue.trim());
      currentKey = keyMatch[1];
      currentValue = keyMatch[2];
    } else if (currentKey) {
      currentValue += '\n' + line; // 多行值拼接
    }
  }

  return { frontmatter, content: bodyContent };
}
```

### 9. CLI 工具的设计模式

**文章创建脚本（scripts/new-post.js）：**
- 自动生成时间戳文件名：`YY-MM-DD-HH-MM.md`
- 交互式填写 frontmatter
- 自动打开默认编辑器

**友链管理脚本（scripts/manage-friends.js）：**
- 正则表达式解析 TypeScript 代码
- 支持增删改查操作
- 直接修改 `src/consts.ts` 文件

**核心技术：**
```javascript
// 从 consts.ts 中提取友链数据
function readFriendLinks() {
  const content = fs.readFileSync(CONSTS_FILE, 'utf8');
  const match = content.match(/export const FRIEND_LINKS: FriendLink\[\] = \[([\s\S]*?)\];/);

  // 解析友链对象（支持可选的 note 字段）
  const objectRegex = /\{[\s\S]*?name:\s*'([^']+)'[\s\S]*?url:\s*'([^']+)'[\s\S]*?avatar:\s*'([^']+)'[\s\S]*?description:\s*'([^']+)'(?:[\s\S]*?note:\s*'([^']*)')?[\s\S]*?\}/g;

  const friendLinks = [];
  while ((objectMatch = objectRegex.exec(arrayContent)) !== null) {
    friendLinks.push({
      name: objectMatch[1],
      url: objectMatch[2],
      avatar: objectMatch[3],
      description: objectMatch[4],
      note: objectMatch[5] // 可选备注
    });
  }
  return { content, friendLinks };
}
```

## 关键开发陷阱

### 1. 数学公式中的 Unicode 字符

**问题：** KaTeX 不支持在数学公式中直接使用 Unicode 字符（如 Ω、μ、℃ 等）

**解决：** 必须使用 LaTeX 命令

```markdown
❌ 错误: $100 kΩ$, $25℃$, $10μA$
✅ 正确: $100\ \text{k}\Omega$, $25\ ^\circ\text{C}$, $10\ \mu\text{A}$
```

### 2. Mermaid 节点标签中的特殊字符

**冒号问题：**
```mermaid
❌ 错误: A[data: 文章数组]
✅ 正确: A[data - 文章数组]  或  A["data: 文章数组"]
```

**省略号问题：**
```mermaid
❌ 错误: G[...]
✅ 正确: G[更多]  或  G[其他选项]
```

### 3. 主题切换闪烁 (FOUC)

**错误做法：** 在组件 `<script>` 中读取主题
**正确做法：** 在 `BaseHead.astro` 中使用 `is:inline` 内联脚本

### 4. 代码块语言标识

**必须指定语言：** ` ```typescript ` 而不是 ` ``` `
- 启用 Shiki 语法高亮
- 自动添加 `data-language` 属性（Mermaid 渲染依赖此属性）

### 5. View Transitions 已完全移除

**当前状态：**
- ❌ 项目不使用 View Transitions
- ✅ 使用传统的完整页面刷新
- ✅ Mermaid 渲染器无需处理 `astro:page-load` 事件
- ✅ 页面行为更加可预测和简单

## 配置文件关键决策

### astro.config.mjs

```javascript
export default defineConfig({
  site: 'https://blog.misaka-net.top', // 用于生成 sitemap 和 RSS
  integrations: [
    mdx(),
    sitemap(),
    tailwind({
      applyBaseStyles: false, // 禁用默认样式，使用自定义 global.css
    }),
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      theme: 'dracula',  // 代码高亮主题
      wrap: true,        // 自动换行
    },
  },
});
```

### tailwind.config.mjs

```javascript
export default {
  darkMode: 'class', // 基于 .dark 类切换（配合主题系统）
  theme: {
    extend: {
      colors: {
        'misaka-dark': '#1e293b',
        'misaka-circuit': '#4ade80',   // 电路板绿（品牌色）
        'misaka-blue': '#00bfff',      // 电磁炮蓝（品牌色）
        'misaka-accent': '#38bdf8',
      },
      backgroundImage: {
        'circuit-pattern': "url(...)", // SVG 电路板纹理
      },
    },
  },
};
```

### tsconfig.json

```json
{
  "extends": "astro/tsconfigs/strict", // 继承 Astro 严格配置
  "compilerOptions": {
    "strictNullChecks": true // 额外启用空值检查
  }
}
```

## 代码库特有的约定

### 文件命名规范

- 博客文章：`YY-MM-DD-HH-MM.md`（时间戳格式）
- 组件：PascalCase（`SearchModal.astro`）
- 布局：PascalCase（`BlogPost.astro`）
- 脚本：kebab-case（`new-post.js`）

### 性能优化关键点

1. **Mermaid 懒加载**：首次渲染时才加载 CDN
2. **搜索索引懒加载**：打开搜索框时才 fetch `/search.json`
3. **数学公式构建时渲染**：不在客户端执行

### 可访问性设计

- 完善的 `aria-label` 和 `aria-modal` 属性
- 键盘导航支持（搜索框 `Cmd+K`、主题切换）
- `prefers-reduced-motion` 媒体查询支持

## 常见问题排查

### Mermaid 图表不渲染

1. 检查代码块是否指定了语言：` ```mermaid `
2. 检查是否有特殊字符（冒号、省略号）
3. 打开浏览器控制台查看错误日志（MermaidRendererOptimized.astro 有详细日志）

### 数学公式显示异常

1. 检查是否使用了 Unicode 字符（需替换为 LaTeX 命令）
2. 确认 KaTeX CSS 已加载（查看 Network 面板）
3. 检查深色模式下的样式（`.dark .katex`）

### 主题切换闪烁

1. 确认 `BaseHead.astro` 中的内联脚本使用了 `is:inline`
2. 检查脚本位置是否在 `<head>` 中
3. 确认 `localStorage` 可用（隐私模式可能禁用）

### 搜索功能无响应

1. 检查 `/search.json` 是否可访问
2. 确认 Fuse.js 已正确初始化
3. 检查快捷键监听器是否正常（`Cmd/Ctrl + K`）

## 总结：多文件才能理解的核心架构知识

1. **Astro 5.x 内容集合系统**：`glob` loader + Zod schema + 构建时静态生成
2. **Mermaid 渲染优化**：队列机制 + 懒加载 + 主题响应式重渲染
3. **搜索系统三层架构**：静态索引生成 + Fuse.js 模糊搜索 + 懒加载
4. **主题系统 FOUC 防护**：内联脚本 + localStorage + 双层 CSS 变量
5. **跨组件通信**：自定义事件总线（`window.dispatchEvent` + `addEventListener`）
6. **工具链设计**：CLI 交互式脚本 + Express 后台 + 正则解析 TypeScript 代码
7. **路由逻辑陷阱**：降序排列导致的 prev/next 索引颠倒
8. **数学公式渲染管道**：remark-math → rehype-katex → 深色模式 CSS 适配
