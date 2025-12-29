import {unified} from 'unified';
import remarkParse from 'remark-parse';
import {visitParents} from 'unist-util-visit-parents';

const wordCharRegex = /[\p{L}\p{N}]/u;
const skipParentTypes = new Set(['link', 'linkReference', 'definition', 'strong', 'emphasis']);
const skipDetectTypes = new Set([
  'link',
  'linkReference',
  'definition',
  'strong',
  'emphasis',
  'code',
  'inlineCode',
  'html',
]);
const cjkRegex = /[\u4e00-\u9fff]/;

function isWordChar(value) {
  return value ? wordCharRegex.test(value) : false;
}

function shouldSkip(parents) {
  return parents.some((parent) => skipParentTypes.has(parent.type));
}

function shouldSkipDetect(parents) {
  return parents.some((parent) => skipDetectTypes.has(parent.type));
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

function repairSplitStrongMarkers(source) {
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  const lines = source.split(/\r?\n/);
  let inFence = false;
  let fenceMarker = '';
  const output = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const fenceMatch = line.match(/^\s*(```|~~~)/);

    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
      } else if (marker === fenceMarker) {
        inFence = false;
        fenceMarker = '';
      }
    }

    if (!inFence && i < lines.length - 1) {
      const trimmed = line.replace(/[ \t]+$/, '');
      const nextLine = lines[i + 1];
      const endsWithSingleStar =
        trimmed.endsWith('*') &&
        !trimmed.endsWith('**') &&
        !trimmed.endsWith('\\*');
      const nextStartsSingleStar =
        nextLine.startsWith('*') &&
        nextLine.length > 1 &&
        nextLine[1] !== '*' &&
        !/^\*\s/.test(nextLine);

      if (endsWithSingleStar && nextStartsSingleStar) {
        output.push(trimmed + nextLine);
        i += 1;
        continue;
      }
    }

    output.push(line);
  }

  return output.join(newline);
}

export function findChineseBoldIssues(source) {
  const issues = [];
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  const lines = source.split(/\r?\n/);
  let inFence = false;
  let fenceMarker = '';

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const fenceMatch = line.match(/^\s*(```|~~~)/);

    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
      } else if (marker === fenceMarker) {
        inFence = false;
        fenceMarker = '';
      }
    }

    if (!inFence && i < lines.length - 1) {
      const trimmed = line.replace(/[ \t]+$/, '');
      const nextLine = lines[i + 1];
      const endsWithSingleStar =
        trimmed.endsWith('*') &&
        !trimmed.endsWith('**') &&
        !trimmed.endsWith('\\*');
      const nextStartsSingleStar =
        nextLine.startsWith('*') &&
        nextLine.length > 1 &&
        nextLine[1] !== '*' &&
        !/^\*\s/.test(nextLine);

      if (endsWithSingleStar && nextStartsSingleStar) {
        issues.push({
          rule: 'split-strong',
          line: i + 1,
          column: Math.max(trimmed.length, 1),
          message: 'Possible split ** marker across lines',
          snippet: trimmed + newline + nextLine,
        });
      }
    }
  }

  let tree;
  try {
    tree = unified().use(remarkParse).parse(source);
  } catch {
    return issues;
  }

  visitParents(tree, 'text', (node, parents) => {
    if (!node.position?.start?.offset && node.position?.start?.offset !== 0) {
      return;
    }
    if (shouldSkipDetect(parents)) {
      return;
    }

    const value = node.value || '';
    if (!value.includes('**')) {
      return;
    }

    const startLine = node.position.start.line;
    const startColumn = node.position.start.column;
    const strongRegex = /\*\*([^*]*?)\*\*/g;
    let match;

    while ((match = strongRegex.exec(value)) !== null) {
      const inner = match[1];
      if (!cjkRegex.test(inner)) {
        continue;
      }
      if (match.index > 0 && value[match.index - 1] === '\\') {
        continue;
      }

      const before = value.slice(0, match.index);
      const lineBreaks = before.split('\n');
      const lineOffset = lineBreaks.length - 1;
      const line = startLine + lineOffset;
      const column =
        lineOffset === 0
          ? startColumn + before.length
          : lineBreaks[lineBreaks.length - 1].length + 1;
      const snippet = lines[line - 1] || value;

      issues.push({
        rule: 'unparsed-strong',
        line,
        column,
        message: 'Literal **...** detected in text node',
        snippet,
      });
    }
  });

  return issues;
}

export function fixChineseBold(source) {
  const workingSource = repairSplitStrongMarkers(source);
  let tree;

  try {
    tree = unified().use(remarkParse).parse(workingSource);
  } catch {
    return workingSource;
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
      const between = workingSource.slice(prev.position.end.offset, startOffset);
      const prevChar = prev.value ? prev.value.slice(-1) : '';
      if (between === '' && isWordChar(prevChar)) {
        insertions.push({offset: startOffset, text: ' '});
      }
    }

    if (next?.type === 'text' && next.position?.start?.offset != null) {
      const between = workingSource.slice(endOffset, next.position.start.offset);
      const nextChar = next.value ? next.value[0] : '';
      if (between === '' && isWordChar(nextChar)) {
        insertions.push({offset: endOffset, text: ' '});
      }
    }
  });

  visitParents(tree, 'text', (node, parents) => {
    if (!node.position?.start?.offset && node.position?.start?.offset !== 0) {
      return;
    }
    if (shouldSkip(parents)) {
      return;
    }

    const value = node.value || '';
    if (!value.includes('**')) {
      return;
    }

    const startOffset = node.position.start.offset;
    const strongRegex = /\*\*([^*]*?)\*\*/g;
    let match;

    while ((match = strongRegex.exec(value)) !== null) {
      const inner = match[1];
      if (!cjkRegex.test(inner)) {
        continue;
      }

      const matchStart = startOffset + match.index;
      const matchEnd = matchStart + match[0].length;
      const prevChar = matchStart > 0 ? workingSource[matchStart - 1] : '';
      const nextChar = matchEnd < workingSource.length ? workingSource[matchEnd] : '';

      if (isWordChar(prevChar)) {
        insertions.push({offset: matchStart, text: ' '});
      }
      if (isWordChar(nextChar)) {
        insertions.push({offset: matchEnd, text: ' '});
      }
    }
  });

  return applyInsertions(workingSource, insertions);
}
