import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Logger } from './Logger';
import { LoggingInterceptor } from './LoggingInterceptor';
import { ConfigurableModuleClass } from './LogModuleDefinition';

@Module({
    providers: [
        Logger,
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggingInterceptor,
        },
    ],
    exports: [Logger],
})
export class LogModule extends ConfigurableModuleClass {}
