import { JsonValue } from '../types/json.types'
import { ITemplateService } from './template.service.interface'

export interface IHandlebarsService extends ITemplateService {
  registerHelpers: () => void
  unregisterHelpers: () => void
  registerDateHelper: (locale: string) => void
  unregisterDateHelper: () => void
  compile: (template: string, data: JsonValue) => string
}
