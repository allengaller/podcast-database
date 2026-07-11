/**
 * 通义听悟 (Tingwu) API response shapes.
 *
 * Spec: https://help.aliyun.com/zh/tingwu/developer-reference/api-reference
 */

export interface TingwuTranscriptionWord {
  Text: string;
  BeginTime: number; // ms
  EndTime: number; // ms
  ChannelId?: number;
  SpeakerId?: string;
  SentenceId?: number;
}

export interface TingwuTranscriptionSentence {
  Text: string;
  BeginTime: number; // ms
  EndTime: number; // ms
  SpeakerId?: string;
  ChannelId?: number;
  Words?: TingwuTranscriptionWord[];
}

export interface TingwuParagraph {
  Text: string;
  BeginTime: number; // ms
  EndTime: number; // ms
  SpeakerId?: string;
  ChannelId?: number;
  Sentences?: TingwuTranscriptionSentence[];
}

export interface TingwuChapter {
  Title: string;
  Summary?: string;
  BeginTime: number; // ms
  EndTime: number; // ms;
}

export interface TingwuTranscription {
  Paragraphs?: TingwuParagraph[];
  Chapters?: TingwuChapter[];
}

export interface TingwuTranscriptionResult {
  Transcription?: TingwuTranscription;
  // Optional meeting summary / keywords produced when those features are enabled.
  Summary?: string;
  Keywords?: string[];
  // Echoed task context.
  TaskId?: string;
  TaskStatus?: string;
}

export interface TingwuTaskStatus {
  TaskId: string;
  TaskStatus: 'RUNNING' | 'COMPLETED' | 'FAILED';
  SubmitTime?: string;
  EndTime?: string;
  TaskProgress?: number; // 0-100
  ErrorCode?: string;
  ErrorMessage?: string;
  TranscribeResult?: string; // JSON-serialized TingwuTranscriptionResult
}

export interface TingwuSubmitOptions {
  /** Publicly reachable URL of the audio (HTTP/HTTPS or OSS). */
  audioUrl: string;
  /** Language code, e.g. zh-CN, en-US. Defaults to zh-CN. */
  language?: string;
  /** Whether to enable speaker diarization. Defaults to true. */
  speakerDiarization?: boolean;
  /** Whether to enable auto punctuation. Defaults to true. */
  autoPunctuation?: boolean;
  /** Whether to enable chapter detection. Defaults to false. */
  chapterDetection?: boolean;
  /** Comma-separated hotword list to bias ASR (e.g. names, products). */
  hotwords?: string[];
  /** Optional custom task key for idempotency. */
  taskKey?: string;
}

export interface TingwuSpeaker {
  id: string;
  label: string; // e.g. "Speaker 1"
  durationMs: number;
  utteranceCount: number;
}