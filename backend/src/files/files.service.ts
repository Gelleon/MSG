import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly uploadDir = './uploads';

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract filename from URL (assuming /uploads/filename.ext format)
      const filename = fileUrl.split('/uploads/')[1];
      if (!filename) {
        this.logger.warn(`Invalid file URL format: ${fileUrl}`);
        return;
      }

      const filePath = path.join(process.cwd(), this.uploadDir, filename);

      // Check if file exists safely
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        this.logger.log(`Successfully deleted file: ${filePath}`);
      } else {
        this.logger.warn(`File not found for deletion: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Error deleting file ${fileUrl}:`, error);
      // We generally don't want to throw here to avoid blocking the DB deletion
      // unless strict consistency is required. For now, logging is sufficient.
    }
  }
}
