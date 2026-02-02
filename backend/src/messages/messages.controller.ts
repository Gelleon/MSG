import { Controller, Get, Post, Body, Param, UseGuards, Query, Request } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { Prisma } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';

@Controller('messages')
@UseGuards(AuthGuard('jwt'))
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  create(@Body() createMessageDto: Prisma.MessageUncheckedCreateInput) {
    return this.messagesService.create(createMessageDto);
  }

  @Get('room/:roomId')
  async findAll(@Param('roomId') roomId: string, @Request() req: any) {
    try {
      return await this.messagesService.findAll(roomId, req.user);
    } catch (error) {
      console.error(`[MessagesController] Error fetching messages for room ${roomId}:`, error);
      throw error;
    }
  }

  @Post(':id/translate')
  async translate(@Param('id') id: string, @Body('targetLang') targetLang: string) {
    const translatedText = await this.messagesService.translateMessage(id, targetLang);
    return { translatedText };
  }
}
