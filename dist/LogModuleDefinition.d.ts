import { LogLevel } from '@nestjs/common';
export interface LogModuleOptions {
    level: LogLevel;
    levels: Record<string, LogLevel>;
    file?: string;
    requestLogger?: boolean;
}
export declare const ConfigurableModuleClass: import("@nestjs/common").ConfigurableModuleCls<LogModuleOptions, "forRoot", "create", {}>, MODULE_OPTIONS_TOKEN: string | symbol;
