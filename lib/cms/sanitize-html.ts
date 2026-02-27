const eventHandlerAttrPattern = /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const dangerousProtocolPattern = /(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi;
const dangerousBlockPattern = /<\s*(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const dangerousSelfClosingPattern = /<\s*(script|style|iframe|object|embed|link|meta)[^>]*\/?>/gi;
const htmlCommentPattern = /<!--([\s\S]*?)-->/g;

export const sanitizeHtml = (input: string) => {
  if (!input) return "";

  return input
    .replace(dangerousBlockPattern, "")
    .replace(dangerousSelfClosingPattern, "")
    .replace(eventHandlerAttrPattern, "")
    .replace(dangerousProtocolPattern, '$1="#"')
    .replace(htmlCommentPattern, "")
    .trim();
};
