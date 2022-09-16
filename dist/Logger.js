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
exports.Logger = void 0;
const os = require("os");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const lodash_1 = require("lodash");
const common_1 = require("@nestjs/common");
const ansi_1 = require("./ansi");
const LogModuleDefinition_1 = require("./LogModuleDefinition");
const LEVEL_MAP = {
    trace: 'verbose',
    debug: 'debug',
    info: 'log',
    warn: 'warn',
    error: 'error',
};
const LEVEL_MATRIX = {
    verbose: { verbose: true, debug: true, log: true, warn: true, error: true },
    debug: { verbose: false, debug: true, log: true, warn: true, error: true },
    log: { verbose: false, debug: false, log: true, warn: true, error: true },
    warn: { verbose: false, debug: false, log: false, warn: true, error: true },
    error: { verbose: false, debug: false, log: false, warn: false, error: true },
};
const LEVEL_LABEL_MAP = {
    verbose: 'TRACE',
    debug: 'DEBUG',
    log: 'INFO ',
    warn: 'WARN ',
    error: 'ERROR',
};
const LEVEL_COLOR_LABEL_MAP = {
    verbose: chalk.green('TRACE'),
    debug: chalk.green('DEBUG'),
    log: chalk.green('INFO '),
    warn: chalk.yellow('WARN '),
    error: chalk.red('ERROR'),
};
let Logger = class Logger {
    constructor(config) {
        this.failedStreamCounter = 0;
        const level = LEVEL_MAP[config?.level] || config?.level || 'warn';
        this.enabledLevels = LEVEL_MATRIX[level] || LEVEL_MATRIX['warn'];
        this.contextLevels = {};
        if (config?.levels && Object.keys(config.levels).length) {
            for (const ctx in config.levels) {
                const level = LEVEL_MAP[config.levels[ctx]] || config.levels[ctx] || 'warn';
                this.contextLevels[ctx] = LEVEL_MATRIX[level] || LEVEL_MATRIX['warn'];
            }
        }
        if (config?.file) {
            if (!fs.existsSync(config.file)) {
                fs.writeFileSync(config.file, '', { mode: 0o600, flag: 'w' });
            }
            this.createStream(path.resolve(process.cwd(), config.file));
        }
    }
    createStream(file) {
        if (this.failedStreamCounter > 10) {
            return;
        }
        this.failedStreamCounter++;
        const stream = fs.createWriteStream(path.resolve(process.cwd(), file), {
            flags: 'a',
        });
        stream.on('error', (err) => {
            if (err) {
                process.stderr.write(err.message + os.EOL + err.stack + os.EOL);
            }
            this.createStream(file);
        });
        this.fileStream = stream;
    }
    onModuleDestroy() {
        if (this.fileStream) {
            this.fileStream.close();
        }
    }
    verbose(message, ...optionalParams) {
        const args = [message, ...optionalParams];
        this.writeLog(args, 'verbose', 'stdout');
    }
    debug(message, ...optionalParams) {
        const args = [message, ...optionalParams];
        this.writeLog(args, 'debug', 'stdout');
    }
    log(message, ...optionalParams) {
        const args = [message, ...optionalParams];
        this.writeLog(args, 'log', 'stdout');
    }
    warn(message, ...optionalParams) {
        const args = [message, ...optionalParams];
        this.writeLog(args, 'warn', 'stdout');
    }
    error(message, ...optionalParams) {
        const args = [message, ...optionalParams];
        this.writeLog(args, 'error', 'stderr');
    }
    isLevelEnabled(level, ctx) {
        const enabledLevels = this.contextLevels[ctx] ?? this.enabledLevels;
        return enabledLevels[level];
    }
    writeLog(args, level, streamType) {
        this.ensureArgsContext(args);
        if (!this.isLevelEnabled(level, (0, lodash_1.last)(args))) {
            return;
        }
        const msg = this.parseArgs(args);
        this.print(this.formatMessage(msg, level, true), streamType);
        if (msg.stack) {
            this.print(msg.stack, streamType);
        }
        this.printFile(this.formatMessage(msg, level, false));
        if (msg.stack) {
            this.printFile(msg.stack);
        }
    }
    ensureArgsContext(args) {
        if (!args.length) {
            args.push('');
        }
        // fake context
        if (args.length === 1) {
            args.push('APP');
        }
    }
    parseArgs(args) {
        const ctx = args.pop();
        if (ctx === 'ExceptionsHandler') {
            return {
                ctx,
                msg: args[0],
                stack: (0, lodash_1.last)(args) + os.EOL + os.EOL,
            };
        }
        let error;
        if ((0, lodash_1.last)(args) instanceof Error) {
            error = args.pop();
        }
        let msgTpl;
        let stack;
        if (args.length) {
            msgTpl = (0, ansi_1.stripAnsi)(args.shift());
        }
        if (error) {
            stack = error.stack + os.EOL + os.EOL;
            if (!msgTpl) {
                msgTpl = error.message;
            }
        }
        const msg = args.reduce((result, arg, i) => result.replaceAll(`{${i}}`, this.createString(arg)), this.createString(msgTpl));
        return {
            ctx,
            msg,
            stack,
        };
    }
    formatMessage(message, logLevel, color) {
        const date = (new Date()).toISOString();
        const level = color ? LEVEL_COLOR_LABEL_MAP[logLevel] : LEVEL_LABEL_MAP[logLevel];
        const pid = process.pid;
        const ctx = color ? chalk.cyan(message.ctx) : message.ctx;
        const msg = message.msg;
        return `${date} ${level} [${pid}] ${ctx} : ${msg}${os.EOL}`;
    }
    print(str, streamType) {
        if (str) {
            process[streamType ?? 'stdout'].write(str);
        }
    }
    printFile(str) {
        if (this.fileStream) {
            this.fileStream.write(str);
        }
    }
    createString(arg) {
        if (arg === null || arg === undefined) {
            return `${arg}`;
        }
        switch (typeof arg) {
            case 'string':
                return arg;
            case 'boolean':
            case 'number':
            case 'bigint':
                return `${arg}`;
            case 'symbol':
                return arg.toString();
            case 'object':
                return JSON.stringify(arg);
            default:
                return '';
        }
    }
};
Logger = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(LogModuleDefinition_1.MODULE_OPTIONS_TOKEN)),
    __metadata("design:paramtypes", [Object])
], Logger);
exports.Logger = Logger;
