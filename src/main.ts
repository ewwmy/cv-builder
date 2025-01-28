#!/usr/bin/env node

import { Container, ContainerModule, interfaces } from 'inversify'
import { ApplicationService } from './application/application.service'
import { ILogger } from './logger/logger.interface'
import { DependencyTypes } from './types/dependency.types'
import { TslogLoggerService } from './logger/ts-log/tslog-logger.service'
import { ILogObj } from 'tslog'
import { AppConfigService } from './config/app-config.service'
import { MarkdownService } from './markdown/markdown.service'
import { FileService } from './files/file.service'
import { HandlebarsService } from './templates/handlebars.service'
import { PuppeteerService } from './output/puppeteer.service'
import { ITemplateService } from './templates/template.service.interface'
import { IPuppeteerPdfOutput } from './output/puppeteer-pdf-output.interface'
import { ArgumentsService } from './arguments/arguments.service'
import { JsonTransformerService } from './json-transformer/json-transformer.service'
import { ImageService } from './images/image.service'

export const appBindings = new ContainerModule((bind: interfaces.Bind) => {
  bind<ApplicationService>(DependencyTypes.Application)
    .to(ApplicationService)
    .inSingletonScope()
  bind<ILogger>(DependencyTypes.Logger)
    .to(TslogLoggerService<ILogObj>)
    .inSingletonScope()
  bind<AppConfigService>(DependencyTypes.Config)
    .to(AppConfigService)
    .inSingletonScope()
  bind<ArgumentsService>(DependencyTypes.Arguments)
    .to(ArgumentsService)
    .inSingletonScope()
  bind<MarkdownService>(DependencyTypes.Markdown)
    .to(MarkdownService)
    .inSingletonScope()
  bind<ITemplateService>(DependencyTypes.Template)
    .to(HandlebarsService)
    .inSingletonScope()
  bind<FileService>(DependencyTypes.File).to(FileService).inSingletonScope()
  bind<ImageService>(DependencyTypes.Image).to(ImageService).inSingletonScope()
  bind<IPuppeteerPdfOutput>(DependencyTypes.Output)
    .to(PuppeteerService)
    .inSingletonScope()
  bind<JsonTransformerService>(DependencyTypes.JsonTransformer)
    .to(JsonTransformerService)
    .inSingletonScope()
})

export const bootstrap = async (): Promise<void> => {
  try {
    const appContainer = new Container()
    appContainer.load(appBindings)
    const app = appContainer.get<ApplicationService>(
      DependencyTypes.Application,
    )
    await app.run()
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message)
    } else {
      console.error(error)
    }
  }
}

bootstrap()
