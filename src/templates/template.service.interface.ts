export interface ITemplateService {
  registerHelpers: (...args: any[]) => void
  unregisterHelpers: (...args: any[]) => void
  compile: (...args: any[]) => string
}
