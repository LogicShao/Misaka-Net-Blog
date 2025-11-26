/**
 * 友链管理模块
 * Misaka Blog Admin - 友链 CRUD 操作
 */

// 全局状态
let currentFriends = [];
let currentEditingFriendIndex = null;
let isNewFriend = false;

// 初始化友链管理器
export function initFriendsManager() {
  console.log('[Friends] Initializing friends manager...');

  // 绑定事件
  bindFriendEvents();

  // 加载友链列表
  loadFriends();
}

// 绑定事件监听器
function bindFriendEvents() {
  // 添加友链按钮
  document.getElementById('btnNewFriend').addEventListener('click', () => {
    showNewFriendForm();
  });

  // 保存按钮
  document.getElementById('btnSaveFriend').addEventListener('click', () => {
    saveFriend();
  });

  // 删除按钮
  document.getElementById('btnDeleteFriend').addEventListener('click', () => {
    deleteFriend();
  });

  // 取消按钮
  document.getElementById('btnCancelFriend').addEventListener('click', () => {
    cancelFriendEdit();
  });
}

// 加载友链列表
export async function loadFriends() {
  console.log('[Friends] Loading friends list...');

  const friendList = document.getElementById('friendList');
  friendList.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>加载中...</p></div>';

  try {
    const response = await window.electronAPI.getFriends();

    if (response.success) {
      currentFriends = response.data;
      console.log(`[Friends] Loaded ${currentFriends.length} friends`);

      // 更新统计
      document.getElementById('friendTotalCount').textContent = currentFriends.length;

      // 渲染列表
      renderFriendsList(currentFriends);
    } else {
      showError(`加载友链失败: ${response.error}`);
      friendList.innerHTML = '<div class="error-state"><p>加载失败</p></div>';
    }
  } catch (error) {
    console.error('[Friends] Error loading friends:', error);
    showError(`加载友链失败: ${error.message}`);
    friendList.innerHTML = '<div class="error-state"><p>加载失败</p></div>';
  }
}

// 渲染友链列表
function renderFriendsList(friends) {
  const friendList = document.getElementById('friendList');

  if (friends.length === 0) {
    friendList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔗</div>
        <p>暂无友链</p>
        <p class="hint">点击上方"添加友链"按钮创建</p>
      </div>
    `;
    return;
  }

  friendList.innerHTML = '';

  friends.forEach((friend, index) => {
    const friendItem = document.createElement('div');
    friendItem.className = 'friend-item';
    friendItem.dataset.index = index;

    friendItem.innerHTML = `
      <div class="friend-avatar">
        <img src="${escapeHtml(friend.avatar)}" alt="${escapeHtml(friend.name)}"
             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Crect width=%2240%22 height=%2240%22 fill=%22%23667eea%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2216%22%3E${escapeHtml(friend.name.charAt(0))}%3C/text%3E%3C/svg%3E'">
      </div>
      <div class="friend-info">
        <h3 class="friend-name">${escapeHtml(friend.name)}</h3>
        <div class="friend-url">${escapeHtml(friend.url)}</div>
        <div class="friend-description">${escapeHtml(friend.description)}</div>
        ${friend.note ? `<div class="friend-note">📌 ${escapeHtml(friend.note)}</div>` : ''}
      </div>
    `;

    // 点击编辑
    friendItem.addEventListener('click', () => {
      selectFriend(index);
    });

    friendList.appendChild(friendItem);
  });
}

// 选择友链进行编辑
function selectFriend(index) {
  currentEditingFriendIndex = index;
  isNewFriend = false;

  const friend = currentFriends[index];

  // 高亮选中项
  document.querySelectorAll('.friend-item').forEach((item, i) => {
    item.classList.toggle('active', i === index);
  });

  // 显示编辑表单
  showFriendEditForm(friend);
}

// 显示新建友链表单
function showNewFriendForm() {
  currentEditingFriendIndex = null;
  isNewFriend = true;

  // 取消选中
  document.querySelectorAll('.friend-item').forEach(item => {
    item.classList.remove('active');
  });

  // 显示空表单
  showFriendEditForm({
    name: '',
    url: '',
    avatar: '',
    description: ''
  });
}

// 显示友链编辑表单
function showFriendEditForm(friend) {
  const editorContent = document.getElementById('friendEditorContent');

  editorContent.innerHTML = `
    <div class="friend-form">
      <div class="form-group">
        <label for="friendName">友链名称 <span class="required">*</span></label>
        <input type="text" id="friendName" class="form-control" placeholder="请输入友链名称" value="${escapeHtml(friend.name)}" required>
      </div>

      <div class="form-group">
        <label for="friendUrl">友链地址 <span class="required">*</span></label>
        <input type="url" id="friendUrl" class="form-control" placeholder="https://example.com" value="${escapeHtml(friend.url)}" required>
        <small class="form-text">必须以 http:// 或 https:// 开头</small>
      </div>

      <div class="form-group">
        <label for="friendAvatar">头像链接 <span class="required">*</span></label>
        <input type="url" id="friendAvatar" class="form-control" placeholder="https://example.com/avatar.jpg" value="${escapeHtml(friend.avatar)}" required>
        <div class="avatar-preview">
          <img id="avatarPreview" src="${escapeHtml(friend.avatar)}" alt="头像预览"
               onerror="this.style.display='none'"
               onload="this.style.display='block'">
        </div>
      </div>

      <div class="form-group">
        <label for="friendDescription">友链描述 <span class="required">*</span></label>
        <textarea id="friendDescription" class="form-control" rows="3" placeholder="请输入友链描述" required>${escapeHtml(friend.description)}</textarea>
      </div>

      <div class="form-group">
        <label for="friendNote">备注 <small>(可选，仅用于本地管理)</small></label>
        <textarea id="friendNote" class="form-control" rows="2" placeholder="友链备注信息，不会在前端显示">${escapeHtml(friend.note || '')}</textarea>
        <small class="form-text">备注信息仅用于本地管理，不会在博客前端展示</small>
      </div>
    </div>
  `;

  // 显示保存和取消按钮
  document.getElementById('btnSaveFriend').style.display = 'inline-block';
  document.getElementById('btnCancelFriend').style.display = 'inline-block';

  // 如果是编辑模式，显示删除按钮
  if (!isNewFriend) {
    document.getElementById('btnDeleteFriend').style.display = 'inline-block';
  } else {
    document.getElementById('btnDeleteFriend').style.display = 'none';
  }

  // 头像预览实时更新
  document.getElementById('friendAvatar').addEventListener('input', (e) => {
    const preview = document.getElementById('avatarPreview');
    preview.src = e.target.value;
  });
}

// 保存友链
async function saveFriend() {
  // 收集表单数据
  const name = document.getElementById('friendName').value.trim();
  const url = document.getElementById('friendUrl').value.trim();
  const avatar = document.getElementById('friendAvatar').value.trim();
  const description = document.getElementById('friendDescription').value.trim();
  const note = document.getElementById('friendNote').value.trim();

  // 验证
  if (!name || !url || !avatar || !description) {
    showError('请填写所有必填字段');
    return;
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    showError('URL 必须以 http:// 或 https:// 开头');
    return;
  }

  const friendData = {name, url, avatar, description};

  // 添加 note 如果提供
  if (note) {
    friendData.note = note;
  }

  try {
    let response;

    if (isNewFriend) {
      // 添加新友链
      response = await window.electronAPI.addFriend(friendData);
    } else {
      // 更新友链
      response = await window.electronAPI.updateFriend(currentEditingFriendIndex, friendData);
    }

    if (response.success) {
      showSuccess(isNewFriend ? '友链添加成功' : '友链更新成功');

      // 重新加载列表
      await loadFriends();

      // 清空编辑器
      cancelFriendEdit();
    } else {
      showError(`保存失败: ${response.error}`);
    }
  } catch (error) {
    console.error('[Friends] Error saving friend:', error);
    showError(`保存失败: ${error.message}`);
  }
}

// 删除友链
async function deleteFriend() {
  if (isNewFriend || currentEditingFriendIndex === null) {
    return;
  }

  const friend = currentFriends[currentEditingFriendIndex];

  // 确认删除
  const confirmed = confirm(`确定要删除友链"${friend.name}"吗？\n\n此操作不可撤销。`);

  if (!confirmed) {
    return;
  }

  try {
    const response = await window.electronAPI.deleteFriend(currentEditingFriendIndex);

    if (response.success) {
      showSuccess('友链删除成功');

      // 重新加载列表
      await loadFriends();

      // 清空编辑器
      cancelFriendEdit();
    } else {
      showError(`删除失败: ${response.error}`);
    }
  } catch (error) {
    console.error('[Friends] Error deleting friend:', error);
    showError(`删除失败: ${error.message}`);
  }
}

// 取消编辑
function cancelFriendEdit() {
  currentEditingFriendIndex = null;
  isNewFriend = false;

  // 取消选中
  document.querySelectorAll('.friend-item').forEach(item => {
    item.classList.remove('active');
  });

  // 隐藏按钮
  document.getElementById('btnSaveFriend').style.display = 'none';
  document.getElementById('btnDeleteFriend').style.display = 'none';
  document.getElementById('btnCancelFriend').style.display = 'none';

  // 显示空状态
  const editorContent = document.getElementById('friendEditorContent');
  editorContent.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">🔗</div>
      <p>选择一个友链开始编辑</p>
      <p class="hint">或点击"添加友链"创建新友链</p>
    </div>
  `;

  clearFriendMessage();
}

// 显示成功消息
function showSuccess(message) {
  const statusEl = document.getElementById('friendStatusMessage');
  statusEl.textContent = message;
  statusEl.className = 'status-message success show';

  setTimeout(() => {
    statusEl.classList.remove('show');
  }, 3000);
}

// 显示错误消息
function showError(message) {
  const statusEl = document.getElementById('friendStatusMessage');
  statusEl.textContent = message;
  statusEl.className = 'status-message error show';

  setTimeout(() => {
    statusEl.classList.remove('show');
  }, 5000);
}

// 清除消息
function clearFriendMessage() {
  const statusEl = document.getElementById('friendStatusMessage');
  statusEl.classList.remove('show');
}

// HTML 转义
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
