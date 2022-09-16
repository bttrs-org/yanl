import { LoggerService, OnModuleDestroy } from '@nestjs/common';
import { LogModuleOptions } from './LogModuleDefinition';
export declare class Logger implements LoggerService, OnModuleDestroy {
    private readonly enabledLevels;
    private readonly contextLevels;
    private fileStream;
    private failedStreamCounter;
    constructor(config: LogModuleOptions);
    private createStream;
    onModuleDestroy(): void;
    verbose(message: any, ...optionalParams: any[]): void;
    debug(message: any, ...optionalParams: any[]): void;
    log(message: any, ...optionalParams: any[]): void;
    warn(message: any, ...optionalParams: any[]): void;
    error(message: any, ...optionalParams: any[]): void;
    private isLevelEnabled;
    private writeLog;
    private ensureArgsContext;
    private parseArgs;
    private formatMessage;
    private print;
    private printFile;
    private createString;
}
