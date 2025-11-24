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
const CONSTS_FILE = path.join(__dirname, 'src', 'consts.ts');

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

// ==================== 友链管理函数 ====================

/**
 * 读取并解析 consts.ts 文件中的友链数据
 */
function readFriendLinks() {
  try {
    const content = fs.readFileSync(CONSTS_FILE, 'utf8');

    // 提取 FRIEND_LINKS 数组
    const match = content.match(/export const FRIEND_LINKS: FriendLink\[\] = \[([\s\S]*?)\];/);

    if (!match) {
      throw new Error('无法找到 FRIEND_LINKS 数组');
    }

    // 解析友链对象（支持可选的 note 字段）
    const arrayContent = match[1];
    const objectRegex = /\{[\s\S]*?name:\s*'([^']+)'[\s\S]*?url:\s*'([^']+)'[\s\S]*?avatar:\s*'([^']+)'[\s\S]*?description:\s*'([^']+)'(?:[\s\S]*?note:\s*'([^']*)')?[\s\S]*?\}/g;

    const friendLinks = [];
    let objectMatch;
    while ((objectMatch = objectRegex.exec(arrayContent)) !== null) {
      const friendLink = {
        name: objectMatch[1],
        url: objectMatch[2],
        avatar: objectMatch[3],
        description: objectMatch[4]
      };

      // 添加 note 如果存在
      if (objectMatch[5]) {
        friendLink.note = objectMatch[5];
      }

      friendLinks.push(friendLink);
    }

    return { content, friendLinks };
  } catch (error) {
    throw new Error(`读取友链数据失败: ${error.message}`);
  }
}

/**
 * 生成友链数组的 TypeScript 代码
 */
function generateFriendLinksCode(friendLinks) {
  const items = friendLinks.map(link => {
    let code = `\t{
        name: '${link.name}',
        url: '${link.url}',
        avatar: '${link.avatar}',
        description: '${link.description}'`;

    // 添加 note 如果存在
    if (link.note) {
      code += `,\n        note: '${link.note}'`;
    }

    code += '\n    }';
    return code;
  }).join(',\n');

  return `export const FRIEND_LINKS: FriendLink[] = [
${items}
];`;
}

/**
 * 写入更新后的友链数据到 consts.ts
 */
function writeFriendLinks(friendLinks) {
  try {
    const { content } = readFriendLinks();
    const newFriendLinksCode = generateFriendLinksCode(friendLinks);

    // 替换原有的 FRIEND_LINKS 数组
    const newContent = content.replace(
      /export const FRIEND_LINKS: FriendLink\[\] = \[[\s\S]*?\];/,
      newFriendLinksCode
    );

    fs.writeFileSync(CONSTS_FILE, newContent, 'utf8');
    return true;
  } catch (error) {
    throw new Error(`写入友链数据失败: ${error.message}`);
  }
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

// ==================== 友链管理 API ====================

// API: 获取所有友链
app.get('/api/friends', (req, res) => {
  try {
    const { friendLinks } = readFriendLinks();
    res.json({
      success: true,
      data: friendLinks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API: 添加友链
app.post('/api/friends', (req, res) => {
  try {
    const { name, url, avatar, description, note } = req.body;

    // 验证必填字段
    if (!name || !url || !avatar || !description) {
      return res.status(400).json({
        success: false,
        error: '所有字段都是必填的'
      });
    }

    // URL 验证
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({
        success: false,
        error: 'URL 必须以 http:// 或 https:// 开头'
      });
    }

    // 读取现有友链并添加新友链
    const { friendLinks } = readFriendLinks();
    const newFriend = {
      name: name.trim(),
      url: url.trim(),
      avatar: avatar.trim(),
      description: description.trim()
    };

    // 添加 note 如果提供
    if (note && note.trim()) {
      newFriend.note = note.trim();
    }

    friendLinks.push(newFriend);

    // 写入文件
    writeFriendLinks(friendLinks);

    res.json({
      success: true,
      message: '友链添加成功',
      data: friendLinks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API: 更新友链
app.put('/api/friends/:index', (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const { name, url, avatar, description, note } = req.body;

    // 验证必填字段
    if (!name || !url || !avatar || !description) {
      return res.status(400).json({
        success: false,
        error: '所有字段都是必填的'
      });
    }

    // URL 验证
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({
        success: false,
        error: 'URL 必须以 http:// 或 https:// 开头'
      });
    }

    // 读取现有友链
    const { friendLinks } = readFriendLinks();

    // 验证索引
    if (isNaN(index) || index < 0 || index >= friendLinks.length) {
      return res.status(400).json({
        success: false,
        error: '无效的友链索引'
      });
    }

    // 更新友链
    const updatedFriend = {
      name: name.trim(),
      url: url.trim(),
      avatar: avatar.trim(),
      description: description.trim()
    };

    // 添加 note 如果提供，或者保留原有的 note
    if (note && note.trim()) {
      updatedFriend.note = note.trim();
    } else if (friendLinks[index].note) {
      updatedFriend.note = friendLinks[index].note;
    }

    friendLinks[index] = updatedFriend;

    // 写入文件
    writeFriendLinks(friendLinks);

    res.json({
      success: true,
      message: '友链更新成功',
      data: friendLinks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API: 删除友链
app.delete('/api/friends/:index', (req, res) => {
  try {
    const index = parseInt(req.params.index);

    // 读取现有友链
    const { friendLinks } = readFriendLinks();

    // 验证索引
    if (isNaN(index) || index < 0 || index >= friendLinks.length) {
      return res.status(400).json({
        success: false,
        error: '无效的友链索引'
      });
    }

    // 删除友链
    const deletedLink = friendLinks.splice(index, 1)[0];

    // 写入文件
    writeFriendLinks(friendLinks);

    res.json({
      success: true,
      message: '友链删除成功',
      deletedLink,
      data: friendLinks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🎉 博客管理后台已启动！`);
  console.log(`📝 管理界面: http://localhost:${PORT}`);
  console.log(`🔧 API 地址: http://localhost:${PORT}/api`);
  console.log(`\n按 Ctrl+C 停止服务器\n`);
});
