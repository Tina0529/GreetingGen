import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateGreeting, generateCardImage, generateSpeech } from '../../services/geminiService';
import { GreetingConfig, StyleOption } from '../../types';

// Mock fetch
global.fetch = vi.fn();

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateGreeting', () => {
    it('calls API correctly with config', async () => {
      const config: GreetingConfig = {
        recipient: '家人',
        style: StyleOption.Elegant,
        length: 60,
        customText: ''
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: '测试祝福语' })
      } as Response);

      const result = await generateGreeting(config);
      expect(result).toBe('测试祝福语');
      expect(fetch).toHaveBeenCalledWith(
        '/api/generate-text',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"recipient":"家人"')
        })
      );
    });

    it('retries on failure', async () => {
      const config: GreetingConfig = {
        recipient: '朋友',
        style: StyleOption.Creative,
        length: 80,
        customText: '新年快乐'
      };

      vi.mocked(fetch)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ text: '重试成功' })
        } as Response);

      const result = await generateGreeting(config);
      expect(result).toBe('重试成功');
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('throws error after max retries', async () => {
      const config: GreetingConfig = {
        recipient: '同事',
        style: StyleOption.Colloquial,
        length: 50,
        customText: ''
      };

      vi.mocked(fetch).mockRejectedValue(new Error('Persistent error'));

      await expect(generateGreeting(config)).rejects.toThrow('Persistent error');
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('generateCardImage', () => {
    it('calls API correctly and returns blob URL', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          imageData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        })
      } as Response);

      const result = await generateCardImage(StyleOption.Elegant);
      expect(result).toMatch(/^blob:/);
      expect(typeof result).toBe('string');
    });

    it('returns empty string on API failure', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false
      } as Response);

      const result = await generateCardImage(StyleOption.Creative);
      expect(result).toBe('');
    });
  });

  describe('generateSpeech', () => {
    it('calls API correctly and returns audio data', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ audioData: 'base64-audio-data' })
      } as Response);

      const result = await generateSpeech('测试文本');
      expect(result).toBe('base64-audio-data');
    });

    it('returns empty string on API failure', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false
      } as Response);

      const result = await generateSpeech('测试文本');
      expect(result).toBe('');
    });

    it('returns empty string on network error', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const result = await generateSpeech('测试文本');
      expect(result).toBe('');
    });
  });
});
