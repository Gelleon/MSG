import { Module, forwardRef } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { ChatModule } from '../chat/chat.module';
import { InvitationsModule } from '../invitations/invitations.module';

@Module({
  imports: [forwardRef(() => ChatModule), InvitationsModule],
  providers: [RoomsService],
  controllers: [RoomsController],
  exports: [RoomsService],
})
export class RoomsModule {}
