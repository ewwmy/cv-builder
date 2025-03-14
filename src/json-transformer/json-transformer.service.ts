import { inject, injectable } from 'inversify'
import { JsonObject, JsonValue } from '../types/json.types'
import { isAbsolute, join, resolve } from 'node:path'
import { DependencyTypes } from '../types/dependency.types'
import { ILogger } from '../logger/logger.interface'
import { ImageService } from '../images/image.service'
import { FileService } from '../files/file.service'

@injectable()
export class JsonTransformerService {
  public constructor(
    @inject(DependencyTypes.Logger) private logger: ILogger,
    @inject(DependencyTypes.Image) private imageService: ImageService,
    @inject(DependencyTypes.File) private fileService: FileService,
  ) {}

  // process icons in json
  public async processIcons(
    data: JsonValue,
    basePath: string = '.',
  ): Promise<JsonValue> {
    if (Array.isArray(data)) {
      await Promise.all(data.map((item) => this.processIcons(item, basePath)))
    } else if (typeof data === 'object' && data !== null) {
      await Promise.all(
        Object.keys(data).map(async (key) => {
          if (key === 'icon' && typeof data[key] === 'string') {
            const path: string = isAbsolute(data[key])
              ? data[key]
              : resolve(join(basePath, data[key]))
            try {
              data[key] = String(await this.fileService.readFileData(path))
            } catch (error) {
              this.logger.warn(
                `Couldn't load the icon at "${path}". The icon will be ignored.`,
              )
              data[key] = ''
            }
          } else {
            await this.processIcons(data[key], basePath)
          }
        }),
      )
    }
    return data
  }

  // recursive function to re-map the data with the processed images and converted to base64
  // { type: "image"; path: string; scale?: number } to { type: "image"; path: string; scale?: number; base64: string }
  public async processImages(
    data: JsonValue,
    basePath: string = '.',
  ): Promise<JsonValue> {
    if (Array.isArray(data)) {
      await Promise.all(data.map((item) => this.processImages(item, basePath)))
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
          data.base64 = await this.imageService.imageToBase64(imagePath, scale)
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
            this.processImages(data[key], basePath),
          ),
        )
      }
    }
    return data
  }

  // recursive function to re-map the data with the selected language
  public processLocalizedData(data: JsonValue, language: string): JsonValue {
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
      return data.map((item) => this.processLocalizedData(item, language))
    }

    return Object.keys(data).reduce((acc, key) => {
      acc[key] = this.processLocalizedData((data as JsonObject)[key], language)
      return acc
    }, {} as JsonObject)
  }

  public processHiddenData(data: JsonValue): JsonValue {
    if (typeof data !== 'object' || data === null) {
      return data
    }

    if (
      data.hasOwnProperty('hidden') &&
      typeof (data as JsonObject)['hidden'] === 'boolean'
    ) {
      if ((data as JsonObject)['hidden'] === true) {
        data = null
        return data
      }
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.processHiddenData(item))
    }

    return Object.keys(data).reduce((acc, key) => {
      acc[key] = this.processHiddenData((data as JsonObject)[key])
      return acc
    }, {} as JsonObject)
  }
}
