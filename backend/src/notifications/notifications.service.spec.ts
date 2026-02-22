import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prismaService: PrismaService;
  let emailService: EmailService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $queryRaw: jest.fn(),
    message: {
      findFirst: jest.fn(),
    },
  };

  const mockEmailService = {
    sendUnreadNotification: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key) => {
      if (key === 'FRONTEND_URL') return 'http://localhost:3000';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkUnreadMessages', () => {
    it('should not send email if no users enabled notifications', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      
      await service.checkUnreadMessages();

      expect(mockPrismaService.user.findMany).toHaveBeenCalled();
      expect(mockPrismaService.$queryRaw).not.toHaveBeenCalled();
      expect(mockEmailService.sendUnreadNotification).not.toHaveBeenCalled();
    });

    it('should send email to user with unread messages', async () => {
      const mockUser = { id: 'user1', email: 'test@example.com', emailNotificationsEnabled: true, lastNotificationSentAt: null };
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);
      
      // Mock unread count query result
      mockPrismaService.$queryRaw.mockResolvedValue([{ unreadCount: 5 }]);
      
      // Mock last message query
      mockPrismaService.message.findFirst.mockResolvedValue({
        sender: { name: 'Sender Name' },
      });

      await service.checkUnreadMessages();

      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
      expect(mockPrismaService.message.findFirst).toHaveBeenCalled();
      expect(mockEmailService.sendUnreadNotification).toHaveBeenCalledWith(
        'test@example.com',
        5,
        'Sender Name',
        expect.stringContaining('/profile?tab=notifications')
      );
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: { lastNotificationSentAt: expect.any(Date) },
      });
    });

    it('should not send email if unread count is 0', async () => {
      const mockUser = { id: 'user1', email: 'test@example.com', emailNotificationsEnabled: true };
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);
      
      // Mock unread count query result
      mockPrismaService.$queryRaw.mockResolvedValue([{ unreadCount: 0 }]);

      await service.checkUnreadMessages();

      expect(mockEmailService.sendUnreadNotification).not.toHaveBeenCalled();
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const mockUser = { id: 'user1', email: 'test@example.com', emailNotificationsEnabled: true };
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('DB Error'));

      await expect(service.checkUnreadMessages()).resolves.not.toThrow();
      expect(mockEmailService.sendUnreadNotification).not.toHaveBeenCalled();
    });
  });
});
