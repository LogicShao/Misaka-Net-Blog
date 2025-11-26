# 友链管理工具使用指南

## 概述

`manage-friends.js` 是一个交互式 CLI 工具，用于管理 Misaka Network Blog 的友链数据。

## 快速开始

```bash
npm run friends
```

## 功能说明

### 1. 📋 查看所有友链

列出所有友链的详细信息，包括：

- 友链名称
- 链接地址
- 头像 URL
- 描述信息

每个友链都有一个编号，便于后续的编辑和删除操作。

### 2. ➕ 添加新友链

交互式添加新友链，需要填写以下信息：

- **友链名称**（必填）：友站的名称
- **友链地址**（必填）：友站的 URL，必须以 `http://` 或 `https://` 开头
- **头像链接**（必填）：友站的头像或 Logo 图片链接
- **友链描述**（必填）：对友站的简短描述

添加前会显示预览信息，确认后才会写入文件。

### 3. ✏️ 编辑友链

选择要编辑的友链编号，然后可以修改其任何字段。

**技巧**：如果某个字段不想修改，直接按回车键即可保持原值不变。

### 4. 🗑️ 删除友链

选择要删除的友链编号，系统会显示即将删除的友链详情并要求二次确认，防止误删。

## 数据结构

友链数据存储在 `src/consts.ts` 文件中，结构如下：

```typescript
interface FriendLink {
  name: string;        // 友链名称
  url: string;         // 友链地址
  avatar: string;      // 头像链接
  description: string; // 友链描述
}

export const FRIEND_LINKS: FriendLink[] = [
  {
    name: 'Astro 官方文档',
    url: 'https://astro.build',
    avatar: 'https://astro.build/assets/press/astro-icon-light-gradient.svg',
    description: '现代化的静态站点生成框架，性能卓越'
  },
  // 更多友链...
];
```

## 使用示例

### 添加友链示例

```
$ npm run friends

╔══════════════════════════════════════════╗
║  🔗 Misaka Network - 友链管理工具      ║
╚══════════════════════════════════════════╝

请选择操作：
  1. 📋 查看所有友链
  2. ➕ 添加新友链
  3. ✏️  编辑友链
  4. 🗑️  删除友链
  0. 🚪 退出

请输入选项 (0-4): 2

➕ 添加新友链
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏷️  友链名称 (必填): My Friend's Blog
🔗 友链地址 (必填，如 https://example.com): https://friend.com
🖼️  头像链接 (必填): https://friend.com/avatar.png
📝 友链描述 (必填): 我的好朋友的技术博客

📊 友链信息预览：
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
名称:     My Friend's Blog
地址:     https://friend.com
头像:     https://friend.com/avatar.png
描述:     我的好朋友的技术博客
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 确认添加? (Y/n): y
✅ 友链数据已更新！

✨ 成功添加友链: My Friend's Blog
```

## 注意事项

1. **直接修改文件**：所有操作会直接修改 `src/consts.ts` 文件
2. **二次确认**：删除操作需要二次确认以防误删
3. **URL 验证**：友链地址必须以 `http://` 或 `https://` 开头
4. **部分更新**：编辑时直接按回车保持原值不变
5. **原子性操作**：每次操作都会完整重写文件，确保数据一致性

## 技术实现

- **语言**：Node.js + ES Modules
- **交互**：原生 `readline` 模块
- **解析**：正则表达式解析 TypeScript 代码
- **格式化**：自动保持代码风格一致

## 相关文件

- `scripts/manage-friends.js` - 友链管理脚本
- `src/consts.ts` - 友链数据存储文件
- `package.json` - 包含 `friends` 命令定义

## 故障排查

### 问题：无法启动工具

```bash
# 检查 Node.js 版本（需要 18+）
node --version

# 重新安装依赖
npm install
```

### 问题：无法读取友链数据

确保 `src/consts.ts` 文件存在且格式正确：

```typescript
export const FRIEND_LINKS: FriendLink[] = [
  // 友链数据...
];
```

### 问题：保存后友链未显示

1. 检查 `src/consts.ts` 文件是否正确更新
2. 重新构建项目：`npm run build`
3. 清除缓存：`rm -rf node_modules/.astro dist`

## 更多帮助

查看完整项目文档：`CLAUDE.md`（第 10 节：友链管理工具）
