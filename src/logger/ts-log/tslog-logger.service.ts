import { injectable } from 'inversify'
import { Logger } from 'tslog'
import { ILogger } from '../logger.interface'
import 'reflect-metadata'

@injectable()
export class TslogLoggerService<T> implements ILogger {
  public logger: Logger<T>

  constructor() {
    this.logger = new Logger({
      prettyLogTemplate: '[{{logLevelName}}]: ',
    })
  }

  info(...args: unknown[]): void {
    this.logger.info(...args)
  }

  warn(...args: unknown[]): void {
    this.logger.warn(...args)
  }

  error(...args: unknown[]): void {
    this.logger.error(...args)
  }
}
