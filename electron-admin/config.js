// config.js - 配置文件管理模块
import fs from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'url';
import {app} from 'electron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置文件路径（保存在用户数据目录）
const CONFIG_FILE = path.join(app.getPath('userData'), 'config.json');

// 默认配置
const DEFAULT_CONFIG = {
  blogRoot: null, // 博客根目录路径
  lastOpenTime: null,
};

/**
 * 读取配置文件
 */
export async function loadConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(data);
    console.log('[Config] Loaded config:', config);
    return {...DEFAULT_CONFIG, ...config};
  } catch (error) {
    console.log('[Config] No config file found, using defaults');
    return {...DEFAULT_CONFIG};
  }
}

/**
 * 保存配置文件
 */
export async function saveConfig(config) {
  try {
    // 确保用户数据目录存在
    const userDataDir = app.getPath('userData');
    await fs.mkdir(userDataDir, {recursive: true});

    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    console.log('[Config] Saved config:', config);
    return true;
  } catch (error) {
    console.error('[Config] Failed to save config:', error);
    return false;
  }
}

/**
 * 验证博客目录是否有效
 */
export async function validateBlogDirectory(dirPath) {
  try {
    // 检查目录是否存在
    const stat = await fs.stat(dirPath);
    if (!stat.isDirectory()) {
      return {valid: false, error: '选择的路径不是目录'};
    }

    // 检查是否包含关键文件/目录
    const requiredPaths = [
      path.join(dirPath, 'src', 'content', 'blog'),
      path.join(dirPath, 'package.json'),
    ];

    for (const requiredPath of requiredPaths) {
      try {
        await fs.access(requiredPath);
      } catch {
        return {
          valid: false,
          error: `缺少必要的文件或目录：${path.basename(requiredPath)}`,
        };
      }
    }

    // 验证 package.json 是否包含 Astro 相关内容
    try {
      const packageJson = JSON.parse(
        await fs.readFile(path.join(dirPath, 'package.json'), 'utf-8')
      );

      const hasAstro = packageJson.dependencies?.astro ||
        packageJson.devDependencies?.astro;

      if (!hasAstro) {
        return {
          valid: false,
          error: '该目录不是有效的 Astro 博客项目（未找到 Astro 依赖）',
        };
      }
    } catch (error) {
      return {valid: false, error: '无法读取 package.json'};
    }

    return {valid: true};
  } catch (error) {
    return {valid: false, error: `目录访问失败：${error.message}`};
  }
}

/**
 * 获取博客目录路径
 */
export function getBlogPaths(blogRoot) {
  return {
    blogRoot,
    blogDir: path.join(blogRoot, 'src', 'content', 'blog'),
    distDir: path.join(blogRoot, 'dist'),
    packageJson: path.join(blogRoot, 'package.json'),
  };
}
