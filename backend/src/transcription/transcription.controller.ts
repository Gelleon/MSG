import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { TranscriptionService } from './transcription.service';

@Controller('transcription')
export class TranscriptionController {
  constructor(private readonly transcriptionService: TranscriptionService) {}

  @Post('transcribe')
  async transcribe(@Body('filename') filename: string) {
    if (!filename) {
      throw new BadRequestException('Filename is required');
    }
    const text = await this.transcriptionService.transcribe(filename);
    return { text };
  }
}
