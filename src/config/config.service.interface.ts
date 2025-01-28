import { Config } from '../types/config.types'

export interface IConfigService {
  get: <T>(key: any) => T
}
