import puppeteer from 'puppeteer'
import { inject, injectable } from 'inversify'
import { DependencyTypes } from '../types/dependency.types'
import { ILogger } from '../logger/logger.interface'
import { MarginObject } from './margin.types'
import { IPuppeteerPdfOutput } from './puppeteer-pdf-output.interface'

@injectable()
export class PuppeteerService implements IPuppeteerPdfOutput {
  protected puppeteer = puppeteer

  public constructor(@inject(DependencyTypes.Logger) private logger: ILogger) {}

  public async saveToFile(
    path: string,
    html: string,
    margin: MarginObject,
  ): Promise<void> {
    // prepare puppeteer to render pdf
    const browser = await this.puppeteer.launch()
    const page = await browser.newPage()

    // render and save pdf
    await page.setContent(html, { waitUntil: 'networkidle0' })
    await page.pdf({
      path,
      format: 'A4',
      margin,
      printBackground: true,
      preferCSSPageSize: true,
    })
    await page.close()

    await browser.close()
    this.logger.info(`PDF saved: "${path}"`)
  }
}
