import { join } from 'node:path'
import fsx from 'fs-extra'
import { inject, injectable } from 'inversify'
import { JsonValue } from '../types/json.types'
import { DependencyTypes } from '../types/dependency.types'
import { ILogger } from '../logger/logger.interface'
import { AppConfigService } from '../config/app-config.service'
import { IHandlebarsService } from '../templates/handlebars.service.interface'
import { ArgumentsService } from '../arguments/arguments.service'
import { IPuppeteerPdfOutput } from '../output/puppeteer-pdf-output.interface'
import { JsonTransformerService } from '../json-transformer/json-transformer.service'
import { FileService } from '../files/file.service'

@injectable()
export class ApplicationService {
  public constructor(
    @inject(DependencyTypes.Logger) private logger: ILogger,
    @inject(DependencyTypes.Config) private config: AppConfigService,
    @inject(DependencyTypes.Template)
    private templateEngine: IHandlebarsService,
    @inject(DependencyTypes.Output) private output: IPuppeteerPdfOutput,
    @inject(DependencyTypes.Arguments) private args: ArgumentsService,
    @inject(DependencyTypes.JsonTransformer)
    private jsonTransformer: JsonTransformerService,
    @inject(DependencyTypes.File) private fileService: FileService,
  ) {}

  // check app dir
  protected async healthCheck(): Promise<void> {
    // restore everything if app dir doesn't exist
    if (!(await fsx.pathExists(this.config.get<string>('APP_DIR')))) {
      await this.restoreDefault()
    }
  }

  // restore default settings and examples
  protected async restoreDefault(force = false): Promise<void> {
    await fsx.ensureDir(this.config.get<string>('APP_DIR'))
    await fsx.ensureDir(this.config.get<string>('DEFAULT_OUTPUT_DIR'))

    // restore config
    if (
      !(await fsx.pathExists(this.config.get<string>('CONFIG_FILE_PATH'))) ||
      force
    ) {
      await fsx.ensureDir(this.config.get<string>('CONFIG_DIR'))
      await this.fileService.saveJsonSettings(
        this.config.get<string>('CONFIG_FILE_PATH'),
        this.config.getUserConfig(),
      )
    }

    // restore cv example
    if (
      !(await fsx.pathExists(
        this.config.get<string>('DEFAULT_CV_FILE_PATH'),
      )) ||
      force
    ) {
      await fsx.copy(
        this.config.get<string>('EXAMPLE_CV_FILE_PATH'),
        this.config.get<string>('DEFAULT_CV_FILE_PATH'),
      )
    }

    // restore icons
    if (
      !(await fsx.pathExists(this.config.get<string>('DEFAULT_ICONS_DIR'))) ||
      force
    ) {
      await fsx.copy(
        this.config.get<string>('EXAMPLE_ICONS_DIR'),
        this.config.get<string>('DEFAULT_ICONS_DIR'),
      )
    }

    // restore user photo examples
    if (
      !(await fsx.pathExists(this.config.get<string>('DEFAULT_IMAGES_DIR'))) ||
      force
    ) {
      await fsx.copy(
        this.config.get<string>('EXAMPLE_IMAGES_DIR'),
        this.config.get<string>('DEFAULT_IMAGES_DIR'),
      )
    }

    // restore template examples
    if (
      !(await fsx.pathExists(
        this.config.get<string>('DEFAULT_TEMPLATES_DIR'),
      )) ||
      force
    ) {
      await fsx.copy(
        this.config.get<string>('EXAMPLE_TEMPLATES_DIR'),
        this.config.get<string>('DEFAULT_TEMPLATES_DIR'),
      )
    }
  }

  // getting the json file data
  protected async getSourceData(filename: string): Promise<JsonValue> {
    return JSON.parse((await this.fileService.readFileData(filename)) ?? '{}')
  }

  public async run(): Promise<void> {
    // check the app directory
    await this.healthCheck()

    // load user config
    await this.config.loadFromFile()

    // load command line options
    const options = await this.args.getCommandLineOptions()

    // registering handlebars helpers
    this.templateEngine.registerHelpers()

    // restore default data if the option `restore` is set
    if (options.restore) {
      await this.restoreDefault(options.force)
      this.logger.info('Restored' + (options.force ? ' (force)' : ''))
      process.exit(0)
    }

    // load cv json file data
    const cvData = await this.getSourceData(options.input)
    if (!cvData) return

    // process icons and images
    const processedCvData = await this.jsonTransformer.processImages(
      await this.jsonTransformer.processIcons(cvData, options.iconsBaseDir),
      options.imagesBaseDir,
    )

    // walk through selected templates
    for (const template of options.templates) {
      // look for the template and read it if found
      const templateData = await this.fileService.readFileData(
        join(options.templatesDir, `${template}.hbs`),
      )
      if (!templateData) continue

      // walk through selected locales
      for (const locale of options.locales) {
        // register handlebars date helper depending on the locale
        this.templateEngine.registerDateHelper(locale)

        // determine language from the processing locale
        const lang = String(locale).split('-')[0]

        // setting up the output pdf file path
        const outputPath = join(options.output, `${template}_${locale}.pdf`)

        // language-mapped json data
        const localizedCvData = this.jsonTransformer.processLocalizedData(
          processedCvData,
          lang,
        )

        // compile html
        const html = this.templateEngine.compile(templateData, localizedCvData)

        // save pdf
        await this.output.saveToFile(
          outputPath,
          html,
          this.args.marginsToPuppeteer(options.margins),
        )

        // unregistering handlebars date helper
        this.templateEngine.unregisterDateHelper()
      }
    }
  }
}
