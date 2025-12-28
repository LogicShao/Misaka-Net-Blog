const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

async function requestJson(path, options = {}) {
  const headers = {...(options.headers || {})};
  const requestOptions = {...options};

  if (requestOptions.body && !headers['Content-Type']) {
    headers['Content-Type'] = JSON_HEADERS['Content-Type'];
  }

  if (Object.keys(headers).length > 0) {
    requestOptions.headers = headers;
  }

  const response = await fetch(path, requestOptions);
  const contentType = response.headers.get('content-type') || '';
  let data = null;

  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text ? {message: text} : null;
  }

  if (!response.ok) {
    const errorMessage = (data && (data.error || data.message)) || `Request failed (${response.status})`;
    return {success: false, error: errorMessage};
  }

  if (data && typeof data === 'object' && 'success' in data) {
    return data;
  }

  return {success: true, data};
}

export const adminAPI = {
  getBlogInfo() {
    return requestJson('/api/info');
  },
  getPosts() {
    return requestJson('/api/posts');
  },
  getPost(postId) {
    return requestJson(`/api/posts/${encodeURIComponent(postId)}`);
  },
  createPost(payload) {
    return requestJson('/api/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updatePost(payload) {
    return requestJson(`/api/posts/${encodeURIComponent(payload.postId)}`, {
      method: 'PUT',
      body: JSON.stringify({
        frontmatter: payload.frontmatter,
        content: payload.content,
      }),
    });
  },
  deletePost(postId) {
    return requestJson(`/api/posts/${encodeURIComponent(postId)}`, {
      method: 'DELETE',
    });
  },
  fixChineseBold(postId) {
    return requestJson(`/api/posts/${encodeURIComponent(postId)}/fix-bold`, {
      method: 'POST',
    });
  },
  buildBlog() {
    return requestJson('/api/build', {
      method: 'POST',
    });
  },
  getFriends() {
    return requestJson('/api/friends');
  },
  addFriend(friendData) {
    return requestJson('/api/friends', {
      method: 'POST',
      body: JSON.stringify(friendData),
    });
  },
  updateFriend(index, friendData) {
    return requestJson(`/api/friends/${index}`, {
      method: 'PUT',
      body: JSON.stringify(friendData),
    });
  },
  deleteFriend(index) {
    return requestJson(`/api/friends/${index}`, {
      method: 'DELETE',
    });
  },
  getProfile() {
    return requestJson('/api/profile');
  },
  updateProfile(profileData) {
    return requestJson('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
};
