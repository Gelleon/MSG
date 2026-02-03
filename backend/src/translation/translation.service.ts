import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TranslationService {
  private readonly apiKey = process.env.OPENAI_API_KEY;

  async translateText(
    text: string,
    targetLang: string = 'en',
  ): Promise<string> {
    if (!this.apiKey) {
      console.warn('OPENAI_API_KEY is not set. Returning mock translation.');
      return `[Translated to ${targetLang}] ${text}`;
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a translator. Translate the following text to ${targetLang}. Only return the translated text.`,
            },
            { role: 'user', content: text },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Translation failed', error);
      return text; // Fallback to original
    }
  }

  async translateAuto(
    text: string,
  ): Promise<{ lang: string; text: string } | null> {
    if (!this.apiKey) {
      console.warn('OPENAI_API_KEY is not set. Returning mock translation.');
      // Mock logic for testing without API key
      const isRussian = /[а-яА-Я]/.test(text);
      const isChinese = /[\u4e00-\u9fa5]/.test(text);

      if (isRussian) return { lang: 'zh', text: `[ZH] ${text}` };
      if (isChinese) return { lang: 'ru', text: `[RU] ${text}` };
      return null;
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a translator helper.
              Detect the language of the input text.
              If it is Russian, translate it to Simplified Chinese.
              If it is Chinese (Simplified or Traditional), translate it to Russian.
              If it is neither, do not translate and return null.
              Return the response in strict JSON format: { "lang": "target_language_code", "text": "translated_text" }
              "lang" should be "zh" for Chinese or "ru" for Russian.
              If no translation is needed, return { "lang": null, "text": null }.`,
            },
            { role: 'user', content: text },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const content = response.data.choices[0].message.content.trim();
      try {
        // Remove markdown code blocks if present
        const jsonContent = content.replace(/^```json\s*|\s*```$/g, '');
        const result = JSON.parse(jsonContent);
        if (result.lang && result.text) {
          return result;
        }
        return null;
      } catch (e) {
        console.error('Failed to parse OpenAI response', content);
        return null;
      }
    } catch (error) {
      console.error('Auto-translation failed', error);
      return null;
    }
  }
}
