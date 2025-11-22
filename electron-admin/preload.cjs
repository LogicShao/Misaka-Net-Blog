const { contextBridge, ipcRenderer } = require('electron');

// 向渲染进程暴露安全的 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 文章管理
  getPosts: () => ipcRenderer.invoke('get-posts'),
  getPost: (postId) => ipcRenderer.invoke('get-post', postId),
  createPost: (data) => ipcRenderer.invoke('create-post', data),
  updatePost: (data) => ipcRenderer.invoke('update-post', data),
  deletePost: (postId) => ipcRenderer.invoke('delete-post', postId),

  // 构建管理
  buildBlog: () => ipcRenderer.invoke('build-blog'),
  getBuildStatus: () => ipcRenderer.invoke('get-build-status'),

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
