# Cloudflare Pages 部署指南

本指南将帮助你将 Astro 博客部署到 Cloudflare Pages。

## 前置条件

1. ✅ GitHub 账号
2. ✅ Cloudflare 账号（免费）
3. ✅ 已完成的 Astro 项目

## 方式一：通过 Cloudflare Dashboard 部署（推荐）

### 第一步：将代码推送到 GitHub

如果还没有初始化 Git 仓库：

```bash
# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 创建首次提交
git commit -m "Initial commit: Astro + Cloudflare Pages blog"

# 在 GitHub 上创建新仓库，然后关联并推送
git remote add origin https://github.com/你的用户名/你的仓库名.git
git branch -M main
git push -u origin main
```

### 第二步：连接到 Cloudflare Pages

1. **登录 Cloudflare**
   - 访问 https://dash.cloudflare.com/
   - 使用你的账号登录

2. **创建 Pages 项目**
   - 在左侧菜单中点击 **Workers & Pages**
   - 点击 **Create application**
   - 选择 **Pages** 标签
   - 点击 **Connect to Git**

3. **授权 GitHub**
   - 选择 **GitHub** 作为 Git 提供商
   - 授权 Cloudflare 访问你的 GitHub 账号
   - 选择要部署的仓库

### 第三步：配置构建设置

在构建配置页面填写以下信息：

```
项目名称：misaka-net-blog（或其他你喜欢的名称）
生产分支：main
```

**框架预设：** Astro（Cloudflare 会自动检测）

**构建配置：**
```
构建命令：npm run build
构建输出目录：dist
环境变量：
  - NODE_VERSION: 20（可选，默认会使用最新 LTS 版本）
```

### 第四步：部署

1. 点击 **Save and Deploy**
2. 等待构建完成（通常需要 1-3 分钟）
3. 部署成功后，你会得到一个 `*.pages.dev` 域名

### 第五步：访问你的博客

部署完成后，你可以通过以下方式访问：

- **临时域名**：`你的项目名.pages.dev`
- **自定义域名**：在下一节配置

---

## 方式二：使用 Wrangler CLI 部署

### 安装 Wrangler

```bash
# 全局安装 Wrangler
npm install -g wrangler

# 或者使用 npx（无需全局安装）
npx wrangler --version
```

### 登录 Cloudflare

```bash
wrangler login
```

这会打开浏览器让你授权 Wrangler 访问你的 Cloudflare 账号。

### 构建项目

```bash
npm run build
```

### 部署到 Cloudflare Pages

```bash
# 首次部署
wrangler pages deploy dist --project-name=misaka-net-blog

# 后续部署
wrangler pages deploy dist
```

---

## 配置自定义域名

### 在 Cloudflare Pages 中添加域名

1. 进入你的 Pages 项目
2. 点击 **Custom domains** 标签
3. 点击 **Set up a custom domain**
4. 输入你的域名（例如：blog.example.com）
5. 按照提示配置 DNS 记录

### DNS 配置

如果你的域名也托管在 Cloudflare：

- Cloudflare 会自动为你配置 CNAME 记录
- 无需手动操作

如果域名在其他服务商：

1. 在域名服务商的 DNS 设置中添加 CNAME 记录：
   ```
   类型：CNAME
   名称：blog（或 @，如果使用顶级域名）
   值：你的项目名.pages.dev
   ```
2. 等待 DNS 生效（可能需要几分钟到几小时）

### SSL/TLS 配置

Cloudflare Pages 自动提供免费 SSL 证书：

- 证书会在域名添��后自动签发
- 支持自动续期
- 强制 HTTPS 重定向

---

## 环境变量配置

如果你的项目需要环境变量：

1. 进入 Pages 项目设置
2. 点击 **Environment variables**
3. 分别为 **Production** 和 **Preview** 添加变量
4. 点击 **Save**
5. 重新部署项目

示例环境变量：

```
SITE_URL=https://blog.example.com
ANALYTICS_ID=your-analytics-id
```

---

## 自动部署配置

Cloudflare Pages 支持自动部署：

### 生产部署
- 每次推送到 `main` 分支时自动部署
- 部署到生产环境

### 预览部署
- 每次推送到其他分支时自动创建预览
- 每个 PR 都会有独立的预览链接
- 便于团队协作和代码审查

### 取消自动部署

如果需要手动控制部署：

1. 进入项目设置
2. 找到 **Build settings**
3. 可以暂停自动部署

---

## 常见问题

### 1. 构建失败

**错误：** `Module not found`

**解决：** 确保 `package.json` 中的依赖完整

```bash
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### 2. 页面 404

**原因：** 输出目录配置错误

**解决：** 确认构建输出目录为 `dist`

### 3. 样式或资源加载失败

**原因：** 资源路径问题

**解决：** 在 `astro.config.mjs` 中设置正确的 `site`：

```javascript
export default defineConfig({
  site: 'https://你的域名.com',
  // ...
});
```

### 4. 构建时间过长

**优化建议：**

- 使用 Node.js 缓存
- 优化图片资源
- 减少不必要的依赖

---

## 性能优化建议

### 1. 启用 CDN 缓存

Cloudflare Pages 默认启用全球 CDN，无需额外配置。

### 2. 配置缓存规则

在 Cloudflare Dashboard 中：

1. 进入 **Caching** > **Configuration**
2. 设置浏览器缓存 TTL
3. 启用 Always Online

### 3. 启用 Brotli 压缩

Cloudflare 自动启用 Brotli 和 Gzip 压缩，无需配置。

### 4. 使用 Cloudflare Analytics

1. 在 Pages 项目中启用 **Web Analytics**
2. 无需添加任何代码
3. 查看实时访问数据

---

## 持续维护

### 更新博客内容

```bash
# 1. 在 src/content/blog/ 中添加或修改文章
# 2. 提交更改
git add .
git commit -m "Add new blog post"
git push

# Cloudflare Pages 会自动检测并部署
```

### 查看部署历史

1. 进入 Pages 项目
2. 查看 **Deployments** 标签
3. 可以回滚到任何历史版本

### 回滚部署

1. 在部署历史中找到目标版本
2. 点击 **Rollback to this deployment**
3. 确认回滚

---

## 高级功能

### 1. 添加 Cloudflare Workers

在 Cloudflare Pages 中可以添加 Workers 函数：

```javascript
// functions/api/hello.js
export async function onRequest(context) {
  return new Response('Hello from Cloudflare Workers!');
}
```

### 2. 使用 Cloudflare KV

存储数据到 Cloudflare KV：

```javascript
// 在 Workers 函数中使用
export async function onRequest({ env }) {
  const value = await env.MY_KV.get('key');
  return new Response(value);
}
```

### 3. 配置重定向

创建 `public/_redirects` 文件：

```
/old-url  /new-url  301
/blog/*   /posts/:splat  302
```

---

## 监控和分析

### 1. Cloudflare Web Analytics

免费的隐私优先分析工具：

- 不使用 Cookie
- 不追踪用户
- 符合 GDPR

### 2. Real User Monitoring (RUM)

监控真实用户体验：

- 页面加载时间
- 核心 Web 指标
- 错误追踪

---

## 下一步

现在你的博客已经成功部署！接下来可以：

- ✅ 配置自定义域名
- ✅ 添加更多博客文章
- ✅ 自定义主题样式
- ✅ 添加评论系统
- ✅ 集成搜索功能
- ✅ 添加深色模式

祝你写作愉快！ 🎉
