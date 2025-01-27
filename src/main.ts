#!/usr/bin/env node

import { Container, ContainerModule, interfaces } from 'inversify'
import { Application } from './application/application.class'
import { ILogger } from './logger/logger.interface'
import { DepNames } from './enum/dep-names'
import { TslogLoggerService } from './logger/ts-log/tslog-logger.service'
import { ILogObj } from 'tslog'

export const appBindings = new ContainerModule((bind: interfaces.Bind) => {
  bind<Application>(DepNames.Application).to(Application)
  bind<ILogger>(DepNames.Logger)
    .to(TslogLoggerService<ILogObj>)
    .inSingletonScope()
})

export const bootstrap = async (): Promise<void> => {
  const appContainer = new Container()
  appContainer.load(appBindings)
  const app = appContainer.get<Application>(DepNames.Application)
  await app.run()
}

bootstrap()
