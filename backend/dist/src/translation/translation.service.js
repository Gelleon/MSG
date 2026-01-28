"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let TranslationService = class TranslationService {
    apiKey = process.env.OPENAI_API_KEY;
    async translateText(text, targetLang = 'en') {
        if (!this.apiKey) {
            console.warn('OPENAI_API_KEY is not set. Returning mock translation.');
            return `[Translated to ${targetLang}] ${text}`;
        }
        try {
            const response = await axios_1.default.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: `You are a translator. Translate the following text to ${targetLang}. Only return the translated text.` },
                    { role: 'user', content: text },
                ],
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
            });
            return response.data.choices[0].message.content.trim();
        }
        catch (error) {
            console.error('Translation failed', error);
            return text;
        }
    }
    async translateAuto(text) {
        if (!this.apiKey) {
            console.warn('OPENAI_API_KEY is not set. Returning mock translation.');
            const isRussian = /[а-яА-Я]/.test(text);
            const isChinese = /[\u4e00-\u9fa5]/.test(text);
            if (isRussian)
                return { lang: 'zh', text: `[ZH] ${text}` };
            if (isChinese)
                return { lang: 'ru', text: `[RU] ${text}` };
            return null;
        }
        try {
            const response = await axios_1.default.post('https://api.openai.com/v1/chat/completions', {
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
              If no translation is needed, return { "lang": null, "text": null }.`
                    },
                    { role: 'user', content: text },
                ],
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
            });
            const content = response.data.choices[0].message.content.trim();
            try {
                const jsonContent = content.replace(/^```json\s*|\s*```$/g, '');
                const result = JSON.parse(jsonContent);
                if (result.lang && result.text) {
                    return result;
                }
                return null;
            }
            catch (e) {
                console.error('Failed to parse OpenAI response', content);
                return null;
            }
        }
        catch (error) {
            console.error('Auto-translation failed', error);
            return null;
        }
    }
};
exports.TranslationService = TranslationService;
exports.TranslationService = TranslationService = __decorate([
    (0, common_1.Injectable)()
], TranslationService);
//# sourceMappingURL=translation.service.js.map