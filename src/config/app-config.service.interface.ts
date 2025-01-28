import { Config } from '../types/config.types'
import { IConfigService } from './config.service.interface'

export interface IAppConfigService extends IConfigService {
  get: <T>(key: keyof Config) => T
}
