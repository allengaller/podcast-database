import { toMarkdown, formatTimestamp, formatDuration } from '../utils/transcript-formatter';
import { TingwuTranscriptionResult } from '../types/tingwu';

describe('formatTimestamp', () => {
  it('formats sub-hour timestamps as M:SS', () => {
    expect(formatTimestamp(0)).toBe('00:00');
    expect(formatTimestamp(65_000)).toBe('1:05');
    expect(formatTimestamp(3_599_000)).toBe('59:59');
  });

  it('formats hour+ timestamps as H:MM:SS', () => {
    expect(formatTimestamp(3_600_000)).toBe('1:00:00');
    expect(formatTimestamp(3_725_000)).toBe('1:02:05');
  });
});

describe('formatDuration', () => {
  it('returns seconds-only for short clips', () => {
    expect(formatDuration(45_000)).toBe('45s');
  });
  it('returns minutes and seconds for sub-hour durations', () => {
    expect(formatDuration(125_000)).toBe('2m 5s');
  });
  it('returns hours and minutes for long durations', () => {
    expect(formatDuration(3_725_000)).toBe('1h 2m');
  });
});

describe('toMarkdown', () => {
  const baseResult: TingwuTranscriptionResult = {
    Transcription: {
      Paragraphs: [
        {
          SpeakerId: '0',
          BeginTime: 12_000,
          EndTime: 14_500,
          Text: '欢迎收听本期节目。',
          Sentences: [{ Text: '欢迎收听本期节目。', BeginTime: 12_000, EndTime: 14_500 }],
        },
        {
          SpeakerId: '1',
          BeginTime: 15_000,
          EndTime: 18_000,
          Text: '我们今天聊聊大模型。',
          Sentences: [{ Text: '我们今天聊聊大模型。', BeginTime: 15_000, EndTime: 18_000 }],
        },
      ],
      Chapters: [
        { Title: '开场', BeginTime: 0, EndTime: 60_000 },
        { Title: '主题讨论', BeginTime: 60_000, EndTime: 600_000 },
      ],
    },
    Keywords: ['大模型', 'RAG', 'Agent'],
    Summary: '本期聊了大模型的几个关键方向。',
  };

  it('emits YAML frontmatter with the supplied metadata', () => {
    const { markdown } = toMarkdown(baseResult, {
      title: 'Teahour N - plain title',
      podcast: 'Teahour FM',
      sourceUrl: 'https://podcasts.apple.com/cn/podcast/teahour/id1',
      publishedAt: '2026-07-10',
      hosts: ['Terry', 'Daniel'],
      guests: ['Justin'],
      durationMs: 3_600_000,
      tags: ['podcast', 'teahour'],
    });

    expect(markdown).toMatch(/^---/);
    expect(markdown).toMatch(/^title: Teahour N - plain title$/m);
    expect(markdown).toMatch(/^podcast: Teahour FM$/m);
    expect(markdown).toMatch(/^duration: 1h 0m$/m);
    expect(markdown).toMatch(/^hosts: \[Terry, Daniel\]$/m);
    expect(markdown).toMatch(/^guests: \[Justin\]$/m);
    expect(markdown).toMatch(/^tags: \[podcast, teahour\]$/m);
  });

  it('renders paragraph headings with timestamps and speaker labels', () => {
    const { markdown } = toMarkdown(baseResult, {
      title: 'X',
      hosts: ['Terry'],
      guests: ['Justin'],
    });

    expect(markdown).toMatch(/### \[0:12\] Terry（主持）/);
    expect(markdown).toMatch(/欢迎收听本期节目。/);
    expect(markdown).toMatch(/### \[0:15\] Justin（嘉宾）/);
    expect(markdown).toMatch(/我们今天聊聊大模型。/);
  });

  it('renders the chapters list and keyword chips', () => {
    const { markdown } = toMarkdown(baseResult, { title: 'X' });
    expect(markdown).toMatch(/## 章节速览/);
    expect(markdown).toMatch(/- \*\*00:00\*\* 开场/);
    expect(markdown).toMatch(/- \*\*1:00\*\* 主题讨论/);
    expect(markdown).toMatch(/## 关键词/);
    expect(markdown).toMatch(/`大模型`.*`RAG`.*`Agent`/);
  });

  it('renders the summary block when 通义听悟 provides one', () => {
    const { markdown } = toMarkdown(baseResult, { title: 'X' });
    expect(markdown).toMatch(/## 摘要\n\n本期聊了大模型的几个关键方向。/);
  });

  it('falls back to "说话人" when no speakers are mapped', () => {
    const { markdown } = toMarkdown(baseResult, { title: 'X' });
    expect(markdown).toMatch(/### \[0:12\] 说话人/);
  });

  it('handles empty paragraphs gracefully', () => {
    const empty: TingwuTranscriptionResult = { Transcription: { Paragraphs: [] } };
    const { markdown } = toMarkdown(empty, { title: 'silent' });
    expect(markdown).toMatch(/## 完整逐字稿/);
    expect(markdown).toMatch(/未返回段落数据/);
  });

  it('quotes frontmatter strings with YAML-significant characters', () => {
    const { markdown } = toMarkdown(baseResult, {
      title: '-leading-dash',
      tags: ['weird:tag'],
    });
    expect(markdown).toMatch(/^title: "-leading-dash"$/m);
    // Mid-string `:` is fine in plain scalars; tags list keeps the unquoted form.
    expect(markdown).toMatch(/^tags: \[weird:tag\]$/m);
  });

  it('returns aggregated speaker stats with longest duration first', () => {
    const { speakers } = toMarkdown(baseResult, { title: 'X' });
    expect(speakers).toHaveLength(2);
    // Speaker 1 spoke 3s, Speaker 0 spoke 2.5s → Speaker 1 first.
    expect(speakers[0].id).toBe('1');
    expect(speakers[0].utteranceCount).toBe(1);
    expect(speakers[1].id).toBe('0');
  });
});
