import { PrismaService } from '../prisma/prisma.service';
export declare class InvitationsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(roomId: string, userId: string, role: string): Promise<{
        id: string;
        role: string;
        createdAt: Date;
        roomId: string;
        token: string;
        isUsed: boolean;
        expiresAt: Date;
        creatorId: string;
    }>;
    validateAndAccept(token: string, userId: string): Promise<{
        success: boolean;
        roomId: string;
    }>;
    getInvitation(token: string): Promise<({
        room: {
            name: string;
        };
        creator: {
            name: string | null;
        };
    } & {
        id: string;
        role: string;
        createdAt: Date;
        roomId: string;
        token: string;
        isUsed: boolean;
        expiresAt: Date;
        creatorId: string;
    }) | null>;
}
