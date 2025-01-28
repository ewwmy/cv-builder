import { inject, injectable } from 'inversify'
import { DependencyTypes } from '../types/dependency.types'
import { Config, UserConfig } from '../types/config.types'
import { IAppConfigService } from './app-config.service.interface'
import { join, resolve } from 'node:path'
import { homedir } from 'node:os'
import { FileService } from '../files/file.service'

@injectable()
export class AppConfigService implements IAppConfigService {
  protected data: Config = {
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
  constructor(@inject(DependencyTypes.File) private fileService: FileService) {
    this.initializeDefault()
  }

  protected initializeDefault(): void {
    // initialize main app config
    this.data.APP_GROUP_NAME = 'ewwmy'
    this.data.APP_NAME = 'cv-builder'
    this.data.EXAMPLE_CV = 'cv-example.json'
    this.data.EXAMPLE_IMAGES = 'images'
    this.data.EXAMPLE_ICONS = 'icons'
    this.data.EXAMPLE_TEMPLATES = 'templates'

    this.data.APP_DIR = resolve(
      join(homedir(), '.config', this.data.APP_GROUP_NAME, this.data.APP_NAME),
    )

    this.data.CONFIG_DIR = resolve(join(this.data.APP_DIR, 'settings'))
    this.data.CONFIG_FILE_PATH = resolve(
      join(this.data.CONFIG_DIR, 'settings.json'),
    )

    this.data.EXAMPLES_DIR = resolve(join('.', 'data', 'examples'))

    this.data.EXAMPLE_CV_FILE_PATH = resolve(
      join(this.data.EXAMPLES_DIR, this.data.EXAMPLE_CV),
    )
    this.data.EXAMPLE_IMAGES_DIR = resolve(
      join(this.data.EXAMPLES_DIR, this.data.EXAMPLE_IMAGES),
    )
    this.data.EXAMPLE_ICONS_DIR = resolve(
      join(this.data.EXAMPLES_DIR, this.data.EXAMPLE_ICONS),
    )
    this.data.EXAMPLE_TEMPLATES_DIR = resolve(
      join(this.data.EXAMPLES_DIR, this.data.EXAMPLE_TEMPLATES),
    )

    this.data.DEFAULT_CV_FILE_PATH = resolve(
      join(this.data.APP_DIR, this.data.EXAMPLE_CV),
    )
    this.data.DEFAULT_IMAGES_DIR = resolve(
      join(this.data.APP_DIR, this.data.EXAMPLE_IMAGES),
    )
    this.data.DEFAULT_ICONS_DIR = resolve(
      join(this.data.APP_DIR, this.data.EXAMPLE_ICONS),
    )
    this.data.DEFAULT_TEMPLATES_DIR = resolve(
      join(this.data.APP_DIR, this.data.EXAMPLE_TEMPLATES),
    )
    this.data.DEFAULT_OUTPUT_DIR = resolve(join(this.data.APP_DIR, 'out'))

    this.data.DEFAULT_USER_CONFIG = {
      LOCALES: ['en-US', 'ru-RU'],
      TEMPLATES: ['example'],
      INPUT_CV_FILE_PATH: this.data.DEFAULT_CV_FILE_PATH,
      OUTPUT_DIR: this.data.DEFAULT_OUTPUT_DIR,
      TEMPLATES_DIR: this.data.DEFAULT_TEMPLATES_DIR,
      BASE_IMAGES_DIR: this.data.DEFAULT_IMAGES_DIR,
      BASE_ICONS_DIR: this.data.DEFAULT_ICONS_DIR,
    }
  }

  public get<T>(key: keyof Config): T {
    return <T>this.data[key]
  }

  public getAll(): Config {
    return this.data
  }

  public getUserConfig(): UserConfig {
    return this.data.DEFAULT_USER_CONFIG
  }

  public set(key: keyof Config, value: any): void {
    this.data[key] = value
  }

  public update(config: Partial<Config>): void {
    this.data = { ...this.data, ...config }
  }

  public updateUserConfig(userConfig: Partial<UserConfig>): void {
    this.data.DEFAULT_USER_CONFIG = {
      ...this.data.DEFAULT_USER_CONFIG,
      ...userConfig,
    }
  }

  public restoreDefault(): void {
    this.initializeDefault()
  }

  // function to get the configuration by the passed filename (json file)
  public async loadFromFile(
    filename: string = this.data.CONFIG_FILE_PATH,
  ): Promise<UserConfig> {
    const data = await this.fileService.readFileData(filename, true)
    let result = {}
    try {
      result = JSON.parse(data ?? '{}')
    } catch (error) {
      if (error instanceof Error) {
        error.message = `Error: Cannot parse JSON from user config file. Details: ${error?.message}`
      }
      throw error
    }

    this.data.DEFAULT_USER_CONFIG = {
      ...this.data.DEFAULT_USER_CONFIG,
      ...result,
    }
    return this.data.DEFAULT_USER_CONFIG
  }
}
