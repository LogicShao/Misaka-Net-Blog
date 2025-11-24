// ==================== 全局状态 ====================
let allPosts = [];
let filteredPosts = [];
let currentPost = null;
let currentTab = 'frontmatter';

// ==================== DOM 元素 ====================
const elements = {
  postList: document.getElementById('postList'),
  editor: document.getElementById('editor'),
  statusMessage: document.getElementById('statusMessage'),
  searchInput: document.getElementById('searchInput'),
  btnNewPost: document.getElementById('btnNewPost'),
  btnBuild: document.getElementById('btnBuild'),
  btnRefresh: document.getElementById('btnRefresh'),
  totalCount: document.getElementById('totalCount'),
  publishedCount: document.getElementById('publishedCount'),
  draftCount: document.getElementById('draftCount'),
  buildModal: document.getElementById('buildModal'),
  buildLog: document.getElementById('buildLog'),
  buildStatusText: document.getElementById('buildStatusText'),
  blogPath: document.getElementById('blogPath'),
};

// ==================== 初始化 ====================
async function init() {
  console.log('[Renderer] App init started');
  console.log('[Renderer] window.electronAPI type:', typeof window.electronAPI);
  console.log('[Renderer] window.electronAPI value:', window.electronAPI);

  if (!window.electronAPI) {
    console.error('[Renderer] ERROR: electronAPI not found! Preload script may not have loaded correctly.');
    elements.postList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">❌</div>
        <p>Error: Cannot load Electron API</p>
        <p class="hint">Check Developer Console for details</p>
      </div>
    `;
    return;
  }

  try {
    console.log('[Renderer] Loading blog info...');
    await loadBlogInfo();
    console.log('[Renderer] Calling loadPosts()...');
    await loadPosts();
    console.log('[Renderer] Setting up event listeners...');
    setupEventListeners();
    setupMenuListeners();
    console.log('[Renderer] App init completed successfully');
  } catch (error) {
    console.error('[Renderer] Init error:', error);
  }
}

// ==================== 事件监听器 ====================
function setupEventListeners() {
  // 按钮事件
  elements.btnNewPost.addEventListener('click', showNewPostForm);
  elements.btnBuild.addEventListener('click', buildBlog);
  elements.btnRefresh.addEventListener('click', loadPosts);

  // 搜索框
  elements.searchInput.addEventListener('input', handleSearch);

  // 标签切换
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.target.dataset.tab;
      switchTab(tab);
    });
  });

  // 构建模态框
  document.getElementById('closeBuildModal').addEventListener('click', closeBuildModal);
  document.getElementById('closeBuildBtn').addEventListener('click', closeBuildModal);
}

// 菜单快捷键监听
function setupMenuListeners() {
  window.electronAPI.onMenuNewPost(showNewPostForm);
  window.electronAPI.onMenuRefresh(loadPosts);
  window.electronAPI.onMenuBuild(buildBlog);
}

// ==================== 文章管理 ====================
// 加载博客目录信息
async function loadBlogInfo() {
  try {
    const result = await window.electronAPI.getBlogInfo();
    if (result.success && result.data.blogRoot) {
      // 显示博客根目录路径
      elements.blogPath.textContent = result.data.blogRoot;
      elements.blogPath.title = result.data.blogRoot;
    } else {
      elements.blogPath.textContent = '未设置';
    }
  } catch (error) {
    console.error('[Renderer] loadBlogInfo error:', error);
    elements.blogPath.textContent = '加载失败';
  }
}

// 加载文章列表
async function loadPosts() {
  console.log('[Renderer] loadPosts() started');
  showLoading(elements.postList);

  console.log('[Renderer] Calling electronAPI.getPosts()...');
  const result = await window.electronAPI.getPosts();
  console.log('[Renderer] getPosts() result:', result);

  if (result.success) {
    allPosts = result.data;
    filteredPosts = allPosts;
    console.log('[Renderer] Posts loaded, count:', allPosts.length);
    renderPostList(filteredPosts);
    updateStats();
  } else {
    console.error('[Renderer] loadPosts failed:', result.error);
    showError('Failed to load posts: ' + result.error);
    elements.postList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">❌</div>
        <p>Load failed</p>
        <p class="hint">${result.error}</p>
      </div>
    `;
  }
}

function renderPostList(posts) {
  if (posts.length === 0) {
    elements.postList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <p>暂无文章</p>
        <p class="hint">点击"新建文章"开始创作</p>
      </div>
    `;
    return;
  }

  elements.postList.innerHTML = posts.map(post => `
    <div class="post-item" data-id="${post.id}" onclick="loadPost('${post.id}')">
      <div class="post-title">${escapeHtml(post.title)}</div>
      <div class="post-meta">
        <span>📅 ${post.pubDate || '未设置日期'}</span>
        ${post.draft ? '<span class="draft-badge">草稿</span>' : ''}
      </div>
      ${post.tags && post.tags.length > 0 ? `
        <div class="post-tags">
          ${post.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
        </div>
      ` : ''}
    </div>
  `).join('');
}

async function loadPost(postId) {
  const result = await window.electronAPI.getPost(postId);

  if (result.success) {
    currentPost = result.data;
    highlightCurrentPost(postId);
    showEditForm(currentPost);
  } else {
    showError('加载文章失败: ' + result.error);
  }
}

function showEditForm(post) {
  currentTab = 'frontmatter';
  updateTabButtons();

  elements.editor.innerHTML = `
    <div class="form-grid">
      <div id="tabContent"></div>
      <div class="editor-actions">
        <button class="btn btn-success" onclick="savePost()">💾 保存更改</button>
        <button class="btn btn-danger" onclick="deletePost()">🗑️ 删除文章</button>
        <button class="btn btn-secondary" onclick="cancelEdit()">❌ 取消</button>
      </div>
    </div>
  `;

  renderTabContent(post);
}

function renderTabContent(post) {
  const tabContent = document.getElementById('tabContent');

  if (currentTab === 'frontmatter') {
    tabContent.innerHTML = `
      <div class="form-group">
        <label>📝 文章标题</label>
        <input type="text" id="editTitle" value="${escapeHtml(post.frontmatter.title || '')}" placeholder="请输入标题">
      </div>
      <div class="form-group">
        <label>📄 文章描述</label>
        <input type="text" id="editDescription" value="${escapeHtml(post.frontmatter.description || '')}" placeholder="请输入描述">
      </div>
      <div class="form-group">
        <label>📅 发布日期</label>
        <input type="date" id="editPubDate" value="${post.frontmatter.pubDate || ''}">
      </div>
      <div class="form-group">
        <label>🏷️ 标签（用逗号分隔）</label>
        <input type="text" id="editTags" value="${Array.isArray(post.frontmatter.tags) ? post.frontmatter.tags.join(', ') : ''}" placeholder="例如: 技术, 教程, JavaScript">
      </div>
      <div class="form-group">
        <div class="checkbox-group">
          <input type="checkbox" id="editDraft" ${post.frontmatter.draft ? 'checked' : ''}>
          <label for="editDraft">标记为草稿</label>
        </div>
      </div>
    `;
  } else if (currentTab === 'content') {
    tabContent.innerHTML = `
      <div class="form-group">
        <label>✍️ 文章内容（Markdown）</label>
        <textarea id="editContent" placeholder="在此输入 Markdown 格式的文章内容...">${escapeHtml(post.content)}</textarea>
      </div>
    `;
  } else if (currentTab === 'preview') {
    tabContent.innerHTML = `
      <div class="preview-container">
        <h3>元数据预览</h3>
        <pre>${JSON.stringify(post.frontmatter, null, 2)}</pre>
        <h3>内容预览</h3>
        <pre>${escapeHtml(post.content)}</pre>
      </div>
    `;
  }
}

function showNewPostForm() {
  currentPost = null;
  currentTab = 'frontmatter';
  updateTabButtons();
  clearActivePost();

  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const defaultFilename = `${year}-${month}-${day}-${hour}-${minute}.md`;
  const defaultDate = now.toISOString().split('T')[0];

  elements.editor.innerHTML = `
    <div class="form-grid">
      <div id="tabContent">
        <div class="form-group">
          <label>📁 文件名</label>
          <input type="text" id="newFilename" value="${defaultFilename}" placeholder="例如: my-post.md">
        </div>
        <div class="form-group">
          <label>📝 文章标题</label>
          <input type="text" id="editTitle" value="" placeholder="请输入标题">
        </div>
        <div class="form-group">
          <label>📄 文章描述</label>
          <input type="text" id="editDescription" value="" placeholder="请输入描述">
        </div>
        <div class="form-group">
          <label>📅 发布日期</label>
          <input type="date" id="editPubDate" value="${defaultDate}">
        </div>
        <div class="form-group">
          <label>🏷️ 标签（用逗号分隔）</label>
          <input type="text" id="editTags" value="" placeholder="例如: 技术, 教程, JavaScript">
        </div>
        <div class="form-group">
          <div class="checkbox-group">
            <input type="checkbox" id="editDraft">
            <label for="editDraft">标记为草稿</label>
          </div>
        </div>
        <div class="form-group">
          <label>✍️ 文章内容（Markdown）</label>
          <textarea id="editContent" placeholder="在此输入 Markdown 格式的文章内容..."></textarea>
        </div>
      </div>
      <div class="editor-actions">
        <button class="btn btn-success" onclick="createPost()">✨ 创建文章</button>
        <button class="btn btn-secondary" onclick="cancelEdit()">❌ 取消</button>
      </div>
    </div>
  `;
}

async function createPost() {
  const filename = document.getElementById('newFilename')?.value.trim();
  const frontmatter = collectFrontmatter();
  const content = document.getElementById('editContent')?.value || '';

  if (!filename) {
    showError('请输入文件名');
    return;
  }

  if (!frontmatter.title) {
    showError('请输入文章标题');
    return;
  }

  const result = await window.electronAPI.createPost({
    filename,
    frontmatter,
    content,
  });

  if (result.success) {
    showSuccess('文章创建成功！');
    await loadPosts();
    setTimeout(() => loadPost(result.data.id), 300);
  } else {
    showError('创建失败: ' + result.error);
  }
}

async function savePost() {
  if (!currentPost) return;

  // 先保存当前标签的数据到 currentPost
  if (currentTab === 'frontmatter') {
    currentPost.frontmatter = collectFrontmatter();
  } else if (currentTab === 'content') {
    currentPost.content = document.getElementById('editContent')?.value || '';
  }

  const result = await window.electronAPI.updatePost({
    postId: currentPost.id,
    frontmatter: currentPost.frontmatter,
    content: currentPost.content,
  });

  if (result.success) {
    showSuccess('保存成功！');
    await loadPosts();
  } else {
    showError('保存失败: ' + result.error);
  }
}

async function deletePost() {
  if (!currentPost) return;

  const confirmed = confirm(`确定要删除文章《${currentPost.frontmatter.title}》吗？\n此操作不可恢复！`);
  if (!confirmed) return;

  const result = await window.electronAPI.deletePost(currentPost.id);

  if (result.success) {
    showSuccess('文章已删除');
    await loadPosts();
    cancelEdit();
  } else {
    showError('删除失败: ' + result.error);
  }
}

function cancelEdit() {
  currentPost = null;
  clearActivePost();
  elements.editor.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">📝</div>
      <p>选择一篇文章开始编辑</p>
      <p class="hint">或点击"新建文章"创建新内容</p>
    </div>
  `;
}

// ==================== 构建博客 ====================
async function buildBlog() {
  const confirmed = confirm('确定要构建博客吗？这可能需要一些时间。');
  if (!confirmed) return;

  showBuildModal();

  const result = await window.electronAPI.buildBlog();

  if (result.success) {
    elements.buildStatusText.textContent = '✅ 构建成功！';
    elements.buildLog.textContent = result.output;
  } else {
    elements.buildStatusText.textContent = '❌ 构建失败';
    elements.buildLog.textContent = result.errors || result.error;
  }

  document.querySelector('.build-status .spinner').style.display = 'none';
}

function showBuildModal() {
  elements.buildModal.classList.add('show');
  elements.buildStatusText.textContent = '正在构建博客，请稍候...';
  elements.buildLog.textContent = '';
  document.querySelector('.build-status .spinner').style.display = 'block';
}

function closeBuildModal() {
  elements.buildModal.classList.remove('show');
}

// ==================== 搜索功能 ====================
function handleSearch(e) {
  const keyword = e.target.value.toLowerCase().trim();

  if (!keyword) {
    filteredPosts = allPosts;
  } else {
    filteredPosts = allPosts.filter(post => {
      const titleMatch = post.title.toLowerCase().includes(keyword);
      const tagsMatch = post.tags.some(tag => tag.toLowerCase().includes(keyword));
      return titleMatch || tagsMatch;
    });
  }

  renderPostList(filteredPosts);
  updateStats();
}

// ==================== 标签切换 ====================
function switchTab(tab) {
  if (!currentPost) return;

  // 保存当前标签的数据
  if (currentTab === 'frontmatter') {
    currentPost.frontmatter = collectFrontmatter();
  } else if (currentTab === 'content') {
    currentPost.content = document.getElementById('editContent')?.value || '';
  }

  currentTab = tab;
  updateTabButtons();
  renderTabContent(currentPost);
}

function updateTabButtons() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === currentTab);
  });
}

// ==================== 辅助函数 ====================
function collectFrontmatter() {
  const title = document.getElementById('editTitle')?.value.trim() || '';
  const description = document.getElementById('editDescription')?.value.trim() || '';
  const pubDate = document.getElementById('editPubDate')?.value || '';
  const tagsInput = document.getElementById('editTags')?.value || '';
  const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);
  const draft = document.getElementById('editDraft')?.checked || false;

  return { title, description, pubDate, tags, draft };
}

function updateStats() {
  const total = filteredPosts.length;
  const published = filteredPosts.filter(p => !p.draft).length;
  const draft = filteredPosts.filter(p => p.draft).length;

  elements.totalCount.textContent = total;
  elements.publishedCount.textContent = published;
  elements.draftCount.textContent = draft;
}

function highlightCurrentPost(postId) {
  document.querySelectorAll('.post-item').forEach(item => {
    item.classList.toggle('active', item.dataset.id === postId);
  });
}

function clearActivePost() {
  document.querySelectorAll('.post-item').forEach(item => {
    item.classList.remove('active');
  });
}

function showLoading(element) {
  element.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
  `;
}

function showStatus(message, type = 'info') {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `status-message ${type}`;
  elements.statusMessage.style.display = 'block';

  setTimeout(() => {
    elements.statusMessage.style.display = 'none';
  }, 5000);
}

function showSuccess(message) {
  showStatus(message, 'success');
}

function showError(message) {
  showStatus(message, 'error');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==================== 页面加载时初始化 ====================

// 全局错误处理
window.addEventListener('error', (event) => {
  console.error('[全局错误]', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[未处理的 Promise 错误]', event.reason);
});

// DOM 加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
  console.log('[DOMContentLoaded] DOM 已加载');
  init().catch(err => {
    console.error('[init 错误]', err);
    alert('初始化失败: ' + err.message);
  });
});

