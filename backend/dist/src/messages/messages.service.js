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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const translation_service_1 = require("../translation/translation.service");
let MessagesService = class MessagesService {
    prisma;
    translationService;
    constructor(prisma, translationService) {
        this.prisma = prisma;
        this.translationService = translationService;
    }
    async create(data) {
        if (data.content) {
            try {
                const translation = await this.translationService.translateAuto(data.content);
                if (translation) {
                    data.translations = JSON.stringify({ [translation.lang]: translation.text });
                }
            }
            catch (error) {
                console.error('Failed to auto-translate message', error);
            }
        }
        return this.prisma.message.create({
            data,
            include: {
                sender: true,
            },
        });
    }
    async findAll(roomId, user) {
        const where = { roomId };
        if (user && user.role === 'CLIENT') {
            const membership = await this.prisma.roomMember.findUnique({
                where: {
                    userId_roomId: {
                        userId: user.userId,
                        roomId,
                    },
                },
            });
            if (membership) {
                where.createdAt = {
                    gte: membership.joinedAt,
                };
            }
            else {
                return [];
            }
        }
        return this.prisma.message.findMany({
            where,
            orderBy: { createdAt: 'asc' },
            include: {
                sender: true,
            },
        });
    }
    async translateMessage(messageId, targetLang) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            throw new Error('Message not found');
        }
        let translations = {};
        if (message.translations) {
            try {
                translations = JSON.parse(message.translations);
            }
            catch (e) {
                console.error('Failed to parse translations JSON', e);
            }
        }
        if (translations[targetLang]) {
            return translations[targetLang];
        }
        if (!message.content) {
            return '';
        }
        const translatedText = await this.translationService.translateText(message.content, targetLang);
        translations[targetLang] = translatedText;
        await this.prisma.message.update({
            where: { id: messageId },
            data: { translations: JSON.stringify(translations) },
        });
        return translatedText;
    }
    async delete(messageId, userId) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            throw new Error('Message not found');
        }
        if (message.senderId !== userId) {
            throw new Error('Unauthorized');
        }
        return this.prisma.message.delete({
            where: { id: messageId },
            include: { sender: true },
        });
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        translation_service_1.TranslationService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map