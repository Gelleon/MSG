import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);
  // Recovery period in milliseconds (e.g., 24 hours)
  private readonly RECOVERY_PERIOD = 24 * 60 * 60 * 1000;

  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCleanup() {
    this.logger.debug('Running cleanup task...');

    const cutoffDate = new Date(Date.now() - this.RECOVERY_PERIOD);

    try {
      // Find messages that are soft-deleted and older than the recovery period
      const messagesToDelete = await this.prisma.message.findMany({
        where: {
          deletedAt: {
            lt: cutoffDate,
          },
        },
      });

      if (messagesToDelete.length === 0) {
        return;
      }

      this.logger.log(`Found ${messagesToDelete.length} messages to permanently delete.`);

      for (const message of messagesToDelete) {
        try {
          // Delete associated file if it exists
          if (message.attachmentUrl) {
            // Check if any other message uses this file
            const otherUsageCount = await this.prisma.message.count({
              where: {
                attachmentUrl: message.attachmentUrl,
                id: { not: message.id },
              },
            });

            if (otherUsageCount === 0) {
              this.logger.log(`Deleting file for message ${message.id}: ${message.attachmentUrl}`);
              await this.filesService.deleteFile(message.attachmentUrl);
            } else {
              this.logger.log(
                `Skipping file deletion for message ${message.id} because it is used by ${otherUsageCount} other messages.`,
              );
            }
          }

          // Permanently delete the message from the database
          await this.prisma.message.delete({
            where: { id: message.id },
          });

          this.logger.log(`Permanently deleted message ${message.id}`);
        } catch (error) {
          this.logger.error(`Error processing cleanup for message ${message.id}`, error);
        }
      }
    } catch (error) {
      this.logger.error('Error during cleanup task', error);
    }
  }
}
