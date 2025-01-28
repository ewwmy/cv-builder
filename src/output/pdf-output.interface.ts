export interface IPdfOutput {
  saveToFile: (path: string, html: string, ...args: any[]) => void
}
