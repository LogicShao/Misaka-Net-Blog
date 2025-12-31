import type {CollectionEntry} from 'astro:content';

function cleanMarkdown(text: string): string {
  if (!text) return '';

  return text
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$]+\$/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/^>\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractChineseWords(text: string): string[] {
  if (!text) return [];

  const cleanedText = cleanMarkdown(text);
  const words: string[] = [];
  const cleanText = cleanedText
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const chars = cleanText.split('');
  for (let i = 0; i < chars.length; i++) {
    for (let len = 2; len <= 4 && i + len <= chars.length; len++) {
      const word = chars.slice(i, i + len).join('');
      if (/^[\u4e00-\u9fa5]{2,4}$/.test(word)) {
        words.push(word);
      }
    }
  }

  const englishWords = cleanText.match(/[a-zA-Z]{2,}/g) || [];
  words.push(...englishWords.map(word => word.toLowerCase()));

  return words;
}

const stopWords = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '一些',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '个',
  '自己', '这', '那', '里', '就是', '可以', '这个', '来', '与', '但是', '或者', '如果',
  '因为', '所以', '虽然', '然而', '但', '而且', '并且', '或', '又', '及', '以及',
  '什么', '怎么', '为什么', '哪里', '哪个', '怎样', '如何', '多少', '几个',
  '可能', '应该', '需要', '必须', '能够', '已经', '还是', '还有', '只是', '只有',
  '比如', '例如', '等等', '之类', '通过', '关于', '对于', '根据', '按照',
  '他', '她', '它', '他们', '她们', '它们', '我们', '你们', '大家',
  '这些', '那些', '这样', '那样', '怎样', '哪些',
  '进行', '实现', '使用', '包括', '具有', '属于', '成为', '作为', '由于',
  'frac', 'text', 'left', 'right', 'cdot', 'times', 'div', 'sum', 'int',
  'infty', 'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'theta', 'lambda',
  'omega', 'sigma', 'sqrt', 'quad', 'qquad', 'geq', 'leq', 'neq', 'approx',
  'mathbf', 'mathrm', 'mathbb', 'mathcal', 'limits', 'displaystyle',
  '代码', '示例', '如下', '下面', '上面', '接下来', '首先', '其次', '最后',
  '注意', '重要', '提示', '警告', '备注',
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'was', 'are', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'should', 'can', 'could', 'may', 'might',
  'must', 'shall', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
  'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how',
  'if', 'so', 'than', 'such', 'no', 'not', 'only', 'own', 'same', 'then', 'there',
  'their', 'them', 'some', 'all', 'each', 'few', 'more', 'most', 'other', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under',
  'again', 'further', 'once', 'here', 'both', 'very', 'too', 'also'
]);

export function generateWordCloudData(posts: CollectionEntry<'blog'>[]): [string, number][] {
  const wordFreq = new Map<string, number>();

  posts.forEach((post) => {
    const {title, description, tags} = post.data;
    const body = post.body || '';

    (tags || []).forEach(tag => {
      wordFreq.set(tag, (wordFreq.get(tag) || 0) + 3);
    });

    const titleWords = extractChineseWords(title);
    titleWords.forEach(word => {
      if (!stopWords.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 2);
      }
    });

    if (body) {
      const bodyWords = extractChineseWords(body);
      bodyWords.forEach(word => {
        if (!stopWords.has(word)) {
          wordFreq.set(word, (wordFreq.get(word) || 0) + 2);
        }
      });
    }

    const descWords = extractChineseWords(description || '');
    descWords.forEach(word => {
      if (!stopWords.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });
  });

  return Array.from(wordFreq.entries())
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 120)
    .map(([word, count]) => [word, count] as [string, number]);
}
