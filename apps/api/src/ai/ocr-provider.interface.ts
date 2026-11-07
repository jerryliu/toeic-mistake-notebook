export interface OcrInput {
  imagePath: string;
  mimeType?: string;
}

export interface OcrResult {
  text: string;
  confidence: number;
  provider: string;
}

export interface OcrProvider {
  extractText(input: OcrInput): Promise<OcrResult>;
}

export const OCR_PROVIDER = Symbol('OCR_PROVIDER');
