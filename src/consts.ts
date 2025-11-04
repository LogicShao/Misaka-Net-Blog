// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'Misaka-Net Blog';
export const SITE_DESCRIPTION = '一个基于 Astro + Cloudflare Pages 搭建的现代化个人博客';

// 友链数据
export interface FriendLink {
	name: string;
	url: string;
	avatar: string;
	description: string;
}

export const FRIEND_LINKS: FriendLink[] = [
	{
		name: '示例友链1',
		url: 'https://example.com',
		avatar: 'https://via.placeholder.com/100',
		description: '这是一个示例友链描述'
	},
	{
		name: '示例友链2',
		url: 'https://example.org',
		avatar: 'https://via.placeholder.com/100',
		description: '另一个友链示例'
	},
	// 在这里添加更多友链
];
