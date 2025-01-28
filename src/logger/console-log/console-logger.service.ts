import { injectable } from 'inversify'
import { ILogger } from '../logger.interface'

@injectable()
export class ConsoleLoggerService implements ILogger {
  public logger: Console

  constructor() {
    this.logger = console
  }

  info(...args: unknown[]): void {
    this.logger.log(...args)
  }

  warn(...args: unknown[]): void {
    this.logger.warn(...args)
  }

  error(...args: unknown[]): void {
    this.logger.error(...args)
  }
}
