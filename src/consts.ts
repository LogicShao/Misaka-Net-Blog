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
	note?: string; // 备注（仅用于本地管理，不在前端显示）
}

export const FRIEND_LINKS: FriendLink[] = [
	{
        name: '夏夜流萤',
        url: 'https://blog.cuteleaf.cn',
        avatar: 'https://q1.qlogo.cn/g?b=qq&nk=7618557&s=640',
        description: '飞萤之火自无梦的长夜亮起，绽放在终竟的明天。'
    }
];
