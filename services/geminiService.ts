import { GreetingConfig, StyleOption } from '../types';

// 重试工具函数
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}

// 文本生成 - 调用后端API
export const generateGreeting = async (config: GreetingConfig): Promise<string> => {
  return retryWithBackoff(async () => {
    const response = await fetch('/api/generate-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'API request failed');
    }

    const data = await response.json();
    return data.text;
  });
};

// 图片生成 - 调用后端API
export const generateCardImage = async (style: string): Promise<string> => {
  return retryWithBackoff(async () => {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ style })
    });

    if (!response.ok) {
      throw new Error('Image generation failed');
    }

    const data = await response.json();

    if (data.imageData) {
      // 将base64转换为Blob URL以减少内存占用
      const byteCharacters = atob(data.imageData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      return URL.createObjectURL(blob);
    }

    return '';
  });
};

// 语音生成 - 调用后端API
export const generateSpeech = async (text: string): Promise<string> => {
  try {
    const response = await fetch('/api/generate-speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      return '';
    }

    const data = await response.json();
    return data.audioData || '';
  } catch (error) {
    console.error('TTS Error:', error);
    return '';
  }
};
