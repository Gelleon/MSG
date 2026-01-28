import { InvitationsService } from './invitations.service';
export declare class InvitationsController {
    private readonly invitationsService;
    constructor(invitationsService: InvitationsService);
    create(req: any, body: {
        roomId: string;
        role: string;
    }): Promise<{
        id: string;
        role: string;
        createdAt: Date;
        roomId: string;
        token: string;
        isUsed: boolean;
        expiresAt: Date;
        creatorId: string;
    }>;
    accept(req: any, body: {
        token: string;
    }): Promise<{
        success: boolean;
        roomId: string;
    }>;
    getInvitation(token: string): Promise<{
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
    }>;
}
