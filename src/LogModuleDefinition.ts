import { ConfigurableModuleBuilder, LogLevel } from '@nestjs/common';

export interface LogModuleOptions {
    level: LogLevel;
    levels: Record<string, LogLevel>;
    file?: string;
    requestLogger?: boolean;
}

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } = new ConfigurableModuleBuilder<LogModuleOptions>()
    .setClassMethodName('forRoot').build();
