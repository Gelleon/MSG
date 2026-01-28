import { MessagesService } from './messages.service';
import { Prisma } from '@prisma/client';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    create(createMessageDto: Prisma.MessageUncheckedCreateInput): Promise<{
        id: string;
        createdAt: Date;
        roomId: string;
        content: string | null;
        translations: string | null;
        attachmentUrl: string | null;
        attachmentType: string | null;
        attachmentName: string | null;
        isPrivate: boolean;
        senderId: string;
    }>;
    findAll(roomId: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        roomId: string;
        content: string | null;
        translations: string | null;
        attachmentUrl: string | null;
        attachmentType: string | null;
        attachmentName: string | null;
        isPrivate: boolean;
        senderId: string;
    }[]>;
    translate(id: string, targetLang: string): Promise<{
        translatedText: string;
    }>;
}
