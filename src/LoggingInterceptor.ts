import { CallHandler, ExecutionContext, Inject, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Generator } from 'sequence-generator';
import { LogModuleOptions, MODULE_OPTIONS_TOKEN } from './LogModuleDefinition';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {

    static readonly REQUEST_ID: AsyncLocalStorage<string> = new AsyncLocalStorage();
    private readonly enabled: boolean;
    private readonly rnd = new Generator({ prefix: '0', minChars: 2 });
    private readonly log = new Logger('REQUEST');

    constructor(@Inject(MODULE_OPTIONS_TOKEN) config: LogModuleOptions) {
        this.enabled = !!config.requestLogger;
    }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        if (!this.enabled) {
            return next.handle();
        }
        const startTime = Date.now();
        return new Observable((subscribe) => {
            LoggingInterceptor.REQUEST_ID.run(this.rnd.generate(), () => {
                next.handle()
                    .pipe(tap(() => {
                        const http = context.switchToHttp();
                        const req = http.getRequest<Request>();
                        const res = http.getResponse<Response>();
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
}
