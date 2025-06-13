import { inject, injectable } from 'inversify'
import yargs from 'yargs'
import { DependencyTypes } from '../types/dependency.types'
import { hideBin } from 'yargs/helpers'
import { AppConfigService } from '../config/app-config.service'
import { ArgumentsObject } from './arguments.types'
import { MarginLabel, MarginObject } from '../output/margin.types'

@injectable()
export class ArgumentsService {
  public constructor(
    @inject(DependencyTypes.Config) private config: AppConfigService,
  ) {}

  // getting command line arguments
  public async getCommandLineOptions(): Promise<ArgumentsObject> {
    const userConfig = this.config.getUserConfig()
    return <ArgumentsObject>yargs(hideBin(process.argv))
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
        watch: {
          alias: 'w',
          describe:
            'Watch for changes in CV data and templates to provide live preview',
          requiresArg: false,
          default: false,
          type: 'boolean',
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
          default: '0cm:0cm:0cm:0cm',
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

  // function to parse and set margins as an object for puppeteer
  public marginsToPuppeteer(input: string | string[]): MarginObject {
    let result: MarginObject = {}
    if (!(typeof input === 'string')) return result

    const items = input.split(':')
    if (items.length !== 4) return result

    const labels: MarginLabel[] = ['top', 'right', 'bottom', 'left']
    items.forEach((item, key) => {
      const pattern = /^\d+(\.\d+)?(px|pt|cm|mm|in)?$/
      if (pattern.test(item)) result[labels[key]] = item
    })

    return result
  }
}
