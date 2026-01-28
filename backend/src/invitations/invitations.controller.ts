import { Controller, Post, Body, Param, UseGuards, Request, Get, NotFoundException } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('create')
  async create(@Request() req: any, @Body() body: { roomId: string; role: string }) {
    return this.invitationsService.create(body.roomId, req.user.userId, body.role);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('accept')
  async accept(@Request() req: any, @Body() body: { token: string }) {
    return this.invitationsService.validateAndAccept(body.token, req.user.userId);
  }

  @Get(':token')
  async getInvitation(@Param('token') token: string) {
      const invitation = await this.invitationsService.getInvitation(token);
      if (!invitation) throw new NotFoundException('Invitation not found');
      return invitation;
  }
}
