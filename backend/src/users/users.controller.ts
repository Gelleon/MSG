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
  Delete
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('ADMIN')
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search: string = '',
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'desc',
    @Request() req: any
  ) {
    this.logger.log(`Admin ${req.user.userId} viewing user list`);
    
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    
    const where: Prisma.UserWhereInput = search ? {
      OR: [
        { email: { contains: search } },
        { name: { contains: search } }
      ]
    } : {};

    const orderBy = { [sortBy]: sortOrder };

    return this.usersService.findAll({ skip, take, where, orderBy });
  }

  @Post()
  @Roles('ADMIN')
  async create(@Body() createUserDto: Prisma.UserCreateInput, @Request() req: any) {
    this.logger.log(`Admin ${req.user.userId} creating new user ${createUserDto.email}`);
    
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
      ...data.map(user => fields.map(field => {
        const val = user[field as keyof typeof user];
        return val instanceof Date ? val.toISOString() : `"${val || ''}"`;
      }).join(','))
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
  async update(@Param('id') id: string, @Body() updateUserDto: Prisma.UserUpdateInput, @Request() req: any) {
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
    const idsToDelete = body.ids.filter(id => id !== req.user.userId);
    
    if (idsToDelete.length === 0) {
        throw new BadRequestException('Cannot delete only your own account');
    }

    this.logger.log(`Admin ${req.user.userId} deleting users ${idsToDelete.join(', ')}`);
    return this.usersService.deleteMany(idsToDelete);
  }
}
