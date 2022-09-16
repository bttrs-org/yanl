/// <reference types="node" />
import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { Observable } from 'rxjs';
import { LogModuleOptions } from './LogModuleDefinition';
export declare class LoggingInterceptor implements NestInterceptor {
    static readonly REQUEST_ID: AsyncLocalStorage<string>;
    private readonly enabled;
    private readonly rnd;
    private readonly log;
    constructor(config: LogModuleOptions);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
