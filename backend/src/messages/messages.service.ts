import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Message } from '@prisma/client';
import { TranslationService } from '../translation/translation.service';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private translationService: TranslationService,
  ) {}

  async create(data: Prisma.MessageUncheckedCreateInput): Promise<Message> {
    // Auto-translate before saving
    if (data.content) {
      try {
        const translation = await this.translationService.translateAuto(data.content);
        if (translation) {
          data.translations = JSON.stringify({ [translation.lang]: translation.text });
        }
      } catch (error) {
        console.error('Failed to auto-translate message', error);
      }
    }

    return this.prisma.message.create({
      data,
      include: {
        sender: true,
      },
    });
  }

  async findAll(roomId: string, user?: any): Promise<Message[]> {
    const where: Prisma.MessageWhereInput = { roomId };

    if (user && user.role === 'CLIENT') {
      const membership = await this.prisma.roomMember.findUnique({
        where: {
          userId_roomId: {
            userId: user.userId,
            roomId,
          },
        },
      });

      if (membership) {
        where.createdAt = {
          gte: membership.joinedAt,
        };
      } else {
        return [];
      }
    }

    return this.prisma.message.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        sender: true,
      },
    });
  }

  async translateMessage(messageId: string, targetLang: string): Promise<string> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    let translations: Record<string, string> = {};
    if (message.translations) {
        try {
            translations = JSON.parse(message.translations);
        } catch (e) {
            console.error('Failed to parse translations JSON', e);
        }
    }

    if (translations[targetLang]) {
        return translations[targetLang];
    }

    if (!message.content) {
        return '';
    }

    const translatedText = await this.translationService.translateText(message.content, targetLang);
    
    translations[targetLang] = translatedText;

    await this.prisma.message.update({
        where: { id: messageId },
        data: { translations: JSON.stringify(translations) },
    });

    return translatedText;
  }

  async delete(messageId: string, userId: string): Promise<Message> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId) {
      throw new Error('Unauthorized');
    }

    return this.prisma.message.delete({
      where: { id: messageId },
      include: { sender: true },
    });
  }
}
