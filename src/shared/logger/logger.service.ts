import { Injectable, Scope } from '@nestjs/common';
import { createLogger, Logger, transports } from 'winston';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger {
  private context?: string;
  private logger: Logger;

  public setContext(context: string): void {
    this.context = context;
  }

  constructor() {
    this.logger = createLogger({
      transports: [new transports.Console()],
    });
  }

  error(message: string, meta?: Record<string, any>): Logger {
    const timestamp = new Date().toISOString();

    return this.logger.error({
      message,
      contextName: this.context,
      timestamp,
      ...meta,
    });
  }

  warn(message: string, meta?: Record<string, any>): Logger {
    const timestamp = new Date().toISOString();

    return this.logger.warn({
      message,
      contextName: this.context,
      timestamp,
      ...meta,
    });
  }

  debug(message: string, meta?: Record<string, any>): Logger {
    const timestamp = new Date().toISOString();

    return this.logger.debug({
      message,
      contextName: this.context,
      timestamp,
      ...meta,
    });
  }

  verbose(message: string, meta?: Record<string, any>): Logger {
    const timestamp = new Date().toISOString();

    return this.logger.verbose({
      message,
      contextName: this.context,
      timestamp,
      ...meta,
    });
  }

  log(message: string, meta?: Record<string, any>): Logger {
    const timestamp = new Date().toISOString();

    return this.logger.info({
      message,
      contextName: this.context,
      timestamp,
      ...meta,
    });
  }
}
