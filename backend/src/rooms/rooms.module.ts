import { Module, forwardRef } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [forwardRef(() => ChatModule)],
  providers: [RoomsService],
  controllers: [RoomsController],
  exports: [RoomsService],
})
export class RoomsModule {}
