import { Controller, Get, Post, Body, Param, UseGuards, Query, Request, HttpException, HttpStatus, Patch, Delete } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { Prisma } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('rooms')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @Roles('ADMIN')
  async create(@Body() createRoomDto: Prisma.RoomUncheckedCreateInput, @Request() req: any) {
    try {
        console.log('Creating room:', createRoomDto);
        const userId = req.user?.userId || req.user?.sub;
        return await this.roomsService.create(createRoomDto, userId);
    } catch (error) {
        console.error('Error creating room:', error);
        // Pass the error message to the client
        throw new HttpException(error.message || 'Failed to create room', HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  findAll(@Query('projectId') projectId: string, @Request() req: any) {
    return this.roomsService.findAll(projectId, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.roomsService.findOne(id, req.user);
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.userId || req.user.sub;
    await this.roomsService.markAsRead(id, userId);
    return { success: true };
  }

  @Post(':id/join')
  async joinRoom(@Param('id') id: string, @Body('userId') userId: string, @Request() req: any) {
      try {
        const uid = userId || req.user?.userId || req.user?.sub;
        
        if (!uid) {
            throw new HttpException('User ID not found in request', HttpStatus.BAD_REQUEST);
        }

        console.log(`JoinRoom request: Room ${id}, User ${uid}`);
        return await this.roomsService.addUser(id, uid);
      } catch (e) {
        console.error('Join room error:', e);
        throw new HttpException(e.message || 'Failed to join room', HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }

  @Post(':id/members')
  @Roles('ADMIN')
  async addMembers(@Param('id') id: string, @Body('userIds') userIds: string[]) {
      try {
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            throw new HttpException('No user IDs provided', HttpStatus.BAD_REQUEST);
        }
        return await this.roomsService.addUsers(id, userIds);
      } catch (e) {
        console.error('Add members error:', e);
        throw new HttpException(e.message || 'Failed to add members', HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }

  @Get(':id/members')
  async getMembers(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search: string = ''
  ) {
    return this.roomsService.getMembers(id, {
      page: Number(page),
      limit: Number(limit),
      search
    });
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() updateRoomDto: Prisma.RoomUpdateInput) {
    try {
      return await this.roomsService.update(id, updateRoomDto);
    } catch (error) {
      throw new HttpException(error.message || 'Failed to update room', HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.roomsService.remove(id);
  }

  @Delete(':id/members/:userId')
  @Roles('ADMIN')
  async removeMember(
    @Param('id') roomId: string,
    @Param('userId') userId: string,
    @Query('reason') reason: string,
    @Request() req: any
  ) {
    try {
      const adminId = req.user.userId || req.user.sub;
      return await this.roomsService.removeMember(roomId, userId, adminId, reason);
    } catch (e) {
      throw new HttpException(e.message || 'Failed to remove member', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id/logs')
  @Roles('ADMIN')
  async getRoomLogs(
    @Param('id') roomId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.roomsService.getRoomLogs(roomId, Number(page), Number(limit));
  }
}
