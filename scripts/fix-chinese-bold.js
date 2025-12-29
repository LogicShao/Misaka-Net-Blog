#!/usr/bin/env node

/**
 * 中文加粗问题扫描脚本
 *
 * 功能：
 * 1. 检测 Markdown 中 **中文** 加粗格式可能解析失败的位置
 * 2. 标记可能出现断行或渲染异常的段落
 * 3. 支持单篇文章或批量扫描所有文章
 */

import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import readline from 'readline';
import {findChineseBoldIssues} from './markdown-bold-fix.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blog');


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
 * 扫描单篇文章
 * @param {string} filename - 文件名
 * @returns {number} 可疑位置数量
 */
function scanSinglePost(filename) {
	const filePath = path.join(BLOG_DIR, filename);

	try {
		const content = fs.readFileSync(filePath, 'utf8');
		const issues = findChineseBoldIssues(content);

		if (issues.length === 0) {
			console.log(`  ℹ️  ${filename} - 未发现可疑位置`);
			return 0;
		}

		console.log(`  ⚠️  ${filename} - 发现 ${issues.length} 处可疑位置`);
		issues.forEach((issue, index) => {
			const location = `L${issue.line}:${issue.column}`;
			const snippet = formatSnippet(issue.snippet);
			console.log(`    ${index + 1}. ${location} ${issue.rule} - ${issue.message}`);
			if (snippet) {
				console.log(`       ${snippet}`);
			}
		});

		return issues.length;
	} catch (error) {
		console.error(`  ❌ ${filename} - 扫描失败: ${error.message}`);
		return 0;
	}
}

function formatSnippet(snippet) {
	if (!snippet) return '';
	const cleaned = snippet.replace(/\r?\n/g, '\\n').trim();
	if (cleaned.length <= 160) return cleaned;
	return `${cleaned.slice(0, 160)}...`;
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
	console.log('\n🔍 中文加粗问题扫描工具\n');

	const rl = createInterface();

	try {
		// 获取所有文章
		const posts = getAllPosts();
		console.log(`📚 找到 ${posts.length} 篇文章\n`);

		// 选择扫描模式
		console.log('请选择扫描模式：');
		console.log('  1. 扫描所有文章');
		console.log('  2. 选择单篇文章扫描');
		console.log('  3. 退出\n');

		const mode = await ask(rl, '请输入选项 (1/2/3): ');

		if (mode === '1') {
			// 扫描所有文章
			console.log('\n🚀 开始扫描所有文章...\n');

			const confirm = await ask(rl, '⚠️  确认扫描所有文章？(y/n): ');

			if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
				console.log('\n❌ 操作已取消\n');
				return;
			}

			let issueCount = 0;
			let fileCount = 0;
			for (const post of posts) {
				const count = scanSinglePost(post);
				if (count > 0) fileCount += 1;
				issueCount += count;
			}

			console.log(`\n✨ 扫描完成！共发现 ${issueCount} 处可疑位置，涉及 ${fileCount} 篇文章\n`);

		} else if (mode === '2') {
			// 选择单篇文章扫描
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

			console.log('\n🚀 开始扫描...\n');
			scanSinglePost(posts[index]);
			console.log('\n✨ 扫描完成！\n');

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
