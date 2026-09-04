'use client';

import { cn } from '@/lib/utils';

interface TranscriptProps {
  content: string;
  className?: string;
}

const SECTION_HEADERS = [
  'Example',
  'Examples',
  'Constraints',
  'Follow-up',
  'Note',
  'Hints',
  '题目描述',
  '示例',
  '约束',
  '进阶',
  '思路',
  '复杂度',
];

function formatTranscript(text: string) {
  // Split by section headers while keeping the delimiter
  const pattern = new RegExp(
    `(${SECTION_HEADERS.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}):?`,
    'g'
  );

  const parts = text.split(pattern).filter(Boolean);
  const blocks: { type: 'text' | 'header' | 'code'; content: string }[] = [];

  let i = 0;
  while (i < parts.length) {
    const part = parts[i].trim();
    const isHeader = SECTION_HEADERS.some((h) => part === h || part === h + ':');

    if (isHeader && i + 1 < parts.length) {
      blocks.push({ type: 'header', content: part.replace(/:$/, '') });
      i++;
      const body = parts[i].trim();
      // Merge code-like lines into code block
      const lines = body.split('\n');
      let currentText = '';
      let currentCode = '';
      for (const line of lines) {
        const trimmed = line.trim();
        const isCode =
          trimmed.startsWith('Input:') ||
          trimmed.startsWith('Output:') ||
          trimmed.startsWith('Explanation:') ||
          /^[\w\s]*=\s*[[{"\d]/.test(trimmed) ||
          /^\s*(def |class |var |let |const |if |for |while |return )/.test(trimmed) ||
          /^\s*[-\d\s,[]{}()<>]+$/.test(trimmed);

        if (isCode) {
          if (currentText) {
            blocks.push({ type: 'text', content: currentText.trim() });
            currentText = '';
          }
          currentCode += line + '\n';
        } else {
          if (currentCode) {
            blocks.push({ type: 'code', content: currentCode.trim() });
            currentCode = '';
          }
          currentText += line + '\n';
        }
      }
      if (currentText) blocks.push({ type: 'text', content: currentText.trim() });
      if (currentCode) blocks.push({ type: 'code', content: currentCode.trim() });
      i++;
    } else {
      // Plain text block before any header
      const lines = part.split('\n');
      let currentText = '';
      let currentCode = '';
      for (const line of lines) {
        const trimmed = line.trim();
        const isCode =
          trimmed.startsWith('Input:') ||
          trimmed.startsWith('Output:') ||
          trimmed.startsWith('Explanation:') ||
          /^[\w\s]*=\s*[[{"\d]/.test(trimmed) ||
          /^\s*(def |class |var |let |const |if |for |while |return )/.test(trimmed) ||
          /^\s*[-\d\s,[]{}()<>]+$/.test(trimmed);

        if (isCode) {
          if (currentText) {
            blocks.push({ type: 'text', content: currentText.trim() });
            currentText = '';
          }
          currentCode += line + '\n';
        } else {
          if (currentCode) {
            blocks.push({ type: 'code', content: currentCode.trim() });
            currentCode = '';
          }
          currentText += line + '\n';
        }
      }
      if (currentText) blocks.push({ type: 'text', content: currentText.trim() });
      if (currentCode) blocks.push({ type: 'code', content: currentCode.trim() });
      i++;
    }
  }

  return blocks;
}

export function Transcript({ content, className }: TranscriptProps) {
  const blocks = formatTranscript(content);

  return (
    <div className={cn('space-y-4 text-sm leading-relaxed', className)}>
      {blocks.map((block, idx) => {
        if (block.type === 'header') {
          return (
            <h4 key={idx} className="mt-5 text-base font-semibold text-white">
              {block.content}
            </h4>
          );
        }
        if (block.type === 'code') {
          return (
            <pre
              key={idx}
              className="overflow-x-auto rounded-lg bg-black/30 p-3 font-mono text-xs text-indigo-200"
            >
              {block.content}
            </pre>
          );
        }
        return (
          <p key={idx} className="text-white/90">
            {block.content}
          </p>
        );
      })}
    </div>
  );
}
