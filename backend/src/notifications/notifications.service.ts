import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async checkUnreadMessages() {
    this.logger.log('Starting unread messages check...');
    
    const users = await this.prisma.user.findMany({
      where: {
        emailNotificationsEnabled: true,
        email: { not: undefined }, // Ensure email exists
      },
    });

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';

    for (const user of users) {
      try {
        const lastNotificationAt = user.lastNotificationSentAt || new Date(0);
        
        // Find unread messages count using raw query for performance and complexity handling
        // We want messages that are:
        // 1. In rooms the user is a member of
        // 2. Created AFTER the user's last read time for that room
        // 3. Created BEFORE 1 hour ago (older than 1 hour)
        // 4. Created AFTER the last notification was sent (to avoid repeat notifications)
        // 5. NOT sent by the user themselves
        
        const result = await this.prisma.$queryRaw<[{ unreadCount: number | bigint }]>`
          SELECT COUNT(m.id) as unreadCount
          FROM "Message" m
          JOIN "RoomMember" rm ON m.roomId = rm.roomId
          WHERE rm.userId = ${user.id}
          AND m.createdAt > rm.lastReadAt
          AND m.createdAt < ${oneHourAgo}
          AND m.createdAt > ${lastNotificationAt}
          AND m.senderId != ${user.id}
        `;

        // Handle BigInt result from count
        const unreadCount = Number(result[0]?.unreadCount || 0);

        if (unreadCount > 0) {
          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(user.email)) {
            this.logger.warn(`Skipping notification for invalid email: ${user.email}`);
            continue;
          }

          // Get the last sender name
          const lastMessage = await this.prisma.message.findFirst({
            where: {
              room: {
                members: {
                  some: {
                    userId: user.id,
                  },
                },
              },
              createdAt: {
                gt: lastNotificationAt, // Optimization: only look at recent enough messages
                lt: oneHourAgo,
              },
              senderId: {
                not: user.id,
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            include: {
              sender: true,
            },
          });

          const lastSenderName = lastMessage?.sender?.name || lastMessage?.sender?.email || 'Unknown';
          const unsubscribeLink = `${frontendUrl}/profile?tab=notifications`; // Assuming profile page has settings

          await this.emailService.sendUnreadNotification(
            user.email,
            unreadCount,
            lastSenderName,
            unsubscribeLink,
          );

          // Update lastNotificationSentAt
          await this.prisma.user.update({
            where: { id: user.id },
            data: { lastNotificationSentAt: new Date() },
          });
          
          this.logger.log(`Notification sent to ${user.email} for ${unreadCount} messages.`);
        }
      } catch (error) {
        this.logger.error(`Failed to process notifications for user ${user.id}`, error.stack);
      }
    }
    
    this.logger.log('Unread messages check completed.');
  }
}
