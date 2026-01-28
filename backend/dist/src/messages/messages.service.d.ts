import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Message } from '@prisma/client';
import { TranslationService } from '../translation/translation.service';
export declare class MessagesService {
    private prisma;
    private translationService;
    constructor(prisma: PrismaService, translationService: TranslationService);
    create(data: Prisma.MessageUncheckedCreateInput): Promise<Message>;
    findAll(roomId: string, user?: any): Promise<Message[]>;
    translateMessage(messageId: string, targetLang: string): Promise<string>;
    delete(messageId: string, userId: string): Promise<Message>;
}
