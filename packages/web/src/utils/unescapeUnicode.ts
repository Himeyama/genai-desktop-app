export const unescapeUnicode = (str: string): string => {
  if (!str) return str;

  let unescaped = str;

  const formatJson = (inner: string) => {
    let parsed = JSON.parse(inner);
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch (_) {}
    }
    if (typeof parsed === 'object' && parsed !== null) {
      let pretty = JSON.stringify(parsed, null, 2);
      // Unescape newlines inside the pretty-printed JSON for better readability
      pretty = pretty.replace(/\\n/g, '\n');
      return pretty;
    }
    throw new Error('Not an object');
  };

  // Pattern 1: JSON inside inline code block
  unescaped = unescaped.replace(/`([^`]+)`/g, (match, inner) => {
    try {
      return `\n\`\`\`json\n${formatJson(inner)}\n\`\`\`\n`;
    } catch (_) {}
    return match;
  });

  // Pattern 2: JSON inside code blocks
  unescaped = unescaped.replace(/```json\n([\s\S]+?)\n```/g, (match, inner) => {
    try {
      return `\`\`\`json\n${formatJson(inner)}\n\`\`\``;
    } catch (_) {}
    return match;
  });

  // Pattern 3: Unescape unicode outside of JSON parsing
  unescaped = unescaped.replace(/(?:\\+)u([0-9a-fA-F]{4})/g, (match, grp) => {
    try {
      return String.fromCharCode(parseInt(grp, 16));
    } catch (_e) {
      return match;
    }
  });

  // Pattern 4: Unescape any remaining escaped newlines
  unescaped = unescaped.replace(/(?:\\+)n/g, '\n');

  return unescaped;
};
