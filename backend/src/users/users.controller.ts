import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  Query,
  Logger,
  BadRequestException,
  Res,
  Header,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  async searchUsers(@Query('search') search: string = '', @Request() req: any) {
    const currentUserId = req.user.userId || req.user.sub;

    const where: Prisma.UserWhereInput = {
      id: { not: currentUserId },
      ...(search
        ? {
            OR: [
              { email: { contains: search } },
              { name: { contains: search } },
            ],
          }
        : {}),
    };

    try {
      const users = await this.usersService.findAll({
        where,
        skip: 0,
        take: 50,
      });
      return users.data.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
      }));
    } catch (error) {
      this.logger.error(`Error searching users: ${error.message}`);
      throw new BadRequestException('Failed to search users');
    }
  }

  @Get()
  @UseGuards(SuperAdminGuard)
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search: string = '',
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'desc',
    @Request() req: any,
  ) {
    const adminEmail = req.user.email || req.user.username;
    this.logger.log(
      `SuperAdmin ${adminEmail} viewing user list with params: page=${page}, limit=${limit}, search=${search}`,
    );

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { email: { contains: search } }, // Case-insensitive handled by DB usually, or need mode: 'insensitive' for Postgres, but here likely SQLite/MySQL default
            { name: { contains: search } },
          ],
        }
      : {};

    const orderBy = { [sortBy]: sortOrder };

    try {
      const result = await this.usersService.findAll({
        skip,
        take,
        where,
        orderBy,
      });
      this.logger.log(
        `Found ${result.total} users. Returning ${result.data.length} records.`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Error fetching users: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch users');
    }
  }

  @Patch(':id/role')
  @UseGuards(SuperAdminGuard)
  async updateRole(
    @Param('id') id: string,
    @Body('role') role: string,
    @Request() req: any,
  ) {
    const allowedRoles = ['CLIENT', 'MANAGER', 'ADMIN'];
    if (!role || !allowedRoles.includes(role)) {
      throw new BadRequestException(
        `Invalid role. Allowed: ${allowedRoles.join(', ')}`,
      );
    }

    const adminEmail = req.user.email || req.user.username;
    this.logger.log(
      `SuperAdmin ${adminEmail} updating user ${id} role to ${role}`,
    );

    try {
      return await this.usersService.updateRole(
        id,
        role,
        req.user.userId || req.user.sub,
      );
    } catch (error) {
      this.logger.error(`Error updating role: ${error.message}`);
      throw error;
    }
  }

  @Post()
  @Roles('ADMIN')
  async create(
    @Body() createUserDto: Prisma.UserCreateInput,
    @Request() req: any,
  ) {
    this.logger.log(
      `Admin ${req.user.userId} creating new user ${createUserDto.email}`,
    );

    const existingUser = await this.usersService.findOne(createUserDto.email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Basic validation
    if (!createUserDto.password || createUserDto.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    return this.usersService.createUser(createUserDto);
  }

  @Get('export')
  @Roles('ADMIN')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="users.csv"')
  async exportUsers(@Res() res: any, @Request() req: any) {
    this.logger.log(`Admin ${req.user.userId} exporting user list`);

    // Fetch all users for export
    const { data } = await this.usersService.findAll();

    // Simple CSV generation
    const fields = ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt'];
    const csv = [
      fields.join(','),
      ...data.map((user) =>
        fields
          .map((field) => {
            const val = user[field as keyof typeof user];
            return val instanceof Date ? val.toISOString() : `"${val || ''}"`;
          })
          .join(','),
      ),
    ].join('\n');

    res.send(csv);
  }

  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    // Ideally filter sensitive info
    return this.usersService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: Prisma.UserUpdateInput,
    @Request() req: any,
  ) {
    // Check if user is updating themselves or is admin
    if (req.user.userId !== id && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Prevent non-admins from updating role
    if (updateUserDto.role && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('You cannot update your own role');
    }

    if (req.user.role === 'ADMIN') {
      this.logger.log(`Admin ${req.user.userId} updating user ${id}`);
    }

    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id') id: string, @Request() req: any) {
    if (req.user.userId === id) {
      throw new BadRequestException('You cannot delete your own account');
    }
    this.logger.log(`Admin ${req.user.userId} deleting user ${id}`);
    return this.usersService.delete(id);
  }

  @Delete()
  @Roles('ADMIN')
  async removeMany(@Body() body: { ids: string[] }, @Request() req: any) {
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      throw new BadRequestException('No user IDs provided');
    }

    // Filter out the current user's ID to prevent self-deletion
    const idsToDelete = body.ids.filter((id) => id !== req.user.userId);

    if (idsToDelete.length === 0) {
      throw new BadRequestException('Cannot delete only your own account');
    }

    this.logger.log(
      `Admin ${req.user.userId} deleting users ${idsToDelete.join(', ')}`,
    );
    return this.usersService.deleteMany(idsToDelete);
  }
}
