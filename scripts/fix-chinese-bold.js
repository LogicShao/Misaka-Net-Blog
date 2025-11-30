#!/usr/bin/env node

/**
 * 中文加粗修复脚本
 *
 * 功能：
 * 1. 修复 Markdown 中 **中文** 加粗格式在特定位置解析失败的问题
 * 2. 在 **中文** 前后自动添加空格（如果尚未存在）
 * 3. 支持单篇文章修复或批量修复所有文章
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blog');

/**
 * 修复中文加粗格式
 * @param {string} content - Markdown 文件内容
 * @returns {string} 修复后的内容
 */
function fixChineseBold(content) {
	// 匹配 **内容** 格式，其中内容包含至少一个中文字符
	// 使用负向后顾和正向预查来避免重复添加空格
	let fixed = content;

	// 第一步：在 ** 前面添加空格（如果前面是非空白字符）
	// 匹配：非空白字符 + ** + 包含中文的内容 + **
	fixed = fixed.replace(
		/([^\s\n])(\*\*[^*]*?[\u4e00-\u9fa5][^*]*?\*\*)/g,
		(match, before, bold) => {
			// 检查 before 后面是否已经有空格
			return before + ' ' + bold;
		}
	);

	// 第二步：在 ** 后面添加空格（如果后面是非空白字符）
	// 匹配：** + 包含中文的内容 + ** + 非空白字符
	fixed = fixed.replace(
		/(\*\*[^*]*?[\u4e00-\u9fa5][^*]*?\*\*)([^\s\n])/g,
		(match, bold, after) => {
			// 检查 after 前面是否已经有空格
			return bold + ' ' + after;
		}
	);

	return fixed;
}

/**
 * 从文件名提取时间戳（用于排序）
 * @param {string} filename - 文件名
 * @returns {number} 时间戳
 */
function getTimestampFromFilename(filename) {
	const id = filename.replace(/\.(md|mdx)$/, '');
	const match = id.match(/^(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})/);

	if (!match) return 0;

	const [, yy, month, day, hour, minute] = match;
	const year = 2000 + parseInt(yy, 10);

	return new Date(
		year,
		parseInt(month) - 1,
		parseInt(day),
		parseInt(hour),
		parseInt(minute)
	).getTime();
}

/**
 * 获取所有博客文章（按时间倒序）
 * @returns {string[]} 文件名数组
 */
function getAllPosts() {
	const files = fs.readdirSync(BLOG_DIR)
		.filter(file => file.endsWith('.md') || file.endsWith('.mdx'));

	// 按时间戳降序排序（新文章在前）
	return files.sort((a, b) => {
		const timeA = getTimestampFromFilename(a);
		const timeB = getTimestampFromFilename(b);
		return timeB - timeA;
	});
}

/**
 * 修复单篇文章
 * @param {string} filename - 文件名
 * @returns {boolean} 是否成功修复
 */
function fixSinglePost(filename) {
	const filePath = path.join(BLOG_DIR, filename);

	try {
		const content = fs.readFileSync(filePath, 'utf8');
		const fixed = fixChineseBold(content);

		// 检查是否有改动
		if (content === fixed) {
			console.log(`  ℹ️  ${filename} - 无需修复`);
			return false;
		}

		// 写入修复后的内容
		fs.writeFileSync(filePath, fixed, 'utf8');
		console.log(`  ✅ ${filename} - 修复完成`);
		return true;
	} catch (error) {
		console.error(`  ❌ ${filename} - 修复失败: ${error.message}`);
		return false;
	}
}

/**
 * 创建交互式命令行界面
 */
function createInterface() {
	return readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
}

/**
 * 提问并获取输入
 * @param {readline.Interface} rl - readline 接口
 * @param {string} question - 问题
 * @returns {Promise<string>} 用户输入
 */
function ask(rl, question) {
	return new Promise(resolve => {
		rl.question(question, answer => {
			resolve(answer.trim());
		});
	});
}

/**
 * 主函数
 */
async function main() {
	console.log('\n🔧 中文加粗修复工具\n');

	const rl = createInterface();

	try {
		// 获取所有文章
		const posts = getAllPosts();
		console.log(`📚 找到 ${posts.length} 篇文章\n`);

		// 选择修复模式
		console.log('请选择修复模式：');
		console.log('  1. 修复所有文章');
		console.log('  2. 选择单篇文章修复');
		console.log('  3. 退出\n');

		const mode = await ask(rl, '请输入选项 (1/2/3): ');

		if (mode === '1') {
			// 修复所有文章
			console.log('\n🚀 开始修复所有文章...\n');

			const confirm = await ask(rl, '⚠️  确认修复所有文章？此操作会修改文件内容。(y/n): ');

			if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
				console.log('\n❌ 操作已取消\n');
				return;
			}

			let fixedCount = 0;
			for (const post of posts) {
				if (fixSinglePost(post)) {
					fixedCount++;
				}
			}

			console.log(`\n✨ 修复完成！共修复 ${fixedCount} 篇文章\n`);

		} else if (mode === '2') {
			// 选择单篇文章修复
			console.log('\n📋 文章列表（按时间倒序）：\n');

			posts.forEach((post, index) => {
				// 提取标题（从文件中读取 frontmatter）
				const filePath = path.join(BLOG_DIR, post);
				const content = fs.readFileSync(filePath, 'utf8');
				const titleMatch = content.match(/^---\n[\s\S]*?title:\s*['"]?([^'"]+?)['"]?\n/);
				const title = titleMatch ? titleMatch[1] : '无标题';

				console.log(`  ${index + 1}. ${post}`);
				console.log(`     ${title}\n`);
			});

			const selection = await ask(rl, '请输入文章编号 (或输入 0 退出): ');
			const index = parseInt(selection) - 1;

			if (index === -1) {
				console.log('\n❌ 操作已取消\n');
				return;
			}

			if (index < 0 || index >= posts.length) {
				console.log('\n❌ 无效的编号\n');
				return;
			}

			console.log('\n🚀 开始修复...\n');
			fixSinglePost(posts[index]);
			console.log('\n✨ 修复完成！\n');

		} else if (mode === '3') {
			console.log('\n👋 再见！\n');
		} else {
			console.log('\n❌ 无效的选项\n');
		}

	} catch (error) {
		console.error('\n❌ 发生错误:', error.message);
	} finally {
		rl.close();
	}
}

// 运行主函数
main().catch(error => {
	console.error('发生错误:', error);
	process.exit(1);
});
