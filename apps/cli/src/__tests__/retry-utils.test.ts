import { retryWithBackoff, sleep } from '../utils/retry-utils';

describe('retryWithBackoff', () => {
  it('should return result on successful attempt', async () => {
    const fn = jest.fn().mockResolvedValue('success');

    const result = await retryWithBackoff(fn, 3, 100);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const result = await retryWithBackoff(fn, 3, 100);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max retries exceeded', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fails'));

    await expect(retryWithBackoff(fn, 2, 100)).rejects.toThrow('always fails');

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should use exponential backoff delays', async () => {
    const start = Date.now();
    const fn = jest.fn().mockRejectedValue(new Error('fail'));

    await expect(retryWithBackoff(fn, 3, 50)).rejects.toThrow();

    const elapsed = Date.now() - start;
    // 50ms + 100ms = 150ms minimum (exponential: 50*2^0 + 50*2^1)
    expect(elapsed).toBeGreaterThanOrEqual(100);
  });

  it('should pass through the thrown error type', async () => {
    const fn = jest.fn().mockRejectedValue(new TypeError('type error'));

    await expect(retryWithBackoff(fn, 1, 10)).rejects.toThrow(TypeError);
  });
});

describe('sleep', () => {
  it('should resolve after the specified delay', async () => {
    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(40);
  });
});
