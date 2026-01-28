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
exports.RoomsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const chat_gateway_1 = require("../chat/chat.gateway");
let RoomsService = class RoomsService {
    prisma;
    chatGateway;
    constructor(prisma, chatGateway) {
        this.prisma = prisma;
        this.chatGateway = chatGateway;
    }
    async create(data) {
        return this.prisma.room.create({
            data,
        });
    }
    async findAll(projectId, user) {
        const where = projectId ? { projectId } : {};
        if (user && user.role === 'CLIENT') {
            where.members = {
                some: {
                    userId: user.userId,
                },
            };
        }
        const rooms = await this.prisma.room.findMany({
            where,
            include: {
                members: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        const roomsWithCounts = await Promise.all(rooms.map(async (room) => {
            let unreadCount = 0;
            if (user) {
                const member = room.members.find((m) => m.userId === user.userId);
                if (member) {
                    unreadCount = await this.prisma.message.count({
                        where: {
                            roomId: room.id,
                            createdAt: { gt: member.lastReadAt },
                        },
                    });
                }
            }
            return {
                ...room,
                users: room.members.map((m) => m.user),
                unreadCount,
            };
        }));
        return roomsWithCounts;
    }
    async markAsRead(roomId, userId) {
        const member = await this.prisma.roomMember.findUnique({
            where: {
                userId_roomId: {
                    userId,
                    roomId,
                },
            },
        });
        if (member) {
            await this.prisma.roomMember.update({
                where: {
                    id: member.id,
                },
                data: {
                    lastReadAt: new Date(),
                },
            });
        }
    }
    async findOne(id, user) {
        const room = await this.prisma.room.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        if (!room)
            return null;
        let messageWhere = { roomId: id };
        if (user && user.role === 'CLIENT') {
            const membership = room.members.find((m) => m.userId === user.userId);
            if (membership) {
                messageWhere.createdAt = {
                    gte: membership.joinedAt,
                };
            }
        }
        const messages = await this.prisma.message.findMany({
            where: messageWhere,
            include: { sender: true },
            orderBy: { createdAt: 'asc' },
        });
        return {
            ...room,
            users: room.members.map((m) => m.user),
            messages,
        };
    }
    async addUser(roomId, userId) {
        const room = await this.prisma.room.findUnique({
            where: { id: roomId },
            include: { members: true },
        });
        if (!room) {
            throw new Error('Room not found');
        }
        const isUserInRoom = room.members.some((member) => member.userId === userId);
        if (!isUserInRoom) {
            await this.prisma.roomMember.create({
                data: {
                    roomId,
                    userId,
                },
            });
        }
        return this.findOne(roomId);
    }
    async addUsers(roomId, userIds) {
        const room = await this.prisma.room.findUnique({
            where: { id: roomId },
            include: { members: true },
        });
        if (!room) {
            throw new Error('Room not found');
        }
        const newMembers = userIds.filter(userId => !room.members.some(member => member.userId === userId));
        if (newMembers.length > 0) {
            await this.prisma.roomMember.createMany({
                data: newMembers.map(userId => ({
                    roomId,
                    userId,
                })),
            });
        }
        return this.findOne(roomId);
    }
    async update(id, data) {
        return this.prisma.room.update({
            where: { id },
            data,
        });
    }
    async remove(id) {
        return this.prisma.room.delete({
            where: { id },
        });
    }
    async removeMember(roomId, userId, adminId, reason) {
        const member = await this.prisma.roomMember.findUnique({
            where: {
                userId_roomId: {
                    userId,
                    roomId,
                },
            },
            include: { user: true },
        });
        if (!member) {
            throw new Error('Member not found in room');
        }
        await this.prisma.roomMember.delete({
            where: {
                id: member.id,
            },
        });
        await this.prisma.actionLog.create({
            data: {
                action: 'REMOVE_USER',
                details: reason || 'No reason provided',
                adminId,
                targetId: userId,
                roomId,
            },
        });
        this.chatGateway.server.to(roomId).emit('userRemoved', {
            userId,
            userName: member.user.name,
            reason,
            roomId,
        });
        return member.user;
    }
    async getMembers(roomId, params) {
        const { page, limit, search } = params;
        const skip = (page - 1) * limit;
        const where = {
            roomId,
            user: search ? {
                OR: [
                    { name: { contains: search } },
                    { email: { contains: search } }
                ]
            } : undefined
        };
        const [total, members] = await Promise.all([
            this.prisma.roomMember.count({ where }),
            this.prisma.roomMember.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        }
                    }
                },
                orderBy: { joinedAt: 'desc' }
            })
        ]);
        return {
            data: members.map(m => ({
                ...m.user,
                joinedAt: m.joinedAt,
                status: 'offline'
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }
    async getRoomLogs(roomId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.actionLog.findMany({
                where: { roomId },
                include: {
                    admin: { select: { id: true, name: true, email: true } },
                    target: { select: { id: true, name: true, email: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.actionLog.count({ where: { roomId } }),
        ]);
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
};
exports.RoomsService = RoomsService;
exports.RoomsService = RoomsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => chat_gateway_1.ChatGateway))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        chat_gateway_1.ChatGateway])
], RoomsService);
//# sourceMappingURL=rooms.service.js.map