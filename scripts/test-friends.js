#!/usr/bin/env node

/**
 * 友链管理工具测试脚本
 * 测试是否能正确读取和解析友链数据
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONSTS_PATH = join(__dirname, '..', 'src', 'consts.ts');

function testReadFriendLinks() {
    console.log('🧪 测试友链数据读取...\n');

    try {
        const content = readFileSync(CONSTS_PATH, 'utf8');
        console.log('✅ 成功读取 consts.ts 文件');

        // 提取 FRIEND_LINKS 数组
        const match = content.match(/export const FRIEND_LINKS: FriendLink\[\] = \[([\s\S]*?)\];/);

        if (!match) {
            console.error('❌ 未找到 FRIEND_LINKS 数组');
            return false;
        }
        console.log('✅ 找到 FRIEND_LINKS 数组');

        // 解析友链对象（支持可选的 note 字段）
        const arrayContent = match[1];
        const objectRegex = /\{[\s\S]*?name:\s*'([^']+)'[\s\S]*?url:\s*'([^']+)'[\s\S]*?avatar:\s*'([^']+)'[\s\S]*?description:\s*'([^']+)'(?:[\s\S]*?note:\s*'([^']*)')?[\s\S]*?\}/g;

        const friendLinks = [];
        let objectMatch;
        while ((objectMatch = objectRegex.exec(arrayContent)) !== null) {
            const friendLink = {
                name: objectMatch[1],
                url: objectMatch[2],
                avatar: objectMatch[3],
                description: objectMatch[4]
            };

            // 添加 note 如果存在
            if (objectMatch[5]) {
                friendLink.note = objectMatch[5];
            }

            friendLinks.push(friendLink);
        }

        console.log(`✅ 成功解析 ${friendLinks.length} 个友链\n`);

        console.log('📋 友链列表：');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        friendLinks.forEach((link, index) => {
            console.log(`\n${index + 1}. ${link.name}`);
            console.log(`   🔗 ${link.url}`);
            console.log(`   📝 ${link.description}`);
            if (link.note) {
                console.log(`   📌 备注: ${link.note}`);
            }
        });
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        console.log('\n✅ 测试通过！友链管理工具可以正常工作。');
        return true;

    } catch (error) {
        console.error('❌ 测试失败：', error.message);
        return false;
    }
}

// 运行测试
testReadFriendLinks();
