// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'Misaka Network';
export const SITE_DESCRIPTION = '御坂网络 - 科学实验日志与技术观测站 | A Certain Scientific Blog';

// 个人信息
export interface ProfileInfo {
  name: string;
  avatar: string;
  bio: string;
  location?: string;
  email?: string;
  github?: string;
  bilibili?: string;
  website?: string;
}

export const PROFILE: ProfileInfo = {
  name: '御坂#10032',
  avatar: 'https://blog.misaka-net.top/favicon.svg',
  bio: '缺陷电气 | Level 2',
  location: '学园都市',
  email: 'wyyxshao@163.com',
  github: 'https://github.com/LogicShao/Misaka-Net-Blog',
  bilibili: 'https://space.bilibili.com/432256076',
  website: 'https://blog.misaka-net.top'
};

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
  },
  {
    name: 'johntime',
    url: 'https://blog.johntime.top/',
    avatar: 'https://blog.johntime.top/assets/images/avatar.webp',
    description: '热爱技术，喜欢折腾，记录生活。'
  }
];
