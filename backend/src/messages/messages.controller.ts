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
  findAll(@Param('roomId') roomId: string, @Request() req: any) {
    return this.messagesService.findAll(roomId, req.user);
  }

  @Post(':id/translate')
  async translate(@Param('id') id: string, @Body('targetLang') targetLang: string) {
    const translatedText = await this.messagesService.translateMessage(id, targetLang);
    return { translatedText };
  }
}
