const { contextBridge, ipcRenderer } = require('electron');

// 向渲染进程暴露安全的 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 博客信息
  getBlogInfo: () => ipcRenderer.invoke('get-blog-info'),

  // 文章管理
  getPosts: () => ipcRenderer.invoke('get-posts'),
  getPost: (postId) => ipcRenderer.invoke('get-post', postId),
  createPost: (data) => ipcRenderer.invoke('create-post', data),
  updatePost: (data) => ipcRenderer.invoke('update-post', data),
  deletePost: (postId) => ipcRenderer.invoke('delete-post', postId),

  // 构建管理
  buildBlog: () => ipcRenderer.invoke('build-blog'),
  getBuildStatus: () => ipcRenderer.invoke('get-build-status'),

  // 友链管理
  getFriends: () => ipcRenderer.invoke('get-friends'),
  addFriend: (data) => ipcRenderer.invoke('add-friend', data),
  updateFriend: (index, data) => ipcRenderer.invoke('update-friend', { index, friendData: data }),
  deleteFriend: (index) => ipcRenderer.invoke('delete-friend', index),

  // 个人名片管理
  getProfile: () => ipcRenderer.invoke('get-profile'),
  updateProfile: (data) => ipcRenderer.invoke('update-profile', data),

  // 菜单事件监听
  onMenuNewPost: (callback) => {
    ipcRenderer.on('menu-new-post', callback);
  },
  onMenuRefresh: (callback) => {
    ipcRenderer.on('menu-refresh', callback);
  },
  onMenuBuild: (callback) => {
    ipcRenderer.on('menu-build', callback);
  },

  // 移除监听器
  removeListener: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  },
});
