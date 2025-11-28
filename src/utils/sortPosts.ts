/**
 * 博客文章排序工具函数
 *
 * 文件名格式：YY-MM-DD-HH-MM.md
 * 例如：25-11-24-16-00.md 表示 2025年11月24日 16:00
 */

import type {CollectionEntry} from 'astro:content';

/**
 * 从文件名中提取时间戳
 * @param id 文章 ID（文件名不含扩展名）
 * @returns 时间戳（毫秒），如果解析失败返回 0
 *
 * @example
 * getTimestampFromFilename('25-11-24-16-00') // 返回 2025-11-24 16:00 的时间戳
 */
export function getTimestampFromFilename(id: string): number {
  // 匹配文件名格式：YY-MM-DD-HH-MM
  const match = id.match(/^(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})/);

  if (!match) {
    // 如果文件名不符合格式，返回 0
    console.warn(`文件名格式不匹配: ${id}`);
    return 0;
  }

  const [, yy, month, day, hour, minute] = match;

  // 将两位年份转换为完整年份（假设 20xx 年代）
  const year = 2000 + parseInt(yy, 10);

  // 创建 Date 对象
  const date = new Date(
    year,
    parseInt(month, 10) - 1, // JavaScript 月份从 0 开始
    parseInt(day, 10),
    parseInt(hour, 10),
    parseInt(minute, 10)
  );

  return date.getTime();
}

/**
 * 排序博客文章（新文章在前）
 *
 * 优先使用文件名中的精确时间（小时+分钟）进行排序
 * 如果文件名解析失败，降级使用 pubDate 字段
 *
 * @param posts 文章数组
 * @returns 排序后的文章数组（新文章在前）
 *
 * @example
 * const sorted = sortPostsByTime(posts);
 */
export function sortPostsByTime<T extends CollectionEntry<'blog'>>(posts: T[]): T[] {
  return posts.sort((a, b) => {
    // 优先使用文件名中的时间戳
    const timeA = getTimestampFromFilename(a.id);
    const timeB = getTimestampFromFilename(b.id);

    // 如果文件名时间戳有效，使用文件名时间排序
    if (timeA > 0 && timeB > 0) {
      return timeB - timeA; // 降序：新文章在前
    }

    // 降级方案：使用 pubDate 字段
    const dateA = a.data.pubDate?.valueOf() || 0;
    const dateB = b.data.pubDate?.valueOf() || 0;

    return dateB - dateA;
  });
}

/**
 * 排序比较函数（用于 Array.sort）
 *
 * @example
 * posts.sort(comparePostsByTime)
 */
export function comparePostsByTime(
  a: CollectionEntry<'blog'>,
  b: CollectionEntry<'blog'>
): number {
  const timeA = getTimestampFromFilename(a.id);
  const timeB = getTimestampFromFilename(b.id);

  if (timeA > 0 && timeB > 0) {
    return timeB - timeA;
  }

  return (b.data.pubDate?.valueOf() || 0) - (a.data.pubDate?.valueOf() || 0);
}
