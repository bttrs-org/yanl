import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as chalk from 'chalk';
import { last } from 'lodash';
import { Inject, Injectable, LoggerService, LogLevel, OnModuleDestroy } from '@nestjs/common';
import { stripAnsi } from './ansi';
import { LogModuleOptions, MODULE_OPTIONS_TOKEN } from './LogModuleDefinition';

interface Message {
    ctx: string;
    msg: string;
    stack?: string;
}

const LEVEL_MAP: Record<string, LogLevel> = {
    trace: 'verbose',
    debug: 'debug',
    info: 'log',
    warn: 'warn',
    error: 'error',
};

const LEVEL_MATRIX: Record<LogLevel, Record<LogLevel, boolean>> = {
    verbose: { verbose: true, debug: true, log: true, warn: true, error: true },
    debug: { verbose: false, debug: true, log: true, warn: true, error: true },
    log: { verbose: false, debug: false, log: true, warn: true, error: true },
    warn: { verbose: false, debug: false, log: false, warn: true, error: true },
    error: { verbose: false, debug: false, log: false, warn: false, error: true },
};

const LEVEL_LABEL_MAP: Record<LogLevel, string> = {
    verbose: 'TRACE',
    debug: 'DEBUG',
    log: 'INFO ',
    warn: 'WARN ',
    error: 'ERROR',
};

const LEVEL_COLOR_LABEL_MAP: Record<LogLevel, string> = {
    verbose: chalk.green('TRACE'),
    debug: chalk.green('DEBUG'),
    log: chalk.green('INFO '),
    warn: chalk.yellow('WARN '),
    error: chalk.red('ERROR'),
};

@Injectable()
export class Logger implements LoggerService, OnModuleDestroy {

    private readonly enabledLevels: Record<LogLevel, boolean>;
    private readonly contextLevels: Record<string, Record<LogLevel, boolean>>;
    private fileStream: fs.WriteStream | undefined;
    private failedStreamCounter = 0;

    constructor(@Inject(MODULE_OPTIONS_TOKEN) config: LogModuleOptions) {
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

    private createStream(file: string) {
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

    verbose(message: any, ...optionalParams: any[]): void {
        const args = [message, ...optionalParams];
        this.writeLog(args, 'verbose', 'stdout');
    }

    debug(message: any, ...optionalParams: any[]): void {
        const args = [message, ...optionalParams];
        this.writeLog(args, 'debug', 'stdout');
    }

    log(message: any, ...optionalParams: any[]): void {
        const args = [message, ...optionalParams];
        this.writeLog(args, 'log', 'stdout');
    }

    warn(message: any, ...optionalParams: any[]): void {
        const args = [message, ...optionalParams];
        this.writeLog(args, 'warn', 'stdout');
    }

    error(message: any, ...optionalParams: any[]): void {
        const args = [message, ...optionalParams];
        this.writeLog(args, 'error', 'stderr');
    }

    private isLevelEnabled(level: LogLevel, ctx: string): boolean {
        const enabledLevels = this.contextLevels[ctx] ?? this.enabledLevels;
        return enabledLevels[level];
    }

    private writeLog(args: any[], level: LogLevel, streamType: 'stdout' | 'stderr') {
        this.ensureArgsContext(args);
        if (!this.isLevelEnabled(level, last(args))) {
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

    private ensureArgsContext(args: any[]): void {
        if (!args.length) {
            args.push('');
        }
        // fake context
        if (args.length === 1) {
            args.push('APP');
        }
    }

    private parseArgs(args: any[]): Message {
        const ctx = args.pop();

        if (ctx === 'ExceptionsHandler') {
            return {
                ctx,
                msg: args[0],
                stack: last(args) + os.EOL + os.EOL,
            };
        }

        let error: Error | undefined;
        if (last(args) instanceof Error) {
            error = args.pop();
        }

        let msgTpl: any;
        let stack: string | undefined;
        if (args.length) {
            msgTpl = stripAnsi(args.shift());
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

    private formatMessage(message: Message, logLevel: LogLevel, color: boolean): string {
        const date = (new Date()).toISOString();
        const level = color ? LEVEL_COLOR_LABEL_MAP[logLevel] : LEVEL_LABEL_MAP[logLevel];
        const pid = process.pid;
        const ctx = color ? chalk.cyan(message.ctx) : message.ctx;
        const msg = message.msg;

        return `${date} ${level} [${pid}] ${ctx} : ${msg}${os.EOL}`;
    }

    private print(str: string, streamType: 'stdout' | 'stderr') {
        if (str) {
            process[streamType ?? 'stdout'].write(str);
        }
    }

    private printFile(str: string): void {
        if (this.fileStream) {
            this.fileStream.write(str);
        }
    }

    private createString(arg: any): string {
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
}
