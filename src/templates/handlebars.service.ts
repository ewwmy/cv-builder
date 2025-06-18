import { inject, injectable } from 'inversify'
import { MarkdownService } from '../markdown/markdown.service'
import { DependencyTypes } from '../types/dependency.types'
import Handlebars from 'handlebars'
import { JsonValue } from '../types/json.types'
import { IHandlebarsService } from './handlebars.service.interface'

@injectable()
export class HandlebarsService implements IHandlebarsService {
  public constructor(
    @inject(DependencyTypes.Markdown) private markdown: MarkdownService,
  ) {}

  public registerHelpers(): void {
    this.registerMarkdownHelper()
    this.registerImageHelper()
  }

  public unregisterHelpers(): void {
    this.unregisterDateHelper()
  }

  public compile(template: string, data: JsonValue): string {
    if (typeof data === 'object' && data !== null) {
      return Handlebars.compile(template)({
        ...data,
      })
    } else {
      return Handlebars.compile(template)({
        data,
      })
    }
  }

  // handlebars: register `markdown` helper
  protected registerMarkdownHelper(): void {
    Handlebars.registerHelper('markdown', (text) => {
      const markdowned = this.markdown.parseInline(text || '')
      if (typeof markdowned === 'string') {
        return new Handlebars.SafeString(markdowned)
      } else if (markdowned instanceof Promise) {
        throw new Error('Promises are not supported in Handlebars helpers')
      } else {
        throw new Error('Unknown Handlebars error')
      }
    })
  }

  // handlebars: register `image` helper
  protected registerImageHelper(): void {
    Handlebars.registerHelper('image', (img, opt) => {
      if (!img || !img.base64) {
        return ''
      }

      const roundness = opt?.hash?.roundness || 0
      const width = opt?.hash?.width || '100px'
      const height = opt?.hash?.height || width

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

  // date formatter function
  protected getDateFormatter(
    locale: string,
    options: Intl.DateTimeFormatOptions,
  ) {
    return (text: string) => {
      const date = new Date(text)
      return new Handlebars.SafeString(
        new Intl.DateTimeFormat(locale, options).format(date),
      )
    }
  }

  // handlebars: register `date` helper
  public registerDateHelper(locale: string): void {
    Handlebars.registerHelper(
      'date',
      this.getDateFormatter(locale, {
        year: 'numeric',
        month: 'short',
      }),
    )
  }

  // handlebars: register `year` helper to extract the year from a date
  public registerYearHelper(locale: string): void {
    Handlebars.registerHelper(
      'year',
      this.getDateFormatter(locale, {
        year: 'numeric',
      }),
    )
  }

  // handlebars: unregister `date` helper
  public unregisterDateHelper() {
    Handlebars.unregisterHelper('date')
  }

  // handlebars: unregister `year` helper
  public unregisterYearHelper() {
    Handlebars.unregisterHelper('year')
  }
}
