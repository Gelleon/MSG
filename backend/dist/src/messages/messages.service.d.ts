import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Message } from '@prisma/client';
import { TranslationService } from '../translation/translation.service';
import { FilesService } from '../files/files.service';
export declare class MessagesService {
    private prisma;
    private translationService;
    private filesService;
    constructor(prisma: PrismaService, translationService: TranslationService, filesService: FilesService);
    create(data: Prisma.MessageUncheckedCreateInput): Promise<Message>;
    findAll(roomId: string, user?: any): Promise<Message[]>;
    translateMessage(messageId: string, targetLang: string): Promise<string>;
    delete(messageId: string, userId: string): Promise<Message>;
}
