import {unified} from 'unified';
import remarkParse from 'remark-parse';
import {visitParents} from 'unist-util-visit-parents';

const wordCharRegex = /[\p{L}\p{N}]/u;
const skipParentTypes = new Set(['link', 'linkReference', 'definition']);

function isWordChar(value) {
  return value ? wordCharRegex.test(value) : false;
}

function shouldSkip(parents) {
  return parents.some((parent) => skipParentTypes.has(parent.type));
}

function applyInsertions(source, insertions) {
  if (insertions.length === 0) {
    return source;
  }

  const unique = new Map();
  for (const insertion of insertions) {
    if (!unique.has(insertion.offset)) {
      unique.set(insertion.offset, insertion.text);
    }
  }

  const sorted = Array.from(unique.entries())
    .sort((a, b) => b[0] - a[0]);

  let result = source;
  for (const [offset, text] of sorted) {
    result = result.slice(0, offset) + text + result.slice(offset);
  }

  return result;
}

export function fixChineseBold(source) {
  let tree;

  try {
    tree = unified().use(remarkParse).parse(source);
  } catch {
    return source;
  }
  const insertions = [];

  visitParents(tree, 'strong', (node, parents) => {
    if (!node.position?.start?.offset && node.position?.start?.offset !== 0) {
      return;
    }
    if (!node.position?.end?.offset && node.position?.end?.offset !== 0) {
      return;
    }
    if (shouldSkip(parents)) {
      return;
    }

    const parent = parents[parents.length - 1];
    if (!parent || !Array.isArray(parent.children)) {
      return;
    }

    const index = parent.children.indexOf(node);
    if (index === -1) {
      return;
    }

    const startOffset = node.position.start.offset;
    const endOffset = node.position.end.offset;
    const prev = parent.children[index - 1];
    const next = parent.children[index + 1];

    if (prev?.type === 'text' && prev.position?.end?.offset != null) {
      const between = source.slice(prev.position.end.offset, startOffset);
      const prevChar = prev.value ? prev.value.slice(-1) : '';
      if (between === '' && isWordChar(prevChar)) {
        insertions.push({offset: startOffset, text: ' '});
      }
    }

    if (next?.type === 'text' && next.position?.start?.offset != null) {
      const between = source.slice(endOffset, next.position.start.offset);
      const nextChar = next.value ? next.value[0] : '';
      if (between === '' && isWordChar(nextChar)) {
        insertions.push({offset: endOffset, text: ' '});
      }
    }
  });

  return applyInsertions(source, insertions);
}
