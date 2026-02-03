
import { Test, TestingModule } from '@nestjs/testing';
import { CleanupService } from './cleanup.service';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';

describe('CleanupService', () => {
  let service: CleanupService;
  let prismaService: PrismaService;
  let filesService: FilesService;

  const mockPrismaService = {
    message: {
      findMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockFilesService = {
    deleteFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CleanupService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: FilesService,
          useValue: mockFilesService,
        },
      ],
    }).compile();

    service = module.get<CleanupService>(CleanupService);
    prismaService = module.get<PrismaService>(PrismaService);
    filesService = module.get<FilesService>(FilesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleCleanup', () => {
    it('should find soft-deleted messages older than recovery period', async () => {
      mockPrismaService.message.findMany.mockResolvedValue([]);

      await service.handleCleanup();

      expect(mockPrismaService.message.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: {
            lt: expect.any(Date),
          },
        },
      });
    });

    it('should delete files and permanently delete messages', async () => {
      const messages = [
        { id: 'msg1', attachmentUrl: '/uploads/file1.jpg' },
        { id: 'msg2', attachmentUrl: null },
      ];
      mockPrismaService.message.findMany.mockResolvedValue(messages);
      mockPrismaService.message.count.mockResolvedValue(0); // No other messages use the file

      await service.handleCleanup();

      // Check file deletion
      expect(filesService.deleteFile).toHaveBeenCalledTimes(1);
      expect(filesService.deleteFile).toHaveBeenCalledWith('/uploads/file1.jpg');

      // Check message deletion
      expect(mockPrismaService.message.delete).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.message.delete).toHaveBeenCalledWith({ where: { id: 'msg1' } });
      expect(mockPrismaService.message.delete).toHaveBeenCalledWith({ where: { id: 'msg2' } });
    });

    it('should NOT delete file if it is used by other messages', async () => {
      const messages = [
        { id: 'msg1', attachmentUrl: '/uploads/shared-file.jpg' },
      ];
      mockPrismaService.message.findMany.mockResolvedValue(messages);
      mockPrismaService.message.count.mockResolvedValue(1); // 1 other message uses the file

      await service.handleCleanup();

      // Check file deletion - should NOT be called
      expect(filesService.deleteFile).not.toHaveBeenCalled();

      // Check message deletion - should still be called
      expect(mockPrismaService.message.delete).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.message.delete).toHaveBeenCalledWith({ where: { id: 'msg1' } });
    });

    it('should handle errors during file deletion gracefully', async () => {
      const messages = [{ id: 'msg1', attachmentUrl: '/uploads/file1.jpg' }];
      mockPrismaService.message.findMany.mockResolvedValue(messages);
      mockPrismaService.message.count.mockResolvedValue(0);
      mockFilesService.deleteFile.mockRejectedValue(new Error('File not found'));

      await service.handleCleanup();
      
      expect(filesService.deleteFile).toHaveBeenCalledWith('/uploads/file1.jpg');
      expect(mockPrismaService.message.delete).not.toHaveBeenCalled();
    });
  });
});
