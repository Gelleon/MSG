import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, BadRequestException } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('positions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() createPositionDto: CreatePositionDto) {
    return this.positionsService.create(createPositionDto);
  }

  @Get()
  // Accessible to all authenticated users
  findAll() {
    return this.positionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.positionsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updatePositionDto: UpdatePositionDto) {
    return this.positionsService.update(id, updatePositionDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.positionsService.remove(id);
  }

  @Post(':id/assign')
  @Roles('ADMIN')
  async assignToUsers(@Param('id') id: string, @Body() body: { userIds: string[] }) {
    if (!body.userIds || !Array.isArray(body.userIds) || body.userIds.length === 0) {
      throw new BadRequestException('userIds must be a non-empty array');
    }
    return this.positionsService.assignToUsers(id, body.userIds);
  }

  @Post('unassign')
  @Roles('ADMIN')
  async unassignFromUsers(@Body() body: { userIds: string[] }) {
    if (!body.userIds || !Array.isArray(body.userIds) || body.userIds.length === 0) {
      throw new BadRequestException('userIds must be a non-empty array');
    }
    return this.positionsService.unassignFromUsers(body.userIds);
  }
}
