"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
const common_1 = require("@nestjs/common");
const chat_gateway_1 = require("./chat.gateway");
const messages_module_1 = require("../messages/messages.module");
const rooms_module_1 = require("../rooms/rooms.module");
const auth_module_1 = require("../auth/auth.module");
const translation_module_1 = require("../translation/translation.module");
let ChatModule = class ChatModule {
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = __decorate([
    (0, common_1.Module)({
        imports: [messages_module_1.MessagesModule, (0, common_1.forwardRef)(() => rooms_module_1.RoomsModule), auth_module_1.AuthModule, translation_module_1.TranslationModule],
        providers: [chat_gateway_1.ChatGateway],
        exports: [chat_gateway_1.ChatGateway],
    })
], ChatModule);
//# sourceMappingURL=chat.module.js.map