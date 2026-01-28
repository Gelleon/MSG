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
exports.InvitationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_1 = require("crypto");
let InvitationsService = class InvitationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(roomId, userId, role) {
        const allowedRoles = ['MANAGER', 'CLIENT'];
        if (!allowedRoles.includes(role)) {
            throw new common_1.BadRequestException('Invalid role');
        }
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
        }
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        return this.prisma.invitation.create({
            data: {
                token,
                roomId,
                role,
                creatorId: userId,
                expiresAt,
            },
        });
    }
    async validateAndAccept(token, userId) {
        const invitation = await this.prisma.invitation.findUnique({
            where: { token },
            include: { room: true },
        });
        if (!invitation) {
            throw new common_1.NotFoundException('Invitation not found');
        }
        if (invitation.isUsed) {
            throw new common_1.BadRequestException('Invitation already used');
        }
        if (new Date() > invitation.expiresAt) {
            throw new common_1.BadRequestException('Invitation expired');
        }
        await this.prisma.$transaction([
            this.prisma.invitation.update({
                where: { id: invitation.id },
                data: { isUsed: true },
            }),
            this.prisma.roomMember.create({
                data: {
                    roomId: invitation.roomId,
                    userId: userId,
                },
            }),
            this.prisma.user.update({
                where: { id: userId },
                data: { role: invitation.role },
            }),
        ]);
        return { success: true, roomId: invitation.roomId };
    }
    async getInvitation(token) {
        return this.prisma.invitation.findUnique({
            where: { token },
            include: {
                room: {
                    select: { name: true }
                },
                creator: {
                    select: { name: true }
                }
            }
        });
    }
};
exports.InvitationsService = InvitationsService;
exports.InvitationsService = InvitationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InvitationsService);
//# sourceMappingURL=invitations.service.js.map