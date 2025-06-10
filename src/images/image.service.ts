import { injectable } from 'inversify'
import { readFile } from 'node:fs/promises'
import sharp, { Sharp } from 'sharp'

@injectable()
export class ImageService {
  // function to convert an image stored in a path to png and to base64 string
  public async imageToBase64(
    path: string,
    scale: number = 1,
    format: 'png' | 'jpg' | 'webp' = 'png',
  ): Promise<string> {
    try {
      const image = await this.readImage(path)
      const resizedImage = await this.resizeImage(image, scale)
      const base64 = await this.convertImageToBase64(resizedImage, format)

      return base64
    } catch (error) {
      this.handleError(error, path)
      throw error
    }
  }

  private async readImage(path: string): Promise<Sharp> {
    try {
      const imageBuffer = await readFile(path)
      return sharp(imageBuffer, { failOnError: false })
    } catch (error) {
      this.handleError(error, path)
      throw error
    }
  }

  private async resizeImage(image: Sharp, scale: number): Promise<Sharp> {
    if (scale > 0 && scale <= 1) {
      const metadata = await image.metadata()
      const width = Math.round((metadata.width || 1) * scale)
      return image.resize({ width })
    }
    return image
  }

  private async convertImageToBase64(
    image: Sharp,
    format: 'png' | 'jpg' | 'webp',
  ): Promise<string> {
    return (await image.toFormat(format).toBuffer()).toString('base64')
  }

  private handleError(error: unknown, path: string): void {
    if (error instanceof Error) {
      error.message = `Warning: Couldn't process the image at "${path}". The image will be ignored.`
    }
  }
}
