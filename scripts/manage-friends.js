#!/usr/bin/env node

/**
 * Misaka Network Blog - 友链管理脚本
 * 管理友链的增删改查操作
 */

import {createInterface} from 'readline';
import {readFileSync, writeFileSync} from 'fs';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 创建 readline 接口
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

// 封装 question 为 Promise
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// consts.ts 文件路径
const CONSTS_PATH = join(__dirname, '..', 'src', 'consts.ts');

/**
 * 读取并解析 consts.ts 文件
 * @returns {{ content: string, friendLinks: Array }}
 */
function readConstsFile() {
  try {
    const content = readFileSync(CONSTS_PATH, 'utf8');

    // 使用正则提取 FRIEND_LINKS 数组内容
    const match = content.match(/export const FRIEND_LINKS: FriendLink\[\] = \[([\s\S]*?)\];/);

    if (!match) {
      throw new Error('无法找到 FRIEND_LINKS 数组');
    }

    // 解析友链数据（简单的字符串解析）
    const arrayContent = match[1];
    const friendLinks = [];

    // 匹配每个友链对象（支持可选的 note 字段）
    const objectRegex = /\{[\s\S]*?name:\s*'([^']+)'[\s\S]*?url:\s*'([^']+)'[\s\S]*?avatar:\s*'([^']+)'[\s\S]*?description:\s*'([^']+)'(?:[\s\S]*?note:\s*'([^']*)')?[\s\S]*?\}/g;

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

    return {content, friendLinks};
  } catch (error) {
    console.error('❌ 读取 consts.ts 文件失败：', error.message);
    process.exit(1);
  }
}

/**
 * 生成友链数组的 TypeScript 代码
 * @param {Array} friendLinks
 * @returns {string}
 */
function generateFriendLinksCode(friendLinks) {
  const items = friendLinks.map(link => {
    let code = `\t{
        name: '${link.name}',
        url: '${link.url}',
        avatar: '${link.avatar}',
        description: '${link.description}'`;

    // 添加 note 如果存在
    if (link.note) {
      code += `,\n        note: '${link.note}'`;
    }

    code += '\n    }';
    return code;
  }).join(',\n');

  return `export const FRIEND_LINKS: FriendLink[] = [
${items}
];`;
}

/**
 * 写入更新后的友链数据到 consts.ts
 * @param {Array} friendLinks
 */
function writeFriendLinks(friendLinks) {
  try {
    const {content} = readConstsFile();

    // 生成新的友链数组代码
    const newFriendLinksCode = generateFriendLinksCode(friendLinks);

    // 替换原有的 FRIEND_LINKS 数组
    const newContent = content.replace(
      /export const FRIEND_LINKS: FriendLink\[\] = \[[\s\S]*?\];/,
      newFriendLinksCode
    );

    writeFileSync(CONSTS_PATH, newContent, 'utf8');
    console.log('✅ 友链数据已更新！');
  } catch (error) {
    console.error('❌ 写入文件失败：', error.message);
    process.exit(1);
  }
}

/**
 * 显示所有友链
 * @param {Array} friendLinks
 */
function displayFriendLinks(friendLinks) {
  if (friendLinks.length === 0) {
    console.log('\n📭 暂无友链数据\n');
    return;
  }

  console.log('\n📋 当前友链列表：');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  friendLinks.forEach((link, index) => {
    console.log(`\n${index + 1}. ${link.name}`);
    console.log(`   🔗 链接: ${link.url}`);
    console.log(`   🖼️  头像: ${link.avatar}`);
    console.log(`   📝 描述: ${link.description}`);
    if (link.note) {
      console.log(`   📌 备注: ${link.note}`);
    }
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * 添加新友链
 */
async function addFriendLink() {
  console.log('\n➕ 添加新友链');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const name = await question('🏷️  友链名称 (必填): ');
    if (!name || name.trim() === '') {
      console.error('❌ 错误：友链名称不能为空！');
      return;
    }

    const url = await question('🔗 友链地址 (必填，如 https://example.com): ');
    if (!url || url.trim() === '' || !url.startsWith('http')) {
      console.error('❌ 错误：请输入有效的 URL 地址！');
      return;
    }

    const avatar = await question('🖼️  头像链接 (必填): ');
    if (!avatar || avatar.trim() === '') {
      console.error('❌ 错误：头像链接不能为空！');
      return;
    }

    const description = await question('📝 友链描述 (必填): ');
    if (!description || description.trim() === '') {
      console.error('❌ 错误：友链描述不能为空！');
      return;
    }

    const note = await question('📌 备注 (可选，用于本地管理): ');

    // 确认信息
    console.log('\n📊 友链信息预览：');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`名称:     ${name}`);
    console.log(`地址:     ${url}`);
    console.log(`头像:     ${avatar}`);
    console.log(`描述:     ${description}`);
    if (note && note.trim()) {
      console.log(`备注:     ${note}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const confirm = await question('✅ 确认添加? (Y/n): ');
    if (confirm.toLowerCase() === 'n' || confirm.toLowerCase() === 'no') {
      console.log('❌ 已取消添加。');
      return;
    }

    // 读取现有友链并添加新友链
    const {friendLinks} = readConstsFile();
    const newFriend = {
      name: name.trim(),
      url: url.trim(),
      avatar: avatar.trim(),
      description: description.trim()
    };

    // 添加 note 如果有输入
    if (note && note.trim()) {
      newFriend.note = note.trim();
    }

    friendLinks.push(newFriend);

    // 写入文件
    writeFriendLinks(friendLinks);
    console.log(`\n✨ 成功添加友链: ${name}\n`);

  } catch (error) {
    console.error('❌ 添加友链时出错：', error.message);
  }
}

/**
 * 编辑友链
 */
async function editFriendLink() {
  const {friendLinks} = readConstsFile();

  if (friendLinks.length === 0) {
    console.log('\n📭 暂无友链可编辑\n');
    return;
  }

  displayFriendLinks(friendLinks);

  try {
    const indexInput = await question('📝 请输入要编辑的友链编号 (输入 0 取消): ');
    const index = parseInt(indexInput) - 1;

    if (indexInput === '0') {
      console.log('❌ 已取消编辑。');
      return;
    }

    if (isNaN(index) || index < 0 || index >= friendLinks.length) {
      console.error('❌ 错误：无效的编号！');
      return;
    }

    const link = friendLinks[index];
    console.log(`\n✏️ 编辑友链: ${link.name}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 提示：直接按回车保持原值不变\n');

    const name = (await question(`🏷️  友链名称 [${link.name}]: `)).trim() || link.name;
    const url = (await question(`🔗 友链地址 [${link.url}]: `)).trim() || link.url;
    const avatar = (await question(`🖼️  头像链接 [${link.avatar}]: `)).trim() || link.avatar;
    const description = (await question(`📝 友链描述 [${link.description}]: `)).trim() || link.description;
    const note = (await question(`📌 备注 [${link.note || '无'}]: `)).trim();

    // 确认信息
    console.log('\n📊 更新后的友链信息：');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`名称:     ${name}`);
    console.log(`地址:     ${url}`);
    console.log(`头像:     ${avatar}`);
    console.log(`描述:     ${description}`);
    if (note) {
      console.log(`备注:     ${note}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const confirm = await question('✅ 确认更新? (Y/n): ');
    if (confirm.toLowerCase() === 'n' || confirm.toLowerCase() === 'no') {
      console.log('❌ 已取消编辑。');
      return;
    }

    // 更新友链
    const updatedFriend = {name, url, avatar, description};
    // 添加 note 如果有输入，或者保留原有的 note
    if (note) {
      updatedFriend.note = note;
    } else if (link.note) {
      updatedFriend.note = link.note;
    }

    friendLinks[index] = updatedFriend;
    writeFriendLinks(friendLinks);
    console.log(`\n✨ 成功更新友链: ${name}\n`);

  } catch (error) {
    console.error('❌ 编辑友链时出错：', error.message);
  }
}

/**
 * 删除友链
 */
async function deleteFriendLink() {
  const {friendLinks} = readConstsFile();

  if (friendLinks.length === 0) {
    console.log('\n📭 暂无友链可删除\n');
    return;
  }

  displayFriendLinks(friendLinks);

  try {
    const indexInput = await question('🗑️  请输入要删除的友链编号 (输入 0 取消): ');
    const index = parseInt(indexInput) - 1;

    if (indexInput === '0') {
      console.log('❌ 已取消删除。');
      return;
    }

    if (isNaN(index) || index < 0 || index >= friendLinks.length) {
      console.error('❌ 错误：无效的编号！');
      return;
    }

    const link = friendLinks[index];
    console.log(`\n⚠️  即将删除友链: ${link.name}`);
    console.log(`   🔗 链接: ${link.url}\n`);

    const confirm = await question('⚠️ 确认删除? (y/N): ');
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ 已取消删除。');
      return;
    }

    // 删除友链
    friendLinks.splice(index, 1);
    writeFriendLinks(friendLinks);
    console.log(`\n✨ 成功删除友链: ${link.name}\n`);

  } catch (error) {
    console.error('❌ 删除友链时出错：', error.message);
  }
}

/**
 * 显示主菜单
 */
async function showMenu() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  🔗 Misaka Network - 友链管理工具      ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('\n请选择操作：');
  console.log('  1. 📋 查看所有友链');
  console.log('  2. ➕ 添加新友链');
  console.log('  3. ✏️  编辑友链');
  console.log('  4. 🗑️  删除友链');
  console.log('  0. 🚪 退出\n');

  const choice = await question('请输入选项 (0-4): ');
  return choice.trim();
}

/**
 * 主函数
 */
async function main() {
  try {
    let running = true;

    while (running) {
      const choice = await showMenu();

      switch (choice) {
        case '1':
          const {friendLinks} = readConstsFile();
          displayFriendLinks(friendLinks);
          await question('\n按回车继续...');
          break;

        case '2':
          await addFriendLink();
          await question('\n按回车继续...');
          break;

        case '3':
          await editFriendLink();
          await question('\n按回车继续...');
          break;

        case '4':
          await deleteFriendLink();
          await question('\n按回车继续...');
          break;

        case '0':
          console.log('\n👋 再见！感谢使用友链管理工具。\n');
          running = false;
          break;

        default:
          console.log('\n❌ 无效的选项，请重新选择。');
          await question('\n按回车继续...');
      }
    }

  } catch (error) {
    console.error('❌ 程序出错：', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// 运行主函数
main();
