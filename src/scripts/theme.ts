// 主题管理脚本
// 必须在页面加载前执行，避免主题闪烁

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

// 获取保存的主题或系统偏好
export function getTheme(): Theme {
  // 1. 优先使用用户保存的主题
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  }

  // 2. 使用系统偏好
  if (typeof window !== 'undefined' && window.matchMedia) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }

  // 3. 默认浅色模式
  return 'light';
}

// 应用主题到文档
export function applyTheme(theme: Theme) {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // 保存到 localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, theme);
    }
  }
}

// 切换主题
export function toggleTheme(): Theme {
  const current = getTheme();
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  return next;
}

// 初始化主题（在页面加载时调用）
export function initTheme() {
  const theme = getTheme();
  applyTheme(theme);
}
