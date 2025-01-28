import { injectable } from 'inversify'
import { marked } from 'marked'

@injectable()
export class MarkdownService {
  protected marked = marked

  public parseInline(text: string): string | Promise<string> {
    return this.marked.parseInline(text)
  }
}
