import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('admin-ui'));

const BLOG_DIR = path.join(__dirname, 'src', 'content', 'blog');

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

  // 解析 frontmatter 字段
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

// 解析值（处理字符串、数组、布尔值等）
function parseValue(value) {
  value = value.trim();

  // 解析布尔值
  if (value === 'true') return true;
  if (value === 'false') return false;

  // 去除引号
  if ((value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))) {
    return value.slice(1, -1);
  }

  // 解析数组
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

// 构建 frontmatter 字符串
function buildFrontmatter(frontmatter) {
  let result = '---\n';

  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      result += `${key}: [${value.map(v => `'${v}'`).join(', ')}]\n`;
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      // 布尔值和数字不加引号
      result += `${key}: ${value}\n`;
    } else {
      result += `${key}: '${value}'\n`;
    }
  }

  result += '---\n';
  return result;
}

// API: 获取所有文章列表
app.get('/api/posts', (req, res) => {
  try {
    const files = fs.readdirSync(BLOG_DIR)
      .filter(file => file.endsWith('.md') || file.endsWith('.mdx'));

    const posts = files.map(file => {
      const filePath = path.join(BLOG_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const { frontmatter } = parseFrontmatter(content);
      const stats = fs.statSync(filePath);

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
    });

    // 按发布日期降序排序
    posts.sort((a, b) => {
      const dateA = new Date(a.pubDate || 0);
      const dateB = new Date(b.pubDate || 0);
      return dateB - dateA;
    });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: 获取单篇文章内容
app.get('/api/posts/:id', (req, res) => {
  try {
    const filePath = path.join(BLOG_DIR, req.params.id);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文章不存在' });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const { frontmatter, content: bodyContent } = parseFrontmatter(content);

    res.json({
      id: req.params.id,
      frontmatter,
      content: bodyContent,
      raw: content,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: 创建新文章
app.post('/api/posts', (req, res) => {
  try {
    const { filename, frontmatter, content } = req.body;

    if (!filename) {
      return res.status(400).json({ error: '文件名不能为空' });
    }

    // 确保文件名以 .md 结尾
    const finalFilename = filename.endsWith('.md') ? filename : `${filename}.md`;
    const filePath = path.join(BLOG_DIR, finalFilename);

    if (fs.existsSync(filePath)) {
      return res.status(400).json({ error: '文件已存在' });
    }

    const fullContent = buildFrontmatter(frontmatter) + '\n' + (content || '');
    fs.writeFileSync(filePath, fullContent, 'utf-8');

    res.json({
      success: true,
      id: finalFilename,
      message: '文章创建成功'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: 更新文章
app.put('/api/posts/:id', (req, res) => {
  try {
    const filePath = path.join(BLOG_DIR, req.params.id);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文章不存在' });
    }

    const { frontmatter, content } = req.body;
    const fullContent = buildFrontmatter(frontmatter) + '\n' + (content || '');

    fs.writeFileSync(filePath, fullContent, 'utf-8');

    res.json({
      success: true,
      message: '文章更新成功'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: 删除文章
app.delete('/api/posts/:id', (req, res) => {
  try {
    const filePath = path.join(BLOG_DIR, req.params.id);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文章不存在' });
    }

    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: '文章删除成功'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: 构建博客
app.post('/api/build', async (req, res) => {
  try {
    const { stdout, stderr } = await execAsync('npm run build', {
      cwd: __dirname,
    });

    res.json({
      success: true,
      message: '构建成功',
      output: stdout,
      errors: stderr,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      output: error.stdout,
      errors: error.stderr,
    });
  }
});

// API: 获取构建状态
app.get('/api/build/status', (req, res) => {
  const distDir = path.join(__dirname, 'dist');
  const exists = fs.existsSync(distDir);

  if (exists) {
    const stats = fs.statSync(distDir);
    res.json({
      built: true,
      lastBuildTime: stats.mtime,
    });
  } else {
    res.json({
      built: false,
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🎉 博客管理后台已启动！`);
  console.log(`📝 管理界面: http://localhost:${PORT}`);
  console.log(`🔧 API 地址: http://localhost:${PORT}/api`);
  console.log(`\n按 Ctrl+C 停止服务器\n`);
});
