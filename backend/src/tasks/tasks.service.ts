import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RoomsService } from '../rooms/rooms.service';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private roomsService: RoomsService,
    private chatGateway: ChatGateway,
  ) {}

  // Check every hour
  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    this.logger.debug('Checking for inactive private sessions...');
    
    // Threshold: 1 hour of inactivity
    // Adjust this value as needed (e.g., 24 hours: 24 * 60 * 60 * 1000)
    const threshold = new Date(Date.now() - 60 * 60 * 1000);
    
    try {
      const inactiveRooms = await this.roomsService.findInactivePrivateRooms(threshold);
      
      if (inactiveRooms.length > 0) {
        this.logger.log(`Found ${inactiveRooms.length} inactive private rooms. Closing...`);
        
        for (const room of inactiveRooms) {
          try {
            // Notify participants
            // Accessing the server instance directly to emit events
            this.chatGateway.server.to(room.id).emit('privateSessionClosed', { roomId: room.id });
            
            // Close and delete room
            // Pass undefined for adminId to indicate system action
            await this.roomsService.closePrivateSession(room.id);
            
            this.logger.log(`Closed inactive private session: ${room.id} (${room.name})`);
          } catch (err) {
            this.logger.error(`Failed to close room ${room.id}`, err);
          }
        }
      } else {
        this.logger.debug('No inactive private sessions found.');
      }
    } catch (error) {
      this.logger.error('Error in cleanup task', error);
    }
  }
}
