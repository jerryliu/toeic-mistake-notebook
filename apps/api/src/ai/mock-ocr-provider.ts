import { Injectable } from '@nestjs/common';
import { OcrInput, OcrProvider, OcrResult } from './ocr-provider.interface';

/**
 * Offline OCR stub. Real provider (e.g. Google Vision) can replace via OCR_API_KEY.
 */
@Injectable()
export class MockOcrProvider implements OcrProvider {
  async extractText(input: OcrInput): Promise<OcrResult> {
    return {
      text: [
        '[Mock OCR]',
        'The committee has decided that the proposal ------ reviewed carefully.',
        '(A) be',
        '(B) is',
        '(C) being',
        '(D) to be',
        `source: ${input.imagePath}`,
      ].join('\n'),
      confidence: 0.35,
      provider: 'mock',
    };
  }
}
