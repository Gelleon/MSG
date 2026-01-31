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
        resetToken: string | null;
        resetTokenExpires: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
        debug_token?: undefined;
    } | {
        message: string;
        debug_token: string;
    }>;
    resetPassword(body: {
        token: string;
        password: string;
    }): Promise<{
        message: string;
    }>;
    getProfile(req: any): any;
}
