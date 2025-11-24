// ==================== 个人名片管理器 ====================

/**
 * 加载并显示当前个人名片
 */
export async function loadProfile() {
  try {
    const result = await window.electronAPI.getProfile();

    if (!result.success) {
      throw new Error(result.error);
    }

    const profile = result.data;
    displayProfileForm(profile);
  } catch (error) {
    console.error('[ProfileManager] Failed to load profile:', error);
    alert('加载个人名片失败：' + error.message);
  }
}

/**
 * 显示个人名片编辑表单
 */
function displayProfileForm(profile = {}) {
  const container = document.getElementById('profile-container');
  if (!container) return;

  container.innerHTML = `
    <div class="profile-editor">
      <h2>个人名片设置</h2>

      <form id="profile-form" class="profile-form">
        <div class="form-section">
          <h3>基本信息 <span class="required-mark">*必填</span></h3>

          <div class="form-group">
            <label for="profile-name">姓名 *</label>
            <input
              type="text"
              id="profile-name"
              name="name"
              value="${escapeHtml(profile.name || '')}"
              required
              placeholder="请输入姓名"
            />
          </div>

          <div class="form-group">
            <label for="profile-avatar">头像链接 *</label>
            <input
              type="text"
              id="profile-avatar"
              name="avatar"
              value="${escapeHtml(profile.avatar || '')}"
              required
              placeholder="请输入头像图片链接（如：/favicon.svg）"
            />
            <div class="avatar-preview" id="avatar-preview">
              ${profile.avatar ? `<img src="${escapeHtml(profile.avatar)}" alt="头像预览" />` : '<div class="no-avatar">暂无头像</div>'}
            </div>
          </div>

          <div class="form-group">
            <label for="profile-bio">简介 *</label>
            <textarea
              id="profile-bio"
              name="bio"
              rows="3"
              required
              placeholder="请输入个人简介"
            >${escapeHtml(profile.bio || '')}</textarea>
          </div>
        </div>

        <div class="form-section">
          <h3>联系方式 <span class="optional-mark">选填</span></h3>

          <div class="form-group">
            <label for="profile-location">所在地</label>
            <input
              type="text"
              id="profile-location"
              name="location"
              value="${escapeHtml(profile.location || '')}"
              placeholder="请输入所在地（如：学园都市）"
            />
          </div>

          <div class="form-group">
            <label for="profile-email">邮箱</label>
            <input
              type="email"
              id="profile-email"
              name="email"
              value="${escapeHtml(profile.email || '')}"
              placeholder="请输入邮箱地址"
            />
          </div>
        </div>

        <div class="form-section">
          <h3>社交链接 <span class="optional-mark">选填</span></h3>

          <div class="form-group">
            <label for="profile-github">GitHub</label>
            <input
              type="url"
              id="profile-github"
              name="github"
              value="${escapeHtml(profile.github || '')}"
              placeholder="请输入 GitHub 主页链接"
            />
          </div>

          <div class="form-group">
            <label for="profile-bilibili">Bilibili</label>
            <input
              type="url"
              id="profile-bilibili"
              name="bilibili"
              value="${escapeHtml(profile.bilibili || '')}"
              placeholder="请输入 Bilibili 空间链接"
            />
          </div>

          <div class="form-group">
            <label for="profile-website">个人网站</label>
            <input
              type="url"
              id="profile-website"
              name="website"
              value="${escapeHtml(profile.website || '')}"
              placeholder="请输入个人网站链接"
            />
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary">💾 保存更改</button>
          <button type="button" class="btn btn-secondary" id="preview-profile-btn">👁️ 预览名片</button>
        </div>
      </form>
    </div>
  `;

  // 绑定事件
  setupProfileFormEvents();
}

/**
 * 设置表单事件
 */
function setupProfileFormEvents() {
  const form = document.getElementById('profile-form');
  const avatarInput = document.getElementById('profile-avatar');
  const previewBtn = document.getElementById('preview-profile-btn');

  // 表单提交
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveProfile();
    });
  }

  // 头像实时预览
  if (avatarInput) {
    avatarInput.addEventListener('input', (e) => {
      updateAvatarPreview(e.target.value);
    });
  }

  // 预览按钮
  if (previewBtn) {
    previewBtn.addEventListener('click', () => {
      previewProfile();
    });
  }
}

/**
 * 更新头像预览
 */
function updateAvatarPreview(avatarUrl) {
  const preview = document.getElementById('avatar-preview');
  if (!preview) return;

  if (avatarUrl.trim()) {
    preview.innerHTML = `<img src="${escapeHtml(avatarUrl)}" alt="头像预览" onerror="this.parentElement.innerHTML='<div class=\\'no-avatar\\'>图片加载失败</div>'" />`;
  } else {
    preview.innerHTML = '<div class="no-avatar">暂无头像</div>';
  }
}

/**
 * 保存个人名片
 */
async function saveProfile() {
  try {
    const form = document.getElementById('profile-form');
    const formData = new FormData(form);

    const profileData = {
      name: formData.get('name').trim(),
      avatar: formData.get('avatar').trim(),
      bio: formData.get('bio').trim(),
      location: formData.get('location').trim(),
      email: formData.get('email').trim(),
      github: formData.get('github').trim(),
      bilibili: formData.get('bilibili').trim(),
      website: formData.get('website').trim()
    };

    // 验证必填字段
    if (!profileData.name || !profileData.avatar || !profileData.bio) {
      alert('请填写所有必填字段！');
      return;
    }

    const result = await window.electronAPI.updateProfile(profileData);

    if (!result.success) {
      throw new Error(result.error);
    }

    alert('✅ 个人名片更新成功！');

    // 重新加载显示更新后的数据
    await loadProfile();
  } catch (error) {
    console.error('[ProfileManager] Failed to save profile:', error);
    alert('保存个人名片失败：' + error.message);
  }
}

/**
 * 预览个人名片（弹窗显示）
 */
function previewProfile() {
  const form = document.getElementById('profile-form');
  const formData = new FormData(form);

  const profile = {
    name: formData.get('name').trim(),
    avatar: formData.get('avatar').trim(),
    bio: formData.get('bio').trim(),
    location: formData.get('location').trim(),
    email: formData.get('email').trim(),
    github: formData.get('github').trim(),
    bilibili: formData.get('bilibili').trim(),
    website: formData.get('website').trim()
  };

  // 创建预览模态框
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content profile-preview-modal">
      <div class="modal-header">
        <h2>👁️ 名片预览</h2>
        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">✕</button>
      </div>
      <div class="modal-body">
        <div class="profile-preview-card">
          <div class="profile-header">
            <img src="${escapeHtml(profile.avatar || '/favicon1.svg')}"
                 alt="${escapeHtml(profile.name)}"
                 class="profile-avatar"
                 onerror="this.src='/favicon1.svg'" />
            <div class="profile-info">
              <h3>${escapeHtml(profile.name || '未设置姓名')}</h3>
              <p class="profile-bio">${escapeHtml(profile.bio || '未设置简介')}</p>
              ${profile.location ? `<p class="profile-location">📍 ${escapeHtml(profile.location)}</p>` : ''}
            </div>
          </div>
          <div class="profile-links">
            ${profile.email ? `<a href="mailto:${escapeHtml(profile.email)}" class="profile-link">📧 Email</a>` : ''}
            ${profile.github ? `<a href="${escapeHtml(profile.github)}" target="_blank" class="profile-link">🐙 GitHub</a>` : ''}
            ${profile.bilibili ? `<a href="${escapeHtml(profile.bilibili)}" target="_blank" class="profile-link">📺 Bilibili</a>` : ''}
            ${profile.website ? `<a href="${escapeHtml(profile.website)}" target="_blank" class="profile-link">🌐 Website</a>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // 点击背景关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

/**
 * 转义 HTML 特殊字符
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
