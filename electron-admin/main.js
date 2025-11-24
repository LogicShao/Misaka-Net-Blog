import { app, BrowserWindow, ipcMain, Menu, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { loadConfig, saveConfig, validateBlogDirectory, getBlogPaths } from './config.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 博客根目录（从配置加载）
let BLOG_ROOT = null;
let BLOG_DIR = null;

let mainWindow = null;
let appConfig = null;

/**
 * 选择博客目录
 */
async function selectBlogDirectory() {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择 Misaka Blog 项目目录',
    message: '请选择包含 Astro 博客项目的根目录',
    properties: ['openDirectory'],
    buttonLabel: '选择此目录',
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const selectedPath = result.filePaths[0];
  console.log('[SelectDir] User selected:', selectedPath);

  // 验证目录
  const validation = await validateBlogDirectory(selectedPath);

  if (!validation.valid) {
    dialog.showErrorBox('目录无效', validation.error);
    return null;
  }

  return selectedPath;
}

/**
 * 初始化博客目录配置
 */
async function initializeBlogDirectory() {
  // 加载配置
  appConfig = await loadConfig();

  // 如果配置中有目录，验证是否有效
  if (appConfig.blogRoot) {
    const validation = await validateBlogDirectory(appConfig.blogRoot);

    if (validation.valid) {
      BLOG_ROOT = appConfig.blogRoot;
      const paths = getBlogPaths(BLOG_ROOT);
      BLOG_DIR = paths.blogDir;
      console.log('[Init] Using configured blog directory:', BLOG_ROOT);
      return true;
    } else {
      console.log('[Init] Configured directory is invalid:', validation.error);
    }
  }

  // 尝试使用默认目录（开发模式）
  const defaultBlogRoot = path.resolve(__dirname, '..');
  const defaultValidation = await validateBlogDirectory(defaultBlogRoot);

  if (defaultValidation.valid) {
    BLOG_ROOT = defaultBlogRoot;
    const paths = getBlogPaths(BLOG_ROOT);
    BLOG_DIR = paths.blogDir;
    console.log('[Init] Using default blog directory (dev mode):', BLOG_ROOT);

    // 保存配置
    appConfig.blogRoot = BLOG_ROOT;
    await saveConfig(appConfig);
    return true;
  }

  // 需要用户选择目录
  console.log('[Init] No valid directory found, prompting user to select');
  return false;
}

/**
 * 提示用户选择博客目录
 */
async function promptForBlogDirectory() {
  const selectedPath = await selectBlogDirectory();

  if (!selectedPath) {
    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'warning',
      title: '未选择目录',
      message: '必须选择博客项目目录才能继续使用应用',
      buttons: ['重新选择', '退出应用'],
      defaultId: 0,
    });

    if (choice === 0) {
      // 重新选择
      return promptForBlogDirectory();
    } else {
      // 退出应用
      app.quit();
      return false;
    }
  }

  // 保存选择的目录
  BLOG_ROOT = selectedPath;
  const paths = getBlogPaths(BLOG_ROOT);
  BLOG_DIR = paths.blogDir;

  appConfig.blogRoot = BLOG_ROOT;
  appConfig.lastOpenTime = new Date().toISOString();
  await saveConfig(appConfig);

  console.log('[Init] Blog directory set to:', BLOG_ROOT);
  return true;
}

/**
 * 更改博客目录
 */
async function changeBlogDirectory() {
  const selectedPath = await selectBlogDirectory();

  if (!selectedPath) {
    return;
  }

  // 更新配置
  BLOG_ROOT = selectedPath;
  const paths = getBlogPaths(BLOG_ROOT);
  BLOG_DIR = paths.blogDir;

  appConfig.blogRoot = BLOG_ROOT;
  appConfig.lastOpenTime = new Date().toISOString();
  await saveConfig(appConfig);

  console.log('[ChangeBlogDir] Blog directory changed to:', BLOG_ROOT);

  // 提示用户重新加载
  const choice = dialog.showMessageBoxSync(mainWindow, {
    type: 'info',
    title: '目录已更改',
    message: '博客目录已更改为：\n' + BLOG_ROOT + '\n\n是否立即重新加载应用？',
    buttons: ['立即重新加载', '稍后手动重新加载'],
    defaultId: 0,
  });

  if (choice === 0) {
    // 重新加载窗口
    mainWindow.reload();
  }
}

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: '#667eea',
    show: false, // 等待加载完成再显示
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // 需要访问文件系统
    },
    title: 'Misaka Blog Admin',
  });

  // 打印路径信息
  console.log('Blog Root:', BLOG_ROOT);
  console.log('Blog Dir:', BLOG_DIR);
  console.log('Preload script:', path.join(__dirname, 'preload.cjs'));
  console.log('HTML file:', path.join(__dirname, 'renderer', 'index.html'));

  // 加载应用
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'))
    .then(() => {
      console.log('[Main] HTML file loaded successfully');
    })
    .catch(err => {
      console.error('[Main] Failed to load HTML file:', err);
    });

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    console.log('[Main] Window ready to show');
    mainWindow.show();
    // 默认打开开发者工具（方便调试）
    // mainWindow.webContents.openDevTools();
  });

  // 监听加载完成事件
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Main] Page did finish load');
  });

  // 监听加载失败事件
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[Main] Page failed to load:', errorCode, errorDescription);
  });

  // 监听渲染进程崩溃
  mainWindow.webContents.on('crashed', () => {
    console.error('[Main] Renderer process crashed!');
  });

  // 监听窗口关闭
  mainWindow.on('closed', () => {
    console.log('[Main] Window closed');
    mainWindow = null;
  });

  // 创建菜单
  createMenu();
}

// 创建应用菜单
function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建文章',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-post');
          },
        },
        {
          label: '刷新列表',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.webContents.send('menu-refresh');
          },
        },
        { type: 'separator' },
        {
          label: '打开博客目录',
          click: async () => {
            if (BLOG_DIR) {
              await shell.openPath(BLOG_DIR);
            }
          },
        },
        {
          label: '更改博客目录...',
          click: async () => {
            await changeBlogDirectory();
          },
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
      ],
    },
    {
      label: '构建',
      submenu: [
        {
          label: '构建博客',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            mainWindow.webContents.send('menu-build');
          },
        },
        {
          label: '查看构建输出目录',
          click: async () => {
            const distDir = path.join(BLOG_ROOT, 'dist');
            await shell.openPath(distDir);
          },
        },
      ],
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', accelerator: 'CmdOrCtrl+Shift+R', role: 'reload' },
        { label: '强制重新加载', accelerator: 'CmdOrCtrl+Shift+F5', role: 'forceReload' },
        { label: '切换开发者工具', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '重置缩放', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于 Misaka Blog Admin',
              message: 'Misaka Blog Admin v1.0.0',
              detail: 'Astro 博客桌面管理工具\n\n© 2025 Misaka Network',
              buttons: ['确定'],
            });
          },
        },
        {
          label: '查看文档',
          click: async () => {
            await shell.openExternal('https://blog.misaka-net.top');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ==================== IPC 处理程序 ====================

// 获取博客目录信息
ipcMain.handle('get-blog-info', async () => {
  return {
    success: true,
    data: {
      blogRoot: BLOG_ROOT,
      blogDir: BLOG_DIR,
    },
  };
});

// 解析 Markdown frontmatter
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, content: content };
  }

  const frontmatterStr = match[1];
  const bodyContent = match[2];
  const frontmatter = {};

  const lines = frontmatterStr.split('\n');
  let currentKey = null;
  let currentValue = '';

  for (const line of lines) {
    const keyMatch = line.match(/^(\w+):\s*(.*)$/);
    if (keyMatch) {
      if (currentKey) {
        frontmatter[currentKey] = parseValue(currentValue.trim());
      }
      currentKey = keyMatch[1];
      currentValue = keyMatch[2];
    } else if (currentKey) {
      currentValue += '\n' + line;
    }
  }

  if (currentKey) {
    frontmatter[currentKey] = parseValue(currentValue.trim());
  }

  return { frontmatter, content: bodyContent };
}

function parseValue(value) {
  value = value.trim();

  if (value === 'true') return true;
  if (value === 'false') return false;

  if ((value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))) {
    return value.slice(1, -1);
  }

  if (value.startsWith('[') && value.endsWith(']')) {
    const arrayContent = value.slice(1, -1);
    return arrayContent.split(',').map(item => {
      item = item.trim();
      if ((item.startsWith("'") && item.endsWith("'")) ||
          (item.startsWith('"') && item.endsWith('"'))) {
        return item.slice(1, -1);
      }
      return item;
    }).filter(item => item);
  }

  return value;
}

function buildFrontmatter(frontmatter) {
  let result = '---\n';

  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      result += `${key}: [${value.map(v => `'${v}'`).join(', ')}]\n`;
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      result += `${key}: ${value}\n`;
    } else {
      result += `${key}: '${value}'\n`;
    }
  }

  result += '---\n';
  return result;
}

// 获取文章列表
ipcMain.handle('get-posts', async () => {
  try {
    console.log('[IPC:get-posts] Reading blog directory:', BLOG_DIR);

    const files = await fs.readdir(BLOG_DIR);
    console.log('[IPC:get-posts] Total files found:', files.length);

    const mdFiles = files.filter(file => file.endsWith('.md') || file.endsWith('.mdx'));
    console.log('[IPC:get-posts] Markdown files:', mdFiles.length);

    const posts = await Promise.all(
      mdFiles.map(async (file) => {
        const filePath = path.join(BLOG_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const { frontmatter } = parseFrontmatter(content);
        const stats = await fs.stat(filePath);

        return {
          id: file,
          filename: file,
          title: frontmatter.title || '无标题',
          description: frontmatter.description || '',
          pubDate: frontmatter.pubDate || '',
          tags: frontmatter.tags || [],
          draft: frontmatter.draft || false,
          updatedAt: stats.mtime,
        };
      })
    );

    // 按发布日期降序排序
    posts.sort((a, b) => {
      const dateA = new Date(a.pubDate || 0);
      const dateB = new Date(b.pubDate || 0);
      return dateB - dateA;
    });

    console.log('[IPC:get-posts] Successfully returning posts count:', posts.length);
    return { success: true, data: posts };
  } catch (error) {
    console.error('[IPC:get-posts] Error:', error);
    return { success: false, error: error.message };
  }
});

// 获取单篇文章
ipcMain.handle('get-post', async (event, postId) => {
  try {
    const filePath = path.join(BLOG_DIR, postId);
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontmatter, content: bodyContent } = parseFrontmatter(content);

    return {
      success: true,
      data: {
        id: postId,
        frontmatter,
        content: bodyContent,
        raw: content,
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 创建文章
ipcMain.handle('create-post', async (event, { filename, frontmatter, content }) => {
  try {
    const finalFilename = filename.endsWith('.md') ? filename : `${filename}.md`;
    const filePath = path.join(BLOG_DIR, finalFilename);

    // 检查文件是否存在
    try {
      await fs.access(filePath);
      return { success: false, error: '文件已存在' };
    } catch {
      // 文件不存在，可以创建
    }

    const fullContent = buildFrontmatter(frontmatter) + '\n' + (content || '');
    await fs.writeFile(filePath, fullContent, 'utf-8');

    return { success: true, data: { id: finalFilename } };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 更新文章
ipcMain.handle('update-post', async (event, { postId, frontmatter, content }) => {
  try {
    const filePath = path.join(BLOG_DIR, postId);
    const fullContent = buildFrontmatter(frontmatter) + '\n' + (content || '');
    await fs.writeFile(filePath, fullContent, 'utf-8');

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 删除文章
ipcMain.handle('delete-post', async (event, postId) => {
  try {
    const filePath = path.join(BLOG_DIR, postId);
    await fs.unlink(filePath);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 构建博客
ipcMain.handle('build-blog', async () => {
  try {
    const { stdout, stderr } = await execAsync('npm run build', {
      cwd: BLOG_ROOT,
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    });

    return {
      success: true,
      output: stdout,
      errors: stderr,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout || '',
      errors: error.stderr || '',
    };
  }
});

// 获取构建状态
ipcMain.handle('get-build-status', async () => {
  try {
    const distDir = path.join(BLOG_ROOT, 'dist');
    const stats = await fs.stat(distDir);

    return {
      success: true,
      data: {
        built: true,
        lastBuildTime: stats.mtime,
      },
    };
  } catch {
    return {
      success: true,
      data: {
        built: false,
      },
    };
  }
});

// ==================== 应用生命周期 ====================

app.whenReady().then(async () => {
  // 初始化博客目录配置
  const hasValidDirectory = await initializeBlogDirectory();

  // 创建主窗口
  createWindow();

  // 如果没有有效目录，提示用户选择
  if (!hasValidDirectory) {
    await promptForBlogDirectory();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  dialog.showErrorBox('应用错误', error.message);
});
