import {
  TingwuChapter,
  TingwuParagraph,
  TingwuTranscriptionSentence,
  TingwuSpeaker,
  TingwuTranscription,
  TingwuTranscriptionResult,
} from '../types/tingwu';

export interface MarkdownTranscriptOptions {
  title: string;
  podcast?: string;
  sourceUrl?: string;
  publishedAt?: string;
  hosts?: string[];
  guests?: string[];
  durationMs?: number;
  tags?: string[];
  /** Extra frontmatter fields, merged into the YAML block. */
  extraFrontmatter?: Record<string, string | number | string[]>;
  /** Optional summary to render between metadata and transcript body. */
  summary?: string;
}

export interface MarkdownTranscriptResult {
  markdown: string;
  speakers: TingwuSpeaker[];
}

/**
 * Convert a 通义听悟 result payload into a self-contained markdown file
 * suitable for committing to a knowledge base.
 *
 * The output layout:
 *
 *   ---
 *   frontmatter (title, podcast, date, hosts, guests, duration, tags, ...)
 *   ---
 *
 *   # Title
 *
 *   ## 元信息
 *   ## 摘要
 *   ## 章节速览
 *   ## 关键要点 / 关键词
 *   ## 完整逐字稿
 *     ### [00:12:34] Speaker 1
 *     ...
 */
export function toMarkdown(
  result: TingwuTranscriptionResult,
  opts: MarkdownTranscriptOptions
): MarkdownTranscriptResult {
  const transcription = result.Transcription ?? {};
  const paragraphs = transcription.Paragraphs ?? [];
  const chapters = transcription.Chapters ?? [];

  const speakers = aggregateSpeakers(paragraphs);
  const body = renderBody(transcription, paragraphs, chapters, opts, result);
  const frontmatter = renderFrontmatter(opts);

  const markdown = `${frontmatter}\n\n# ${opts.title}\n\n${body}\n`;
  return { markdown, speakers };
}

// ---------- frontmatter ----------

function renderFrontmatter(opts: MarkdownTranscriptOptions): string {
  const lines: string[] = ['---'];
  lines.push(`title: ${yamlString(opts.title)}`);
  if (opts.podcast) lines.push(`podcast: ${yamlString(opts.podcast)}`);
  if (opts.sourceUrl) lines.push(`source: ${yamlString(opts.sourceUrl)}`);
  if (opts.publishedAt) lines.push(`date: ${yamlString(opts.publishedAt)}`);
  if (opts.durationMs && opts.durationMs > 0) {
    lines.push(`duration: ${yamlString(formatDuration(opts.durationMs))}`);
  }
  if (opts.hosts?.length) lines.push(`hosts: ${yamlList(opts.hosts)}`);
  if (opts.guests?.length) lines.push(`guests: ${yamlList(opts.guests)}`);
  if (opts.tags?.length) lines.push(`tags: ${yamlList(opts.tags)}`);
  if (opts.extraFrontmatter) {
    for (const [k, v] of Object.entries(opts.extraFrontmatter)) {
      if (Array.isArray(v)) lines.push(`${k}: ${yamlList(v)}`);
      else lines.push(`${k}: ${yamlString(String(v))}`);
    }
  }
  lines.push(`created_at: ${yamlString(new Date().toISOString())}`);
  lines.push('---');
  return lines.join('\n');
}

function yamlString(s: string): string {
  // Quote strings that contain YAML-significant characters. `#` is only
  // significant at the start of a line, so it does not need quoting mid-value.
  if (/[\n"'{}[\],&*?|<>=!%@`]/.test(s) || /^\s|\s$/.test(s) || /^[-?:]/.test(s)) {
    return `"${s.replace(/"/g, '\\"')}"`;
  }
  return s;
}

function yamlList(items: string[]): string {
  return `[${items.map((s) => yamlString(s)).join(', ')}]`;
}

// ---------- body ----------

function renderBody(
  transcription: TingwuTranscription,
  paragraphs: TingwuParagraph[],
  chapters: TingwuChapter[],
  opts: MarkdownTranscriptOptions,
  result: TingwuTranscriptionResult
): string {
  const sections: string[] = [];

  // 元信息
  const metaRows: string[] = [];
  if (opts.podcast) metaRows.push(`- **节目**: ${opts.podcast}`);
  if (opts.sourceUrl) metaRows.push(`- **来源**: <${opts.sourceUrl}>`);
  if (opts.publishedAt) metaRows.push(`- **发布日期**: ${opts.publishedAt}`);
  if (opts.durationMs && opts.durationMs > 0) {
    metaRows.push(`- **时长**: ${formatDuration(opts.durationMs)}`);
  }
  if (opts.hosts?.length) metaRows.push(`- **主持**: ${opts.hosts.join('、')}`);
  if (opts.guests?.length) metaRows.push(`- **嘉宾**: ${opts.guests.join('、')}`);
  if (paragraphs.length > 0) {
    const totalMs = paragraphs.reduce((max, p) => Math.max(max, p.EndTime ?? 0), 0);
    if (!opts.durationMs && totalMs > 0) {
      metaRows.push(`- **实际时长**: ${formatDuration(totalMs)}`);
    }
  }
  sections.push(`## 元信息\n\n${metaRows.join('\n')}`);

  // 摘要
  if (opts.summary || result.Summary) {
    const summary = (opts.summary ?? result.Summary ?? '').trim();
    if (summary) {
      sections.push(`## 摘要\n\n${summary}`);
    }
  }

  // 章节
  if (chapters.length > 0) {
    const rows = chapters
      .map(
        (c) =>
          `- **${formatTimestamp(c.BeginTime)}** ${c.Title}${c.Summary ? ` — ${c.Summary}` : ''}`
      )
      .join('\n');
    sections.push(`## 章节速览\n\n${rows}`);
  }

  // 关键词
  if (result.Keywords && result.Keywords.length > 0) {
    sections.push(`## 关键词\n\n${result.Keywords.map((k) => `\`${k}\``).join('、')}`);
  }

  // 完整逐字稿
  if (paragraphs.length === 0) {
    sections.push(`## 完整逐字稿\n\n_通义听悟未返回段落数据，可能音频无声或服务异常。_`);
  } else {
    const transcript = paragraphs.map((p) => renderParagraph(p, opts)).join('\n\n');
    sections.push(`## 完整逐字稿\n\n${transcript}`);
  }

  return sections.join('\n\n');
}

function renderParagraph(p: TingwuParagraph, opts: MarkdownTranscriptOptions): string {
  const ts = formatTimestamp(p.BeginTime);
  const speakerLabel = labelSpeaker(p.SpeakerId, opts);
  const sentences = (p.Sentences ?? [])
    .map((s: TingwuTranscriptionSentence) => s.Text.trim())
    .filter(Boolean)
    .join('');
  const text = (sentences || p.Text || '').trim();
  return `### [${ts}] ${speakerLabel}\n\n${text}`;
}

function labelSpeaker(speakerId: string | undefined, opts: MarkdownTranscriptOptions): string {
  const allPeople = [...(opts.hosts ?? []), ...(opts.guests ?? [])];
  // If the speaker ID maps to a host or guest name, prefer that.
  if (speakerId && allPeople.length > 0) {
    const idx = parseInt(speakerId.replace(/\D/g, ''), 10);
    if (!Number.isNaN(idx) && idx >= 0 && idx < allPeople.length) {
      const role = idx < (opts.hosts?.length ?? 0) ? '主持' : '嘉宾';
      return `${allPeople[idx]}（${role}）`;
    }
  }
  // No name mapping available — fall back to a neutral "说话人" label.
  return '说话人';
}

// ---------- aggregation ----------

function aggregateSpeakers(paragraphs: TingwuParagraph[]): TingwuSpeaker[] {
  const buckets = new Map<string, { duration: number; count: number }>();
  for (const p of paragraphs) {
    const key = p.SpeakerId ?? 'unknown';
    const dur = Math.max(0, (p.EndTime ?? 0) - (p.BeginTime ?? 0));
    const prev = buckets.get(key) ?? { duration: 0, count: 0 };
    buckets.set(key, { duration: prev.duration + dur, count: prev.count + 1 });
  }
  return Array.from(buckets.entries())
    .map(([id, agg]) => ({
      id,
      label: `Speaker ${id}`,
      durationMs: agg.duration,
      utteranceCount: agg.count,
    }))
    .sort((a, b) => b.durationMs - a.durationMs);
}

// ---------- formatting helpers ----------

/** Convert milliseconds to HH:MM:SS or M:SS. */
export function formatTimestamp(ms: number): string {
  if (!ms || ms < 0) return '00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Convert milliseconds to a human "1h 23m" / "12m 5s" string. */
export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// Re-export the sentence type so callers can import everything from one place.
export type { TingwuTranscriptionSentence };
