import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    this.createTransporter();
  }

  private createTransporter() {
    const host = this.configService.get<string>('SMTP_HOST') || 'smtp.ethereal.email';
    const port = this.configService.get<number>('SMTP_PORT') || 587;
    const user = this.configService.get<string>('SMTP_USER') || 'ethereal.user@ethereal.email'; // Default or from env
    const pass = this.configService.get<string>('SMTP_PASS') || 'ethereal.pass';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });
  }

  async sendUnreadNotification(
    to: string,
    unreadCount: number,
    lastSenderName: string,
    unsubscribeLink: string,
  ) {
    const subject = `У вас ${unreadCount} непрочитанных сообщений в MSG`;
    
    // HTML Template (Russian)
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">MSG</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #111827; margin-top: 0;">Привет!</h2>
          <p style="font-size: 16px; line-height: 1.5; color: #4B5563;">
            Мы заметили, что вы пропустили несколько важных сообщений.
          </p>
          
          <div style="background-color: #F3F4F6; border-left: 4px solid #4F46E5; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #1F2937;">
              Всего непрочитанных: <span style="color: #4F46E5;">${unreadCount}</span>
            </p>
            <p style="margin: 5px 0 0 0; color: #4B5563;">
              Последнее от: <strong>${lastSenderName}</strong>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/dashboard" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Перейти к сообщениям
            </a>
          </div>
        </div>
        
        <div style="background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #eee; font-size: 12px; color: #9CA3AF;">
          <p>Вы получили это письмо, так как включили уведомления в MSG.</p>
          <p>
            <a href="${unsubscribeLink}" style="color: #6B7280; text-decoration: underline;">Отписаться от уведомлений</a>
          </p>
        </div>
      </div>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: `"${this.configService.get('SMTP_FROM_NAME') || 'MSG App'}" <${this.configService.get('SMTP_FROM') || 'noreply@msg.app'}>`,
        to,
        subject,
        html,
      });
      
      this.logger.log(`Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error.stack);
      throw error;
    }
  }
}
