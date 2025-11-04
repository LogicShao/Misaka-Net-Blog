# 主题切换功能说明

博客现在支持深色/浅色主题切换！

## ✨ 功能特性

### 1. 🎨 双主题支持
- **浅色模式**：清新明亮，适合白天阅读
- **深色模式**：护眼舒适，适合夜间浏览

### 2. 🤖 智能主题检测
- 首次访问时，自动检测系统主题偏好
- 如果系统设置为深色模式，博客也会使用深色主题
- 如果系统设置为浅色模式，博客使用浅色主题

### 3. 💾 记忆功能
- 用户手动切换的主题会被保存到浏览器
- 下次访问时自动应用上次选择的主题
- 使用 `localStorage` 存储，无需登录

### 4. ⚡ 无闪烁切换
- 主题在页面加载前就会被应用
- 不会出现"闪一下"的情况
- 平滑的过渡动画效果

### 5. 🔘 便捷切换按钮
- 位于页面右上角
- 浅色模式显示太阳图标 ☀️
- 深色模式显示月亮图标 🌙
- 点击即可切换主题

## 📁 实现文件

### 核心文件

1. **`src/scripts/theme.ts`**
   - 主题管理逻辑
   - 主题检测和切换函数
   - TypeScript 类型定义

2. **`src/components/ThemeToggle.astro`**
   - 主题切换按钮组件
   - 太阳/月亮图标
   - 点击切换逻辑

3. **`src/components/BaseHead.astro`**
   - 包含主题初始化脚本
   - 在页面渲染前应用主题
   - 防止主题闪烁

4. **`src/components/Header.astro`**
   - 集成主题切换按钮
   - 响应式布局适配

5. **`src/styles/global.css`**
   - 定义浅色和深色主题的 CSS 变量
   - 使用 `.dark` 类来应用深色主题
   - 平滑过渡动画

## 🎨 颜色方案

### 浅色模式
```css
--accent: #2337ff          /* 主色调 */
--bg-body: #ffffff         /* 背景色 */
--black: 15, 18, 25        /* 主文字颜色 */
--gray-dark: 34, 41, 57    /* 次要文字颜色 */
```

### 深色模式
```css
--accent: #5b8ff9          /* 主色调 */
--bg-body: #1a202c         /* 背景色 */
--black: 230, 237, 243     /* 主文字颜色 */
--gray-dark: 203, 213, 225 /* 次要文字颜色 */
```

## 🔧 工作原理

### 1. 初始化流程

```
页面加载 → 执行 BaseHead 中的脚本
         ↓
   检查 localStorage
         ↓
   有保存的主题？
   ├─ 是 → 应用保存的主题
   └─ 否 → 检查系统偏好
            ↓
      应用对应主题
```

### 2. 切换流程

```
用户点击按钮
    ↓
检查当前主题
    ↓
切换到相反主题
    ↓
保存到 localStorage
    ↓
应用新主题样式
```

### 3. 主题应用方式

主题通过给 `<html>` 元素添加/移除 `dark` 类来实现：

```html
<!-- 浅色模式 -->
<html class="">

<!-- 深色模式 -->
<html class="dark">
```

CSS 通过 `:root.dark` 选择器来定义深色主题样式：

```css
/* 浅色模式 */
:root {
  --bg-body: #ffffff;
}

/* 深色模式 */
:root.dark {
  --bg-body: #1a202c;
}
```

## 🎯 使用方法

### 对于用户

1. 访问博客
2. 查看右上角的主题切换按钮
3. 点击按钮即可切换主题
4. 主题选择会自动保存

### 对于开发者

#### 自定义主题颜色

编辑 `src/styles/global.css`：

```css
:root {
  /* 修改浅色模式颜色 */
  --accent: #your-color;
}

:root.dark {
  /* 修改深色模式颜色 */
  --accent: #your-dark-color;
}
```

#### 为新组件添加深色模式支持

```css
/* 在组件的 <style> 中 */
.my-component {
  background: white;
}

:global(.dark) .my-component {
  background: #2d3748;
}
```

#### 使用主题函数

```typescript
import { getTheme, applyTheme, toggleTheme } from '../scripts/theme';

// 获取当前主题
const current = getTheme(); // 'light' 或 'dark'

// 应用指定主题
applyTheme('dark');

// 切换主题
const newTheme = toggleTheme();
```

## 📱 响应式适配

- 桌面端：按钮显示在右上角社交图标旁边
- 移动端（< 720px）：按钮会自动隐藏（与社交图标一起）

如需在移动端显示主题切换按钮，修改 `Header.astro`：

```css
@media (max-width: 720px) {
  .social-links {
    /* 移除这行或改为其他样式 */
    /* display: none; */
  }
}
```

## 🔍 调试技巧

### 查看当前主题

在浏览器控制台运行：

```javascript
// 查看 HTML 类
document.documentElement.classList.contains('dark') ? 'dark' : 'light'

// 查看 localStorage
localStorage.getItem('theme')

// 查看系统偏好
window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
```

### 清除保存的主题

```javascript
// 在浏览器控制台运行
localStorage.removeItem('theme');
location.reload();
```

### 强制应用主题

```javascript
// 强制深色模式
document.documentElement.classList.add('dark');
localStorage.setItem('theme', 'dark');

// 强制浅色模式
document.documentElement.classList.remove('dark');
localStorage.setItem('theme', 'light');
```

## 🚀 未来改进

可以考虑添加的功能：

- [ ] 添加"跟随系统"选项（三态切换）
- [ ] 添加更多主题颜色方案
- [ ] 添加主题切换的自定义动画
- [ ] 添加键盘快捷键（如 Ctrl+Shift+D）
- [ ] 添加主题切换的音效
- [ ] 支持用户自定义主题颜色

## 📚 参考资料

- [CSS 变量文档](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Astro 客户端脚本](https://docs.astro.build/en/guides/client-side-scripts/)

## 🐛 常见问题

### Q: 刷新页面时会闪一下？
A: 确保 `BaseHead.astro` 中的脚本使用了 `is:inline` 属性，这样脚本会在页面渲染前执行。

### Q: 主题没有保存？
A: 检查浏览器是否启用了 localStorage，某些隐私模式可能会禁用它。

### Q: 移动端看不到按钮？
A: 默认情况下，小屏幕会隐藏社交链接栏（包括主题按钮）。可以修改 CSS 媒体查询来显示它。

### Q: 如何修改主题颜色？
A: 编辑 `src/styles/global.css` 中的 CSS 变量即可。

---

享受你的新主题功能！ 🎨✨
