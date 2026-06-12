import { stripHtml } from '../utils/html-utils';

describe('stripHtml', () => {
  it('should remove basic HTML tags', () => {
    expect(stripHtml('<p>Hello world</p>')).toBe('Hello world');
  });

  it('should handle nested tags', () => {
    expect(stripHtml('<div><p>Nested <strong>content</strong></p></div>')).toBe('Nested content');
  });

  it('should strip script and style tags with content', () => {
    expect(stripHtml('Before<script>alert("x")</script>After')).toBe('BeforeAfter');
    expect(stripHtml('Before<style>.foo{}</style>After')).toBe('BeforeAfter');
  });

  it('should convert block-level tags to newlines', () => {
    const result = stripHtml('<p>Line 1</p><p>Line 2</p>');
    expect(result).toContain('Line 1');
    expect(result).toContain('Line 2');
  });

  it('should handle sup and sub tags', () => {
    expect(stripHtml('x<sup>2</sup>')).toContain('^');
    expect(stripHtml('H<sub>2</sub>O')).toContain('_');
  });

  it('should decode common HTML entities', () => {
    expect(stripHtml('&amp;')).toContain('&');
    expect(stripHtml('&lt;')).toContain('<');
    expect(stripHtml('&gt;')).toContain('>');
  });

  it('should collapse whitespace', () => {
    const result = stripHtml('  multiple   spaces   ');
    expect(result).not.toMatch(/\s{3,}/);
  });

  it('should handle empty input', () => {
    expect(stripHtml('')).toBe('');
  });

  it('should handle input with no HTML', () => {
    expect(stripHtml('Plain text')).toBe('Plain text');
  });
});
