"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TasksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const rooms_service_1 = require("../rooms/rooms.service");
const chat_gateway_1 = require("../chat/chat.gateway");
let TasksService = TasksService_1 = class TasksService {
    roomsService;
    chatGateway;
    logger = new common_1.Logger(TasksService_1.name);
    constructor(roomsService, chatGateway) {
        this.roomsService = roomsService;
        this.chatGateway = chatGateway;
    }
    async handleCron() {
        this.logger.debug('Checking for inactive private sessions...');
        const threshold = new Date(Date.now() - 60 * 60 * 1000);
        try {
            const inactiveRooms = await this.roomsService.findInactivePrivateRooms(threshold);
            if (inactiveRooms.length > 0) {
                this.logger.log(`Found ${inactiveRooms.length} inactive private rooms. Closing...`);
                for (const room of inactiveRooms) {
                    try {
                        this.chatGateway.server.to(room.id).emit('privateSessionClosed', { roomId: room.id });
                        await this.roomsService.closePrivateSession(room.id);
                        this.logger.log(`Closed inactive private session: ${room.id} (${room.name})`);
                    }
                    catch (err) {
                        this.logger.error(`Failed to close room ${room.id}`, err);
                    }
                }
            }
            else {
                this.logger.debug('No inactive private sessions found.');
            }
        }
        catch (error) {
            this.logger.error('Error in cleanup task', error);
        }
    }
};
exports.TasksService = TasksService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TasksService.prototype, "handleCron", null);
exports.TasksService = TasksService = TasksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rooms_service_1.RoomsService,
        chat_gateway_1.ChatGateway])
], TasksService);
//# sourceMappingURL=tasks.service.js.map