import { GoogleGenAI } from '@google/genai';
import { GreetingConfig } from '../types';

export default async function handler(req: Request) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return Response.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

  try {
    const { config } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    let lengthDesc = '简短 (approx 20 words)';
    if (config.length > 50 && config.length <= 100) lengthDesc = '中等篇幅 (approx 60 words)';
    if (config.length > 100) lengthDesc = '长篇大论 (approx 120 words)';

    const prompt = `
    Task: Write a Chinese New Year (Year of the Horse 2026) greeting card message.
    Configuration:
    - Recipient: ${config.recipient}
    - Style: ${config.style}
    - Length Constraint: ${lengthDesc}
    - Context: ${config.customText || 'None'}
    Instructions: Output ONLY the greeting text in Chinese. No intro/outro. Ensure it mentions "Horse" or "Horse Year" (马年/骏马) auspiciously if appropriate for the style. Use horse-related auspicious phrases like 龙马精神, 马到成功, 万马奔腾 etc.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 0.8 }
    });

    const text = response.text?.trim() || '生成失败，请重试。';

    return Response.json({ text });
  } catch (error) {
    console.error('Text Gen Error:', error);
    return Response.json(
      { error: 'Generation failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
