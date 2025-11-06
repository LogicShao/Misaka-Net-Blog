// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'Misaka Network';
export const SITE_DESCRIPTION = '御坂网络 - 科学实验日志与技术观测站 | A Certain Scientific Blog';

// 友链数据
export interface FriendLink {
	name: string;
	url: string;
	avatar: string;
	description: string;
}

export const FRIEND_LINKS: FriendLink[] = [
	{
        name: 'Astro 官方文档',
        url: 'https://astro.build',
        avatar: 'https://astro.build/assets/press/astro-icon-light-gradient.svg',
        description: '现代化的静态站点生成框架，性能卓越'
    },
    {
        name: 'Tailwind CSS',
        url: 'https://tailwindcss.com',
        avatar: 'https://avatars.githubusercontent.com/u/67109815?s=200&v=4',
        description: '实用优先的 CSS 框架，快速构建现代界面'
    },
    {
        name: 'MDN Web Docs',
        url: 'https://developer.mozilla.org',
        avatar: 'https://avatars.githubusercontent.com/u/7565578?s=200&v=4',
        description: 'Web 技术权威文档，前端开发者必备资源'
	},
	{
        name: 'GitHub',
        url: 'https://github.com',
        avatar: 'https://avatars.githubusercontent.com/u/9919?s=200&v=4',
        description: '全球最大的代码托管平台和开发者社区'
	},
	// 在这里添加更多友链
];
