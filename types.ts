export enum StyleOption {
    Elegant = '古风典雅',
    Creative = '文采斐然',
    Colloquial = '通俗口语',
    Intimate = '亲密温馨'
}

export interface GreetingConfig {
    recipient: string;
    style: StyleOption;
    length: number;
    customText: string;
}

export interface GeneratedContent {
    text: string;
    imageUrl?: string;
    audioData?: string; // Base64 encoded audio
}
