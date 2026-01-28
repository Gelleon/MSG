import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Prisma } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('projects')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Request() req: any, @Body() createProjectDto: Prisma.ProjectCreateInput) {
    // Override ownerId with logged in user
    createProjectDto.owner = { connect: { id: req.user.userId } };
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: Prisma.ProjectUpdateInput) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
