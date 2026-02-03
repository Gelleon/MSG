import { Test, TestingModule } from '@nestjs/testing';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

describe('MessagesController', () => {
  let controller: MessagesController;
  let service: MessagesService;

  const mockMessagesService = {
    findAll: jest.fn(),
    create: jest.fn(),
    translateMessage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [{ provide: MessagesService, useValue: mockMessagesService }],
    }).compile();

    controller = module.get<MessagesController>(MessagesController);
    service = module.get<MessagesService>(MessagesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll with roomId and user', async () => {
      const roomId = 'room-1';
      const user = { userId: 'user-1' };
      const req = { user };
      const result = [{ id: 'msg-1' }];

      mockMessagesService.findAll.mockResolvedValue(result);

      expect(await controller.findAll(roomId, req)).toBe(result);
      expect(service.findAll).toHaveBeenCalledWith(roomId, user);
    });

    it('should throw error if service fails', async () => {
      const roomId = 'room-1';
      const req = { user: { userId: 'user-1' } };
      const error = new Error('Service error');

      mockMessagesService.findAll.mockRejectedValue(error);

      await expect(controller.findAll(roomId, req)).rejects.toThrow(error);
    });
  });
});
