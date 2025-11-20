/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Misaka Network 主题色
                'misaka-dark': '#1e293b',      // 深蓝灰
                'misaka-circuit': '#4ade80',   // 电路板绿
                'misaka-light': '#f0f8ff',     // 淡蓝白
                'misaka-blue': '#00bfff',      // 电磁炮蓝
                'misaka-accent': '#38bdf8',    // 辅助蓝
                'misaka-bg': '#0f172a',        // 深色背景
                'misaka-gray': '#64748b',      // 中灰
            },
            fontFamily: {
                sans: [
                    'Inter',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'system-ui',
                    'PingFang SC',
                    'Microsoft YaHei',
                    'Segoe UI',
                    'Roboto',
                    'Helvetica Neue',
                    'Arial',
                    'Noto Sans',
                    'sans-serif',
                    'Apple Color Emoji',
                    'Segoe UI Emoji',
                    'Segoe UI Symbol',
                    'Noto Color Emoji'
                ],
                mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
            },
            backgroundImage: {
                'circuit-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234ade80' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                'gradient-misaka': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                glow: {
                    '0%': {boxShadow: '0 0 5px #00bfff, 0 0 10px #00bfff'},
                    '100%': {boxShadow: '0 0 10px #00bfff, 0 0 20px #00bfff, 0 0 30px #00bfff'},
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
};
