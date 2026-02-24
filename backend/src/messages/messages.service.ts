import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Message } from '@prisma/client';
import { TranslationService } from '../translation/translation.service';
import { FilesService } from '../files/files.service';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private translationService: TranslationService,
    private filesService: FilesService,
  ) {}

  async create(data: Prisma.MessageUncheckedCreateInput): Promise<Message> {
    // Auto-translate before saving
    if (data.content) {
      try {
        const translation = await this.translationService.translateAuto(
          data.content,
        );
        if (translation) {
          data.translations = JSON.stringify({
            [translation.lang]: translation.text,
          });
        }
      } catch (error) {
        console.error('Failed to auto-translate message', error);
      }
    }

    const message = await this.prisma.message.create({
      data,
      include: {
        sender: {
          include: {
            position: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              include: {
                position: true,
              },
            },
          },
        },
      },
    });

    // Log file upload action
    if (data.attachmentUrl) {
      try {
        await this.prisma.actionLog.create({
          data: {
            action: 'UPLOAD_FILE',
            details: data.attachmentName || 'File uploaded',
            adminId: data.senderId,
            roomId: data.roomId,
          },
        });
      } catch (error) {
        console.error('Failed to log file upload action', error);
      }
    }

    // Update room's updatedAt timestamp
    await this.prisma.room.update({
      where: { id: data.roomId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async findAll(
    roomId: string,
    user?: any,
    cursor?: string,
    limit: number = 50,
  ): Promise<Message[]> {
    console.log(
      `[MessagesService.findAll] Fetching messages for room ${roomId}, user: ${user?.userId}, cursor: ${cursor}, limit: ${limit}`,
    );

    const where: Prisma.MessageWhereInput = { roomId, deletedAt: null };
    const allowedEmails = ['svzelenin@yandex.ru', 'pallermo72@gmail.com'];
    const userEmail = user?.email ? user.email.toLowerCase() : '';
    const isSuperAdmin = allowedEmails.includes(userEmail);

    console.log(
      `[MessagesService.findAll] isSuperAdmin: ${isSuperAdmin} (email: ${userEmail})`,
    );

    if (user && user.role === 'CLIENT' && !isSuperAdmin) {
      const membership = await this.prisma.roomMember.findUnique({
        where: {
          userId_roomId: {
            userId: user.userId,
            roomId,
          },
        },
      });

      console.log(
        `[MessagesService.findAll] Membership for CLIENT:`,
        membership,
      );

      // if (membership) {
      //   where.createdAt = {
      //     gte: membership.joinedAt,
      //   };
      // } else {
      //   console.log(
      //     `[MessagesService.findAll] CLIENT has no membership, returning empty array`,
      //   );
      //   return [];
      // }
    }

    let cursorMessage: Message | null = null;
    if (cursor) {
      cursorMessage = await this.prisma.message.findUnique({
        where: { id: cursor },
      });
    }

    if (cursor && !cursorMessage) {
      return [];
    }

    if (cursorMessage) {
      where.OR = [
        { createdAt: { lt: cursorMessage.createdAt } },
        {
          createdAt: cursorMessage.createdAt,
          id: { lt: cursorMessage.id },
        },
      ];
    }

    const messages = await this.prisma.message.findMany({
      where,
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        sender: {
          include: {
            position: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              include: {
                position: true,
              },
            },
          },
        },
      },
    });

    console.log(`[MessagesService.findAll] Found ${messages.length} messages`);
    return messages.reverse();
  }

  async findOne(id: string): Promise<Message | null> {
    return this.prisma.message.findUnique({
      where: { id },
      include: {
        sender: {
          include: {
            position: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              include: {
                position: true,
              },
            },
          },
        },
      },
    });
  }

  async translateMessage(
    messageId: string,
    targetLang: string,
  ): Promise<string> {
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

    const translatedText = await this.translationService.translateText(
      message.content,
      targetLang,
    );

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

    // Attempt to delete associated file if it exists
    // if (message.attachmentUrl) {
    //   await this.filesService.deleteFile(message.attachmentUrl);
    // }

    console.log(`[MessagesService.delete] Soft deleting message ${messageId} by user ${userId}`);

    return this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
      include: { sender: true },
    });
  }

  async update(messageId: string, userId: string, content: string): Promise<Message> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId) {
      throw new Error('Unauthorized');
    }

    // Create history entry with OLD content
    if (message.content) {
        await this.prisma.messageHistory.create({
        data: {
            messageId: message.id,
            content: message.content,
        },
        });
    }

    // Update message
    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
      },
      include: {
        sender: true,
        replyTo: {
          include: {
            sender: true,
          },
        },
      },
    });
  }

  async getHistory(messageId: string) {
     return this.prisma.messageHistory.findMany({
        where: { messageId },
        orderBy: { changedAt: 'desc' }
     });
  }
}
