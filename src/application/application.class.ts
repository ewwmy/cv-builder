import { readFile } from 'node:fs/promises'
import { join, resolve, isAbsolute } from 'node:path'
import { homedir } from 'node:os'
import fsx from 'fs-extra'
import { launch } from 'puppeteer'
import { parseInline } from 'marked'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import Handlebars from 'handlebars'
import sharp from 'sharp'
import { inject, injectable } from 'inversify'
import { Config, UserConfig } from '../types/config.types'
import { JsonObject, JsonValue } from '../types/json.types'
import { MarginLabel, MarginObject } from '../types/margin.types'
import { DependencyTypes } from '../types/dependency.types'
import { ILogger } from '../logger/logger.interface'

@injectable()
export class Application {
  protected config: Config = {
    APP_GROUP_NAME: '',
    APP_NAME: '',
    EXAMPLE_CV: '',
    EXAMPLE_IMAGES: '',
    EXAMPLE_ICONS: '',
    EXAMPLE_TEMPLATES: '',
    APP_DIR: '',
    CONFIG_DIR: '',
    CONFIG_FILE_PATH: '',
    EXAMPLES_DIR: '',
    EXAMPLE_CV_FILE_PATH: '',
    EXAMPLE_IMAGES_DIR: '',
    EXAMPLE_ICONS_DIR: '',
    EXAMPLE_TEMPLATES_DIR: '',
    DEFAULT_CV_FILE_PATH: '',
    DEFAULT_IMAGES_DIR: '',
    DEFAULT_ICONS_DIR: '',
    DEFAULT_TEMPLATES_DIR: '',
    DEFAULT_OUTPUT_DIR: '',
    DEFAULT_USER_CONFIG: {
      LOCALES: [],
      TEMPLATES: [],
      INPUT_CV_FILE_PATH: '',
      OUTPUT_DIR: '',
      TEMPLATES_DIR: '',
      BASE_IMAGES_DIR: '',
      BASE_ICONS_DIR: '',
    },
  }

  public constructor(@inject(DependencyTypes.Logger) private logger: ILogger) {
    // initialize the main app config
    this.initializeAppConfig()
  }

  // initialize main app config
  protected initializeAppConfig(): void {
    this.config.APP_GROUP_NAME = 'ewwmy'
    this.config.APP_NAME = 'cv-builder'
    this.config.EXAMPLE_CV = 'cv-example.json'
    this.config.EXAMPLE_IMAGES = 'images'
    this.config.EXAMPLE_ICONS = 'icons'
    this.config.EXAMPLE_TEMPLATES = 'templates'

    this.config.APP_DIR = resolve(
      join(
        homedir(),
        '.config',
        this.config.APP_GROUP_NAME,
        this.config.APP_NAME,
      ),
    )

    this.config.CONFIG_DIR = resolve(join(this.config.APP_DIR, 'settings'))
    this.config.CONFIG_FILE_PATH = resolve(
      join(this.config.CONFIG_DIR, 'settings.json'),
    )

    this.config.EXAMPLES_DIR = resolve(join('.', 'data', 'examples'))

    this.config.EXAMPLE_CV_FILE_PATH = resolve(
      join(this.config.EXAMPLES_DIR, this.config.EXAMPLE_CV),
    )
    this.config.EXAMPLE_IMAGES_DIR = resolve(
      join(this.config.EXAMPLES_DIR, this.config.EXAMPLE_IMAGES),
    )
    this.config.EXAMPLE_ICONS_DIR = resolve(
      join(this.config.EXAMPLES_DIR, this.config.EXAMPLE_ICONS),
    )
    this.config.EXAMPLE_TEMPLATES_DIR = resolve(
      join(this.config.EXAMPLES_DIR, this.config.EXAMPLE_TEMPLATES),
    )

    this.config.DEFAULT_CV_FILE_PATH = resolve(
      join(this.config.APP_DIR, this.config.EXAMPLE_CV),
    )
    this.config.DEFAULT_IMAGES_DIR = resolve(
      join(this.config.APP_DIR, this.config.EXAMPLE_IMAGES),
    )
    this.config.DEFAULT_ICONS_DIR = resolve(
      join(this.config.APP_DIR, this.config.EXAMPLE_ICONS),
    )
    this.config.DEFAULT_TEMPLATES_DIR = resolve(
      join(this.config.APP_DIR, this.config.EXAMPLE_TEMPLATES),
    )
    this.config.DEFAULT_OUTPUT_DIR = resolve(join(this.config.APP_DIR, 'out'))

    this.config.DEFAULT_USER_CONFIG = {
      LOCALES: ['en-US', 'ru-RU'],
      TEMPLATES: ['example'],
      INPUT_CV_FILE_PATH: this.config.DEFAULT_CV_FILE_PATH,
      OUTPUT_DIR: this.config.DEFAULT_OUTPUT_DIR,
      TEMPLATES_DIR: this.config.DEFAULT_TEMPLATES_DIR,
      BASE_IMAGES_DIR: this.config.DEFAULT_IMAGES_DIR,
      BASE_ICONS_DIR: this.config.DEFAULT_ICONS_DIR,
    }
  }

  // save json data wrapper
  protected async saveJsonSettings(
    filename: string,
    data: Partial<UserConfig> = {},
    options: fsx.JsonWriteOptions = {},
  ): Promise<void> {
    if (typeof options === 'object' && options !== null) {
      await fsx.writeJson(filename, data, {
        spaces: 2,
        ...options,
      })
    } else {
      await fsx.writeJson(filename, data, options)
    }
  }

  // check app dir
  protected async checkAppDir(appConfig: Config): Promise<void> {
    // restore everything if app dir doesn't exist
    if (!(await fsx.pathExists(appConfig.APP_DIR))) {
      await this.restoreDefault(appConfig)
    }
  }

  // restore default settings and examples
  protected async restoreDefault(
    appConfig: Config,
    force = false,
  ): Promise<void> {
    await fsx.ensureDir(appConfig.APP_DIR)
    await fsx.ensureDir(appConfig.DEFAULT_OUTPUT_DIR)

    // restore config
    if (!(await fsx.pathExists(appConfig.CONFIG_FILE_PATH)) || force) {
      await fsx.ensureDir(appConfig.CONFIG_DIR)
      await this.saveJsonSettings(
        appConfig.CONFIG_FILE_PATH,
        appConfig.DEFAULT_USER_CONFIG,
      )
    }

    // restore cv example
    if (!(await fsx.pathExists(appConfig.DEFAULT_CV_FILE_PATH)) || force) {
      await fsx.copy(
        appConfig.EXAMPLE_CV_FILE_PATH,
        appConfig.DEFAULT_CV_FILE_PATH,
      )
    }

    // restore icons
    if (!(await fsx.pathExists(appConfig.DEFAULT_ICONS_DIR)) || force) {
      await fsx.copy(appConfig.EXAMPLE_ICONS_DIR, appConfig.DEFAULT_ICONS_DIR)
    }

    // restore user photo examples
    if (!(await fsx.pathExists(appConfig.DEFAULT_IMAGES_DIR)) || force) {
      await fsx.copy(appConfig.EXAMPLE_IMAGES_DIR, appConfig.DEFAULT_IMAGES_DIR)
    }

    // restore template examples
    if (!(await fsx.pathExists(appConfig.DEFAULT_TEMPLATES_DIR)) || force) {
      await fsx.copy(
        appConfig.EXAMPLE_TEMPLATES_DIR,
        appConfig.DEFAULT_TEMPLATES_DIR,
      )
    }
  }

  // getting command line arguments
  protected async getCommandLineOptions(
    userConfig: UserConfig,
  ): Promise<Record<string, any>> {
    return yargs(hideBin(process.argv))
      .options({
        locales: {
          alias: 'l',
          describe: 'Locales to build',
          default: userConfig.LOCALES,
          type: 'array',
        },
        templates: {
          alias: 't',
          describe: 'Templates to build',
          default: userConfig.TEMPLATES,
          type: 'array',
        },
        input: {
          alias: 'i',
          describe: 'Path to the input JSON CV file',
          default: userConfig.INPUT_CV_FILE_PATH,
          type: 'string',
        },
        output: {
          alias: 'o',
          describe: 'Path to the output folder',
          default: userConfig.OUTPUT_DIR,
          type: 'string',
        },
        'templates-dir': {
          alias: 'd',
          describe: 'Path to the templates folder',
          default: userConfig.TEMPLATES_DIR,
          type: 'string',
        },
        'images-base-dir': {
          describe:
            'Base path for the images that are supposed to be used in a template',
          default: userConfig.BASE_IMAGES_DIR,
          type: 'string',
        },
        'icons-base-dir': {
          describe:
            'Base path for the icons that are supposed to be used in a template',
          default: userConfig.BASE_ICONS_DIR,
          type: 'string',
        },
        margins: {
          alias: 'm',
          describe:
            'Margins of the output PDF [top]:[right]:[bottom]:[left]. Examples: --margins=2cm:0cm:1cm:1cm | --margins=:1cm::1cm | --margins=0px:24px:0px:24px',
          usage: '2cm:1cm:1cm:0cm',
          type: 'string',
        },
        restore: {
          alias: 'r',
          describe:
            'Restore sample data, preserving existing files !!! CAUTION: If the `--force` option given,     existing configuration, CV file `cv-example.json`, template `example.hbs`, image `example-user-photo.jpg` WILL BE OVERWRITTEN !!!',
          requiresArg: false,
          default: false,
          type: 'boolean',
        },
        force: {
          describe: 'See `--restore`',
          requiresArg: false,
          default: false,
          type: 'boolean',
        },
      })
      .locale('en')
      .wrap(120).argv
  }

  // getting the json file data
  protected async getSourceData(filename: string): Promise<JsonValue> {
    return JSON.parse((await this.readFileData(filename)) ?? '{}')
  }

  // function to get the configuration by the passed filename (json file)
  protected async getUserConfig(
    filename: string,
    defaultConfig: UserConfig,
  ): Promise<UserConfig> {
    const data = await this.readFileData(filename, true)
    let result = {}
    try {
      result = JSON.parse(data ?? '{}')
    } catch (error) {
      if (error instanceof Error) {
        error.message = `Error: Cannot parse JSON from user config file. Details: ${error?.message}`
      }
      throw error
    }

    return { ...defaultConfig, ...result }
  }

  // process icons in json
  protected async processJsonIcons(
    data: JsonValue,
    basePath: string = '.',
  ): Promise<JsonValue> {
    if (Array.isArray(data)) {
      await Promise.all(
        data.map((item) => this.processJsonIcons(item, basePath)),
      )
    } else if (typeof data === 'object' && data !== null) {
      await Promise.all(
        Object.keys(data).map(async (key) => {
          if (key === 'icon' && typeof data[key] === 'string') {
            const path: string = isAbsolute(data[key])
              ? data[key]
              : resolve(join(basePath, data[key]))
            try {
              const a = data[key]
              data[key] = String(await this.readFileData(path))
            } catch (error) {
              this.logger.warn(
                `Couldn't load the icon on "${path}". The icon will be ignored.`,
              )
              data[key] = ''
            }
          } else {
            await this.processJsonIcons(data[key], basePath)
          }
        }),
      )
    }
    return data
  }

  // recursive function to re-map the data with the processed images and converted to base64
  // { type: "image"; path: string; scale?: number } to { type: "image"; path: string; scale?: number; base64: string }
  protected async processJsonImages(
    data: JsonValue,
    basePath: string = '.',
  ): Promise<JsonValue> {
    if (Array.isArray(data)) {
      await Promise.all(
        data.map((item) => this.processJsonImages(item, basePath)),
      )
    } else if (typeof data === 'object' && data !== null) {
      if (
        data.hasOwnProperty('path') &&
        data.hasOwnProperty('type') &&
        typeof data.path === 'string' &&
        typeof data.type === 'string' &&
        data.type === 'image'
      ) {
        let { path: imagePath, scale } = data
        imagePath = isAbsolute(imagePath)
          ? imagePath
          : resolve(join(basePath, imagePath))
        scale = typeof scale === 'number' ? scale : 1
        try {
          data.base64 = await this.imageToPngBase64(imagePath, scale)
        } catch (error) {
          if (error instanceof Error) {
            this.logger.warn(error.message)
          } else {
            this.logger.warn(error)
          }
          data.base64 = ''
        }
      } else {
        await Promise.all(
          Object.keys(data).map((key) =>
            this.processJsonImages(data[key], basePath),
          ),
        )
      }
    }
    return data
  }

  // recursive function to re-map the data with the selected language
  protected processJsonLocalizedData(
    data: JsonValue,
    language: string,
  ): JsonValue {
    if (typeof data !== 'object' || data === null) {
      return data
    }

    if (
      data.hasOwnProperty(language) &&
      typeof (data as JsonObject)[language] === 'string'
    ) {
      return (data as JsonObject)[language]
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.processJsonLocalizedData(item, language))
    }

    return Object.keys(data).reduce((acc, key) => {
      acc[key] = this.processJsonLocalizedData(
        (data as JsonObject)[key],
        language,
      )
      return acc
    }, {} as JsonObject)
  }

  // function to convert an image stored in a path to png and to base64 string
  protected async imageToPngBase64(
    path: string,
    scale: number,
  ): Promise<string> {
    let imageBuffer, image

    // read the image file
    try {
      imageBuffer = await readFile(path)
      image = sharp(imageBuffer)
    } catch (error) {
      if (error instanceof Error) {
        error.message = `Warning: Couldn't load the image on "${path}". The image will be ignored.`
      }
      throw error
    }

    // resize if scale is specified
    if (scale > 0 && scale <= 1) {
      const metadata = await image.metadata()
      const width = Math.round((metadata.width || 1) * scale)
      image = image.resize({ width })
    }

    // convert to png, to base64, and return
    return (await image.png().toBuffer()).toString('base64')
  }

  // useful wrapper to read the data of a file
  protected async readFileData(
    path: string,
    createIfNotExist = false,
  ): Promise<string | undefined> {
    let data = undefined
    if (createIfNotExist) {
      await fsx.ensureFile(path)
    }
    try {
      data = await readFile(path, {
        encoding: 'utf-8',
      })
    } catch (error) {
      if (error instanceof Error) {
        error.message = `Couldn't read the file: ${path}`
      }
      throw error
    }
    return data
  }

  // function to parse and set margins as an object for puppeteer
  protected getMargins(input: string | string[]): MarginObject {
    let result: MarginObject = {}
    if (!(typeof input === 'string')) return result

    const items = input.split(':')
    if (items.length !== 4) return result

    const labels: MarginLabel[] = ['top', 'right', 'bottom', 'left']
    items.forEach((item, key) => {
      const pattern = /^\d+(px|pt|cm|mm|in)?$/
      if (pattern.test(item)) result[labels[key]] = item
    })

    return result
  }

  // handlebars: register `markdown` helper
  protected registerHandlebarsMarkdown() {
    Handlebars.registerHelper('markdown', (text) => {
      return new Handlebars.SafeString(parseInline(text || '') as string)
    })
  }

  // handlebars: register `image` helper
  protected registerHandlebarsImage() {
    Handlebars.registerHelper('image', (img, opt) => {
      if (!img || !img.base64) {
        return ''
      }

      const roundness = opt.hash.roundness || 0
      const width = opt.hash.width || '100px'
      const height = opt.hash.height || width

      return new Handlebars.SafeString(`
        <div style="
          width: ${width};
          height: ${height};
          border-radius: calc(50% * ${roundness});
          overflow: hidden;
          display: inline-block;">
          <img src="data:image/png;base64,${img.base64}" style="
            width: 100%;
            height: 100%;
            object-fit: cover;"
          />
        </div>
      `)
    })
  }

  // handlebars: register `date` helper
  protected registerHandlebarsDate(locale: string) {
    Handlebars.registerHelper('date', (text) => {
      const date = new Date(text)
      return new Handlebars.SafeString(
        new Intl.DateTimeFormat(locale, {
          year: 'numeric',
          month: 'short',
        }).format(date),
      )
    })
  }

  // handlebars: unregister `date` helper
  protected unregisterHandlebarsDate() {
    Handlebars.unregisterHelper('date')
  }

  public async run(): Promise<void> {
    try {
      // check the app directory
      await this.checkAppDir(this.config)

      // registering a helper for markdown
      this.registerHandlebarsMarkdown()

      // registering a helper for images
      this.registerHandlebarsImage()

      // load user config
      const config = await this.getUserConfig(
        this.config.CONFIG_FILE_PATH,
        this.config.DEFAULT_USER_CONFIG,
      )
      // load command line options
      const options = await this.getCommandLineOptions(config)

      // restore default data if the option `restore` is set
      if (options.restore) {
        await this.restoreDefault(this.config, options.force)
        this.logger.info('Restored' + (options.force ? ' (force)' : ''))
        process.exit(0)
      }

      // load cv json file data
      const cvData = await this.getSourceData(options.input)
      if (!cvData) return

      // process icons and images
      const processedCvData = await this.processJsonImages(
        await this.processJsonIcons(cvData, options.iconsBaseDir),
        options.imagesBaseDir,
      )

      // walk through selected templates
      for (const template of options.templates) {
        // look for common template and read it if found
        const templateData = await this.readFileData(
          join(options.templatesDir, `${template}.hbs`),
        )
        if (!templateData) continue

        // walk through selected locales
        for (const locale of options.locales) {
          // registering helper for date (according to the locale)
          this.registerHandlebarsDate(locale)

          // determine language from the processing locale
          const lang = String(locale).split('-')[0]

          // setting up the output pdf file path
          const outputPath = join(options.output, `${template}_${locale}.pdf`)

          // language-mapped json data
          const localizedCvData = this.processJsonLocalizedData(
            processedCvData,
            lang,
          )

          // compile html
          let html
          if (typeof localizedCvData === 'object' && localizedCvData !== null) {
            html = Handlebars.compile(templateData)({
              ...localizedCvData,
            })
          } else {
            html = Handlebars.compile(templateData)({
              localizedCvData,
            })
          }

          // prepare puppeteer to render pdf
          const browser = await launch()
          const page = await browser.newPage()

          // render and save pdf
          await page.setContent(html, { waitUntil: 'networkidle0' })
          await page.pdf({
            path: outputPath,
            format: 'A4',
            margin: this.getMargins(options.margins),
            printBackground: true,
            preferCSSPageSize: true,
          })
          await page.close()

          await browser.close()
          this.logger.info(`PDF saved: "${outputPath}"`)

          // unregistering helper for date
          this.unregisterHandlebarsDate()
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(error.message)
      } else {
        this.logger.error(error)
      }
    }
  }
}
