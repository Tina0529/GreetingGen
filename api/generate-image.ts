import { GoogleGenAI } from '@google/genai';
import { StyleOption } from '../types';

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return Response.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

  try {
    const { style } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // Detailed prompts for high-end textures and specific Horse Year visuals
    let styleDetails = '';
    switch (style) {
      case StyleOption.Elegant: // 古风典雅
        styleDetails = 'Traditional Chinese Ink wash painting masterpiece, majestic galloping horse with flowing golden mane, serene landscapes, plum blossoms, elegant, muted luxury, textured rice paper background.';
        break;
      case StyleOption.Creative: // 文采斐然
        styleDetails = 'Abstract artistic composition, gold foil calligraphy strokes forming a galloping horse silhouette, splashing red ink, premium textured paper, cinematic lighting, sophisticated and modern chinoiserie.';
        break;
      case StyleOption.Intimate: // 亲密温馨
        styleDetails = 'Warm cozy illustration, cute stylized horse character with red ribbon, soft bokeh lighting, warm home interior, fuzzy felt texture, pastel reds and warm yellows, adorable and heartwarming.';
        break;
      case StyleOption.Colloquial: // 通俗口语
      default:
        styleDetails = 'Vibrant 3D render, glossy red and gold cute horse mascot galloping dynamically, falling gold coins, firecrackers, festive energy, high saturation, 8k resolution, commercial poster quality.';
        break;
    }

    const visualPrompt = `
    Chinese New Year 2026 Year of the Horse Greeting Card Background.
    Visual Style: ${styleDetails}
    Composition: Flat lay or centered background, negative space in the center reserved for text overlay.
    Quality: 8k resolution, highly detailed, photorealistic textures, award-winning visual art, breathtaking, amazing lighting.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: visualPrompt }]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return Response.json({
          imageData: part.inlineData.data
        });
      }
    }

    return Response.json({ error: 'No image generated' }, { status: 500 });
  } catch (error) {
    console.error('Image Gen Error:', error);
    return Response.json(
      { error: 'Image generation failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
