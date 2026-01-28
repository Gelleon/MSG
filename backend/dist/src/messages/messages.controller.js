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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesController = void 0;
const common_1 = require("@nestjs/common");
const messages_service_1 = require("./messages.service");
const client_1 = require("@prisma/client");
const passport_1 = require("@nestjs/passport");
let MessagesController = class MessagesController {
    messagesService;
    constructor(messagesService) {
        this.messagesService = messagesService;
    }
    create(createMessageDto) {
        return this.messagesService.create(createMessageDto);
    }
    findAll(roomId, req) {
        return this.messagesService.findAll(roomId, req.user);
    }
    async translate(id, targetLang) {
        const translatedText = await this.messagesService.translateMessage(id, targetLang);
        return { translatedText };
    }
};
exports.MessagesController = MessagesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('room/:roomId'),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(':id/translate'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('targetLang')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "translate", null);
exports.MessagesController = MessagesController = __decorate([
    (0, common_1.Controller)('messages'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [messages_service_1.MessagesService])
], MessagesController);
//# sourceMappingURL=messages.controller.js.map