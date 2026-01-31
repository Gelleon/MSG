import { TranscriptionService } from './transcription.service';
export declare class TranscriptionController {
    private readonly transcriptionService;
    constructor(transcriptionService: TranscriptionService);
    transcribe(filename: string): Promise<{
        text: string;
    }>;
}
