# Admin 管理后台友链编辑功能使用指南

## 概述

Admin 管理后台现已支持友链编辑功能，提供完整的友链 CRUD 操作界面。

## 访问方式

### 方式一：Web 界面

```bash
npm run admin
# 访问 http://localhost:3001
```

### 方式二：Electron 桌面应用

```bash
launch-admin.bat          # Windows
./启动博客管理后台.bat      # Windows (中文)
```

## 功能说明

### 1. 视图切换

在顶部工具栏中，点击 **🔗 友链管理** 按钮即可切换到友链管理视图。

- **文章管理视图**：管理博客文章
- **友链管理视图**：管理友链数据

### 2. 友链列表

友链管理视图左侧显示所有友链：

- **头像预览**：显示友链站点的头像
- **友链名称**：站点名称
- **友链地址**：站点 URL
- **友链描述**：简短描述

### 3. 添加友链

点击左上角的 **➕ 添加友链** 按钮：

1. **友链名称**（必填）：输入友链站点名称
2. **友链地址**（必填）：输入完整 URL（必须以 http:// 或 https:// 开头）
3. **头像链接**（必填）：输入头像图片 URL
  - 支持实时预览
  - 预览图会显示在输入框下方
4. **友链描述**（必填）：输入友链描述（支持多行）

填写完成后点击 **💾 保存** 按钮。

### 4. 编辑友链

1. 在友链列表中点击要编辑的友链
2. 右侧编辑器会显示友链的详细信息
3. 修改任意字段
4. 点击 **💾 保存** 按钮保存更改

### 5. 删除友链

1. 选择要删除的友链
2. 点击 **🗑️ 删除** 按钮
3. 确认删除操作（不可撤销）

### 6. 取消编辑

点击 **✖️ 取消** 按钮放弃当前的编辑。

## 数据验证

友链管理器会自动验证以下内容：

- ✅ 所有字段必须填写（不能为空）
- ✅ URL 必须以 `http://` 或 `https://` 开头
- ✅ 头像链接格式必须正确

如果验证失败，会显示错误提示信息。

## API 端点

后端提供以下 RESTful API 端点：

### GET `/api/friends`

获取所有友链

**响应示例：**

```json
{
  "success": true,
  "data": [
    {
      "name": "友链名称",
      "url": "https://example.com",
      "avatar": "https://example.com/avatar.jpg",
      "description": "友链描述"
    }
  ]
}
```

### POST `/api/friends`

添加新友链

**请求体：**

```json
{
  "name": "友链名称",
  "url": "https://example.com",
  "avatar": "https://example.com/avatar.jpg",
  "description": "友链描述"
}
```

### PUT `/api/friends/:index`

更新友链（按索引）

**参数：**

- `index`: 友链在数组中的索引（从 0 开始）

**请求体：** 同添加友链

### DELETE `/api/friends/:index`

删除友链（按索引）

**参数：**

- `index`: 友链在数组中的索引（从 0 开始）

## 技术实现

### 后端（Express）

- **文件：** `admin-server.js`
- **功能：** 提供友链管理的 RESTful API
- **数据存储：** 直接修改 `src/consts.ts` 文件

### 前端（Electron）

- **主进程：** `electron-admin/main.js`
  - 提供 IPC 处理器
  - 文件读写操作

- **渲染进程：**
  - `electron-admin/renderer/index.html` - 界面结构
  - `electron-admin/renderer/renderer.js` - 主逻辑
  - `electron-admin/renderer/friends-manager.js` - 友链管理模块
  - `electron-admin/renderer/styles.css` - 样式定义

- **预加载脚本：** `electron-admin/preload.cjs`
  - 暴露友链管理 API 到渲染进程

## 注意事项

1. **数据持久化**：所有友链数据存储在 `src/consts.ts` 文件中
2. **原子性操作**：每次保存都会完整重写文件
3. **索引管理**：友链通过数组索引进行定位，删除或移动友链会改变索引
4. **并发问题**：同时在多个界面编辑可能导致数据冲突，请避免并发操作

## 快捷键

- **Ctrl/Cmd + R**：刷新列表（根据当前视图刷新文章或友链）
- **Ctrl/Cmd + B**：构建博客

## 故障排查

### 问题：无法加载友链列表

**解决方案：**

1. 检查 `src/consts.ts` 文件是否存在
2. 确认文件格式正确（包含 `export const FRIEND_LINKS: FriendLink[]`）
3. 查看开发者工具控制台错误信息（按 F12）

### 问题：保存后友链未更新

**解决方案：**

1. 点击刷新按钮重新加载
2. 检查文件写入权限
3. 查看控制台错误信息

### 问题：头像无法显示

**解决方案：**

1. 确认头像 URL 可访问
2. 检查 URL 格式是否正确
3. 尝试使用其他图片链接

## 更多帮助

- 查看完整项目文档：`CLAUDE.md`（第 9 节：Admin 管理后台）
- CLI 工具使用：`scripts/README-friends.md`
