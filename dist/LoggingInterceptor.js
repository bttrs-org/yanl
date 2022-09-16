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
var LoggingInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const async_hooks_1 = require("async_hooks");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const sequence_generator_1 = require("sequence-generator");
const LogModuleDefinition_1 = require("./LogModuleDefinition");
let LoggingInterceptor = LoggingInterceptor_1 = class LoggingInterceptor {
    constructor(config) {
        this.rnd = new sequence_generator_1.Generator({ prefix: '0', minChars: 2 });
        this.log = new common_1.Logger('REQUEST');
        this.enabled = !!config.requestLogger;
    }
    intercept(context, next) {
        if (!this.enabled) {
            return next.handle();
        }
        const startTime = Date.now();
        return new rxjs_1.Observable((subscribe) => {
            LoggingInterceptor_1.REQUEST_ID.run(this.rnd.generate(), () => {
                next.handle()
                    .pipe((0, operators_1.tap)(() => {
                    const http = context.switchToHttp();
                    const req = http.getRequest();
                    const res = http.getResponse();
                    this.log.verbose(`${req.method}: ${req.path}?${JSON.stringify(req.query)} -> ${res.statusCode} in ${Date.now() - startTime}ms`);
                }))
                    .subscribe({
                    next: (result) => {
                        subscribe.next(result);
                        subscribe.complete();
                    },
                    error: (err) => {
                        subscribe.error(err);
                    },
                });
            });
        });
    }
};
LoggingInterceptor.REQUEST_ID = new async_hooks_1.AsyncLocalStorage();
LoggingInterceptor = LoggingInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(LogModuleDefinition_1.MODULE_OPTIONS_TOKEN)),
    __metadata("design:paramtypes", [Object])
], LoggingInterceptor);
exports.LoggingInterceptor = LoggingInterceptor;
