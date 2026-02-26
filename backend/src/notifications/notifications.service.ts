import { Injectable } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async sendEmail(to: string, subject: string, text: string) {
    if (this.configService.get('EMAIL_NOTIFICATIONS_ENABLED') === 'true') {
      return this.emailService.sendEmail(to, subject, text);
    }
  }

  async createNotification(userId: number, title: string, message: string) {
    // Logic to create in-app notification
    // For now, we might just log or send email if enabled
    console.log(`Notification for user ${userId}: ${title} - ${message}`);
  }
}
