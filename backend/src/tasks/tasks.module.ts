import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { RoomsModule } from '../rooms/rooms.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [RoomsModule, ChatModule],
  providers: [TasksService],
})
export class TasksModule {}
