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
exports.RoomsController = void 0;
const common_1 = require("@nestjs/common");
const rooms_service_1 = require("./rooms.service");
const client_1 = require("@prisma/client");
const passport_1 = require("@nestjs/passport");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
let RoomsController = class RoomsController {
    roomsService;
    constructor(roomsService) {
        this.roomsService = roomsService;
    }
    async create(createRoomDto) {
        try {
            console.log('Creating room:', createRoomDto);
            return await this.roomsService.create(createRoomDto);
        }
        catch (error) {
            console.error('Error creating room:', error);
            throw new common_1.HttpException(error.message || 'Failed to create room', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    findAll(projectId, req) {
        return this.roomsService.findAll(projectId, req.user);
    }
    findOne(id, req) {
        return this.roomsService.findOne(id, req.user);
    }
    async markAsRead(id, req) {
        const userId = req.user.userId || req.user.sub;
        await this.roomsService.markAsRead(id, userId);
        return { success: true };
    }
    async joinRoom(id, userId, req) {
        try {
            const uid = userId || req.user?.userId || req.user?.sub;
            if (!uid) {
                throw new common_1.HttpException('User ID not found in request', common_1.HttpStatus.BAD_REQUEST);
            }
            console.log(`JoinRoom request: Room ${id}, User ${uid}`);
            return await this.roomsService.addUser(id, uid);
        }
        catch (e) {
            console.error('Join room error:', e);
            throw new common_1.HttpException(e.message || 'Failed to join room', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async addMembers(id, userIds) {
        try {
            if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
                throw new common_1.HttpException('No user IDs provided', common_1.HttpStatus.BAD_REQUEST);
            }
            return await this.roomsService.addUsers(id, userIds);
        }
        catch (e) {
            console.error('Add members error:', e);
            throw new common_1.HttpException(e.message || 'Failed to add members', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getMembers(id, page = '1', limit = '20', search = '') {
        return this.roomsService.getMembers(id, {
            page: Number(page),
            limit: Number(limit),
            search
        });
    }
    async update(id, updateRoomDto) {
        try {
            return await this.roomsService.update(id, updateRoomDto);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to update room', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    remove(id) {
        return this.roomsService.remove(id);
    }
    async removeMember(roomId, userId, reason, req) {
        try {
            const adminId = req.user.userId || req.user.sub;
            return await this.roomsService.removeMember(roomId, userId, adminId, reason);
        }
        catch (e) {
            throw new common_1.HttpException(e.message || 'Failed to remove member', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getRoomLogs(roomId, page = '1', limit = '20') {
        return this.roomsService.getRoomLogs(roomId, Number(page), Number(limit));
    }
};
exports.RoomsController = RoomsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('projectId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RoomsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RoomsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/read'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Post)(':id/join'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('userId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "joinRoom", null);
__decorate([
    (0, common_1.Post)(':id/members'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('userIds')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "addMembers", null);
__decorate([
    (0, common_1.Get)(':id/members'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RoomsController.prototype, "remove", null);
__decorate([
    (0, common_1.Delete)(':id/members/:userId'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Query)('reason')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Get)(':id/logs'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "getRoomLogs", null);
exports.RoomsController = RoomsController = __decorate([
    (0, common_1.Controller)('rooms'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [rooms_service_1.RoomsService])
], RoomsController);
//# sourceMappingURL=rooms.controller.js.map