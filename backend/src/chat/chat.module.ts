import { Module, forwardRef } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { MessagesModule } from '../messages/messages.module';
import { RoomsModule } from '../rooms/rooms.module';
import { AuthModule } from '../auth/auth.module';
import { TranslationModule } from '../translation/translation.module';

@Module({
  imports: [MessagesModule, forwardRef(() => RoomsModule), AuthModule, TranslationModule],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
