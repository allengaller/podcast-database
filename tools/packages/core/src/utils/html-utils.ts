/**
 * Convert HTML to readable plain text.
 * - Block tags become newlines
 * - <sup> becomes ^, <sub> becomes _
 * - Inline tags are stripped without adding spaces
 * - Basic HTML entities are decoded
 */
export function stripHtml(html: string): string {
  if (!html) return '';

  let text = html
    // Remove script/style first
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Convert block-level tags to newlines before stripping remaining tags
  const blockTags = 'p|div|h[1-6]|li|pre|blockquote|section|article|header|footer|nav|aside|br';
  text = text.replace(new RegExp(`<(?:${blockTags})[^>]*>`, 'gi'), '\n');
  text = text.replace(new RegExp(`</(?:${blockTags})>`, 'gi'), '\n');

  // Convert <sup>content</sup> to ^content
  text = text.replace(/<sup[^>]*>([\s\S]*?)<\/sup>/gi, '^$1');
  // Convert <sub>content</sub> to _content
  text = text.replace(/<sub[^>]*>([\s\S]*?)<\/sub>/gi, '_$1');

  // Remove remaining inline tags (code, strong, em, b, i, span, a, etc.) without adding spaces
  text = text.replace(/<[^>]+>/g, '');

  // Decode common entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"');

  // Clean up whitespace:
  // - collapse multiple spaces into one
  // - trim spaces around newlines
  // - collapse 3+ newlines into 2
  text = text
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}
