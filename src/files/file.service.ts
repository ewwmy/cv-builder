import { injectable } from 'inversify'
import { UserConfig } from '../types/config.types'
import fsx from 'fs-extra'
import { readFile } from 'node:fs/promises'

@injectable()
export class FileService {
  // save json data wrapper
  public async saveJsonSettings(
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

  // useful wrapper to read the data of a file
  public async readFileData(
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
}
