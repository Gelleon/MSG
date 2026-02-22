import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      username: user.email,
      sub: user.id,
      role: user.role,
      name: user.name,
      phone: user.phone,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(data: Prisma.UserCreateInput) {
    this.logger.log(`Attempting to register user with email: ${data.email}`);

    try {
      // Check if user exists
      const existingUser = await this.usersService.findOne(data.email);
      if (existingUser) {
        this.logger.warn(
          `Registration failed: User with email ${data.email} already exists`,
        );
        throw new BadRequestException('User with this email already exists');
      }

      // Prevent role injection and strip unknown fields (like username)
      // Explicitly map only known fields to avoid Prisma "Unknown argument" error
      const { email, password, name } = data;

      this.logger.debug(`Creating user with: email=${email}, name=${name}`);

      const user = await this.usersService.createUser({
        email,
        password,
        name,
        role: 'CLIENT', // Enforce CLIENT role
      });

      this.logger.log(`User registered successfully: ${user.id}`);
      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      this.logger.error(
        `Registration error for email ${data.email}: ${error.message}`,
        error.stack,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Registration failed. Please check your input and try again.',
      );
    }
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findOne(email);
    if (!user) {
      // Don't reveal if user exists
      return {
        message:
          'If a user with this email exists, a password reset link has been sent.',
      };
    }

    const token =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hour

    await this.usersService.setResetToken(email, token, expires);

    // Mock Email Sending - In production this would use a mailer service
    console.log(
      `[MOCK EMAIL] Password reset link for ${email}: http://localhost:3000/reset-password?token=${token}`,
    );

    // Return token for debugging purposes since we don't have real email
    return {
      message:
        'If a user with this email exists, a password reset link has been sent.',
      debug_token: token,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findByResetToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    await this.usersService.update(user.id, {
      password: newPassword,
      resetToken: null,
      resetTokenExpires: null,
    });

    return { message: 'Password has been reset successfully' };
  }
}
