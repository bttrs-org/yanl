"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const Logger_1 = require("./Logger");
const LoggingInterceptor_1 = require("./LoggingInterceptor");
const LogModuleDefinition_1 = require("./LogModuleDefinition");
let LogModule = class LogModule extends LogModuleDefinition_1.ConfigurableModuleClass {
};
LogModule = __decorate([
    (0, common_1.Module)({
        providers: [
            Logger_1.Logger,
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: LoggingInterceptor_1.LoggingInterceptor,
            },
        ],
        exports: [Logger_1.Logger],
    })
], LogModule);
exports.LogModule = LogModule;
