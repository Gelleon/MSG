import { AuthService } from './auth.service';
import { Prisma } from '@prisma/client';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(req: any): Promise<{
        access_token: string;
    }>;
    register(createUserDto: Prisma.UserCreateInput): Promise<{
        id: string;
        email: string;
        name: string | null;
        role: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getProfile(req: any): any;
}
