import crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';
import { TingwuSubmitOptions, TingwuTaskStatus, TingwuTranscriptionResult } from '../types/tingwu';

/**
 * Alibaba Cloud 通义听悟 (Tingwu) REST client.
 *
 * Implements the OpenAPI V3 signature (HMAC-SHA256) inline so the project does
 * not need to pull in @alicloud/openapi-client.
 *
 * Required env:
 *   - ALIYUN_ACCESS_KEY_ID
 *   - ALIYUN_ACCESS_KEY_SECRET
 *   - TINGWU_APP_KEY   (the AppKey from the 通义听悟 console)
 *
 * API reference:
 *   https://help.aliyun.com/zh/tingwu/developer-reference/api-reference
 */
export class TingwuService {
  private static readonly API_VERSION = '2024-06-05';
  private static readonly HOST = 'tingwu.aliyuncs.com';
  private static readonly BASE_URL = `https://${this.HOST}`;
  private static readonly DEFAULT_REGION = 'cn-shanghai';

  private static client(): AxiosInstance {
    return axios.create({
      baseURL: this.BASE_URL,
      timeout: 30_000,
    });
  }

  private static getCredentials(): {
    accessKeyId: string;
    accessKeySecret: string;
    appKey: string;
  } {
    const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
    const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;
    const appKey = process.env.TINGWU_APP_KEY;
    if (!accessKeyId || !accessKeySecret || !appKey) {
      throw new Error(
        'Missing 通义听悟 credentials. Set ALIYUN_ACCESS_KEY_ID, ALIYUN_ACCESS_KEY_SECRET, and TINGWU_APP_KEY in the environment.'
      );
    }
    return { accessKeyId, accessKeySecret, appKey };
  }

  /**
   * Build the canonical V3 signature headers for a single request.
   * Returns the headers to spread onto the axios call.
   */
  private static sign(
    method: 'GET' | 'POST',
    action: string,
    query: Record<string, string | number | undefined>,
    body: unknown
  ): Record<string, string> {
    const { accessKeyId, accessKeySecret } = this.getCredentials();

    const now = new Date();
    const isoDate = now.toISOString().replace(/\.\d{3}Z$/, 'Z'); // yyyy-MM-ddTHH:mm:ssZ
    const nonce = crypto.randomUUID();

    // Canonical query string (sorted keys, RFC 3986 encoding).
    const sortedQueryKeys = Object.keys(query)
      .filter((k) => query[k] !== undefined)
      .sort();
    const canonicalQueryString = sortedQueryKeys
      .map((k) => `${encodeRFC3986(k)}=${encodeRFC3986(String(query[k]))}`)
      .join('&');

    // Canonical headers (sorted lowercase names).
    const host = this.HOST;
    const headersToSign: Record<string, string> = {
      host,
      'x-acs-action': action,
      'x-acs-date': isoDate,
      'x-acs-version': this.API_VERSION,
      'x-acs-signature-nonce': nonce,
    };

    const canonicalHeaders = Object.keys(headersToSign)
      .sort()
      .map((k) => `${k}:${trim(headersToSign[k])}`)
      .join('\n');
    const signedHeaders = Object.keys(headersToSign).sort().join(';');

    const bodyStr = body === undefined || body === null ? '' : JSON.stringify(body);
    const hashedPayload = crypto.createHash('sha256').update(bodyStr, 'utf8').digest('hex');

    const canonicalRequest = [
      method.toUpperCase(),
      '/',
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      hashedPayload,
    ].join('\n');

    const hashedCanonicalRequest = crypto
      .createHash('sha256')
      .update(canonicalRequest, 'utf8')
      .digest('hex');

    const stringToSign = `ACS3-HMAC-SHA256\n${hashedCanonicalRequest}`;

    const signature = crypto
      .createHmac('sha256', `aliyun_v3${accessKeySecret}`)
      .update(stringToSign, 'utf8')
      .digest('hex');

    const authorization = `ACS3-HMAC-SHA256 Credential=${accessKeyId},SignedHeaders=${signedHeaders},Signature=${signature}`;

    return {
      host,
      'x-acs-action': action,
      'x-acs-version': this.API_VERSION,
      'x-acs-date': isoDate,
      'x-acs-signature-nonce': nonce,
      authorization,
      'content-type': 'application/json; charset=utf-8',
    };
  }

  /**
   * Submit a transcription task. The audioUrl must be reachable from
   * 通义听悟 (a public HTTPS URL or an Alibaba OSS object URL).
   */
  static async submitTask(opts: TingwuSubmitOptions): Promise<string> {
    const { appKey } = this.getCredentials();

    const body = {
      AppKey: appKey,
      Input: {
        SourceLanguage: opts.language ?? 'zh-CN',
        TaskKey: opts.taskKey,
        FileURL: opts.audioUrl,
      },
      Parameters: {
        Transcription: {
          DiarizationEnabled: opts.speakerDiarization ?? true,
          Diarization: {
            SpeakerCount: undefined,
          },
          AutoPunctuationEnabled: opts.autoPunctuation ?? true,
          HotWordList:
            opts.hotwords && opts.hotwords.length > 0
              ? {
                  HotWords: opts.hotwords.map((w) => ({ Word: w })),
                }
              : undefined,
        },
        ...(opts.chapterDetection
          ? {
              Chapter: { Enabled: true },
            }
          : {}),
      },
    };

    const headers = this.sign('POST', 'CreateTask', { region: this.DEFAULT_REGION }, body);
    const res = await this.client().post('/openapi/tingwu/v2/tasks', body, { headers });
    // Aliyun SDK returns loosely-typed JSON; the wire shape is documented but
    // not exported as types. Cast through `unknown` to keep ESLint happy.
    const payload = res.data as { Data?: { TaskId?: string }; TaskId?: string } | undefined;
    const taskId = payload?.Data?.TaskId ?? payload?.TaskId;
    if (!taskId) {
      throw new Error(`通义听悟 CreateTask returned no TaskId: ${JSON.stringify(res.data)}`);
    }
    return taskId;
  }

  /**
   * Poll a task until it is COMPLETED or FAILED.
   * Returns the full status payload (including TranscribeResult JSON).
   */
  static async waitForCompletion(
    taskId: string,
    opts: { intervalMs?: number; timeoutMs?: number } = {}
  ): Promise<TingwuTaskStatus> {
    const interval = opts.intervalMs ?? 5000;
    const timeout = opts.timeoutMs ?? 30 * 60 * 1000; // 30 min default
    const start = Date.now();

    for (;;) {
      const status = await this.getTask(taskId);
      if (status.TaskStatus === 'COMPLETED') return status;
      if (status.TaskStatus === 'FAILED') {
        throw new Error(
          `通义听悟 task ${taskId} failed: ${status.ErrorCode ?? 'unknown'} ${status.ErrorMessage ?? ''}`
        );
      }
      if (Date.now() - start > timeout) {
        throw new Error(`通义听悟 task ${taskId} timed out after ${timeout / 1000}s`);
      }
      await new Promise((r) => setTimeout(r, interval));
    }
  }

  /** Fetch the latest task status snapshot. */
  static async getTask(taskId: string): Promise<TingwuTaskStatus> {
    const headers = this.sign(
      'GET',
      'GetTaskInfo',
      { region: this.DEFAULT_REGION, TaskId: taskId },
      undefined
    );
    const res = await this.client().get('/openapi/tingwu/v2/tasks', {
      headers,
      params: { region: this.DEFAULT_REGION, TaskId: taskId },
    });
    const payload = res.data as ({ Data?: TingwuTaskStatus } & TingwuTaskStatus) | undefined;
    const data = payload?.Data ?? payload;
    if (!data?.TaskId) {
      throw new Error(`通义听悟 GetTaskInfo returned no task: ${JSON.stringify(res.data)}`);
    }
    return data;
  }

  /**
   * Parse the embedded TranscribeResult JSON string into a structured object.
   */
  static parseTranscription(status: TingwuTaskStatus): TingwuTranscriptionResult {
    if (!status.TranscribeResult) {
      throw new Error('通义听悟 task is COMPLETED but TranscribeResult is empty.');
    }
    try {
      return JSON.parse(status.TranscribeResult) as TingwuTranscriptionResult;
    } catch (err) {
      throw new Error(`Failed to parse 通义听悟 TranscribeResult JSON: ${(err as Error).message}`);
    }
  }
}

/** RFC 3986 encoding helper (more strict than encodeURIComponent). */
function encodeRFC3986(s: string): string {
  return encodeURIComponent(s).replace(
    /[!'()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

/** Trim trailing/leading whitespace and collapse inner newlines for signing. */
function trim(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}
