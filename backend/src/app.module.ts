import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { RoomsModule } from './rooms/rooms.module';
import { MessagesModule } from './messages/messages.module';
import { ChatModule } from './chat/chat.module';
import { FilesModule } from './files/files.module';
import { InvitationsModule } from './invitations/invitations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    AuthModule,
    PrismaModule,
    ProjectsModule,
    RoomsModule,
    MessagesModule,
    ChatModule,
    FilesModule,
    InvitationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
