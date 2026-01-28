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
var UsersController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
let UsersController = UsersController_1 = class UsersController {
    usersService;
    logger = new common_1.Logger(UsersController_1.name);
    constructor(usersService) {
        this.usersService = usersService;
    }
    async findAll(page = '1', limit = '10', search = '', sortBy = 'createdAt', sortOrder = 'desc', req) {
        this.logger.log(`Admin ${req.user.userId} viewing user list`);
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const where = search ? {
            OR: [
                { email: { contains: search } },
                { name: { contains: search } }
            ]
        } : {};
        const orderBy = { [sortBy]: sortOrder };
        return this.usersService.findAll({ skip, take, where, orderBy });
    }
    async create(createUserDto, req) {
        this.logger.log(`Admin ${req.user.userId} creating new user ${createUserDto.email}`);
        const existingUser = await this.usersService.findOne(createUserDto.email);
        if (existingUser) {
            throw new common_1.BadRequestException('User with this email already exists');
        }
        if (!createUserDto.password || createUserDto.password.length < 6) {
            throw new common_1.BadRequestException('Password must be at least 6 characters');
        }
        return this.usersService.createUser(createUserDto);
    }
    async exportUsers(res, req) {
        this.logger.log(`Admin ${req.user.userId} exporting user list`);
        const { data } = await this.usersService.findAll();
        const fields = ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt'];
        const csv = [
            fields.join(','),
            ...data.map(user => fields.map(field => {
                const val = user[field];
                return val instanceof Date ? val.toISOString() : `"${val || ''}"`;
            }).join(','))
        ].join('\n');
        res.send(csv);
    }
    getProfile(req) {
        return req.user;
    }
    async findOne(id) {
        return this.usersService.findById(id);
    }
    async update(id, updateUserDto, req) {
        if (req.user.userId !== id && req.user.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('You can only update your own profile');
        }
        if (updateUserDto.role && req.user.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('You cannot update your own role');
        }
        if (req.user.role === 'ADMIN') {
            this.logger.log(`Admin ${req.user.userId} updating user ${id}`);
        }
        return this.usersService.update(id, updateUserDto);
    }
    async remove(id, req) {
        if (req.user.userId === id) {
            throw new common_1.BadRequestException('You cannot delete your own account');
        }
        this.logger.log(`Admin ${req.user.userId} deleting user ${id}`);
        return this.usersService.delete(id);
    }
    async removeMany(body, req) {
        if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
            throw new common_1.BadRequestException('No user IDs provided');
        }
        const idsToDelete = body.ids.filter(id => id !== req.user.userId);
        if (idsToDelete.length === 0) {
            throw new common_1.BadRequestException('Cannot delete only your own account');
        }
        this.logger.log(`Admin ${req.user.userId} deleting users ${idsToDelete.join(', ')}`);
        return this.usersService.deleteMany(idsToDelete);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('sortBy')),
    __param(4, (0, common_1.Query)('sortOrder')),
    __param(5, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Header)('Content-Type', 'text/csv'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename="users.csv"'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "exportUsers", null);
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "remove", null);
__decorate([
    (0, common_1.Delete)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "removeMany", null);
exports.UsersController = UsersController = UsersController_1 = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map