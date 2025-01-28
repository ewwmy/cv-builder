import { MarginObject } from './margin.types'
import { IPdfOutput } from './pdf-output.interface'

export interface IPuppeteerPdfOutput extends IPdfOutput {
  saveToFile: (
    path: string,
    html: string,
    margins: MarginObject,
  ) => Promise<void>
}
