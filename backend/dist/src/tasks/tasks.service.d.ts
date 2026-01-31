import { RoomsService } from '../rooms/rooms.service';
import { ChatGateway } from '../chat/chat.gateway';
export declare class TasksService {
    private roomsService;
    private chatGateway;
    private readonly logger;
    constructor(roomsService: RoomsService, chatGateway: ChatGateway);
    handleCron(): Promise<void>;
}
