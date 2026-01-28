export declare class TranslationService {
    private readonly apiKey;
    translateText(text: string, targetLang?: string): Promise<string>;
    translateAuto(text: string): Promise<{
        lang: string;
        text: string;
    } | null>;
}
