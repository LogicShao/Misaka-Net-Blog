# 改进待办

## 结构与功能
- [x] 对齐管理端 UI：补齐 `admin-ui` 并更新 `ADMIN-README.md` 的说明。
- [ ] 管理端安全最小化：仅监听 `127.0.0.1`，加入简单认证/令牌、CORS 白名单与基础限流。
- [ ] Frontmatter 解析改用 `gray-matter`/YAML 解析器，避免多行与数组场景出错，写回格式保持稳定。
- [ ] 抽出文章 CRUD 与构建逻辑为共享模块，供 Web 管理端复用。

## 质量与运维
- [ ] 增加 CI：`astro build` + `astro check` + 基础 lint（如 ESLint）作为质量门禁。
- [ ] 明确 Node/npm 版本要求与统一脚本说明（`README.md` / `ADMIN-README.md`）。
- [ ] 站点/端口等配置迁移到 `.env`，提供 `.env.example`。

## 性能与体验
- [ ] 为 `src/pages/search.json.ts` 和 `src/pages/rss.xml.js` 增加合理的 `Cache-Control` 头。
- [ ] 统一封面图比例与压缩策略，确保列表与详情页一致性。

## 视觉与交互
- [x] 明确主色/强调色层级，减少全局发光的使用场景。
- [x] 背景叠加轻微噪点 + 网格/电路纹理，首屏增加低饱和光晕聚焦。
- [x] 标题与正文拉开字体现实差异（更科技感的标题字体 + 高可读正文）。
- [x] 卡片/标签统一圆角与描边，悬停仅保留轻微上浮与光晕。
- [x] 文章页加入阅读进度条、目录悬浮、代码块复制按钮等细节。
- [x] 动效支持 `prefers-reduced-motion`，首页列表使用错峰进入动画。
