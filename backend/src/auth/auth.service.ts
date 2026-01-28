import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
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
    const payload = { username: user.email, sub: user.id, role: user.role, name: user.name };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(data: Prisma.UserCreateInput) {
    // Check if user exists
    const existingUser = await this.usersService.findOne(data.email);
    if (existingUser) {
        throw new UnauthorizedException('User already exists');
    }
    
    // Prevent role injection: Force role to CLIENT
    // Destructure role out if it exists, or just overwrite it
    const { role, ...userData } = data;
    
    const user = await this.usersService.createUser({
        ...userData,
        role: 'CLIENT' // Enforce CLIENT role
    });
    
    const { password, ...result } = user;
    return result;
  }
}
