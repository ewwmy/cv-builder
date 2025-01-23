#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import { join, resolve, isAbsolute } from 'node:path'
import { homedir } from 'node:os'
import fsx from 'fs-extra'
import { launch } from 'puppeteer'
import { parseInline } from 'marked'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import Handlebars from 'handlebars'
import sharp from 'sharp'

// initialize main app config
const initializeAppConfig = (appConfig) => {
  appConfig.APP_GROUP_NAME = 'ewwmy'
  appConfig.APP_NAME = 'cv-builder'
  appConfig.EXAMPLE_CV = 'cv-example.json'
  appConfig.EXAMPLE_IMAGE = 'example-user-photo.jpg'
  appConfig.EXAMPLE_TEMPLATE = 'example'

  appConfig.APP_DIR = resolve(
    join(homedir(), '.config', appConfig.APP_GROUP_NAME, appConfig.APP_NAME),
  )

  appConfig.CONFIG_DIR = resolve(join(appConfig.APP_DIR, 'settings'))
  appConfig.CONFIG_FILE_PATH = resolve(
    join(appConfig.CONFIG_DIR, 'settings.json'),
  )

  appConfig.EXAMPLES_PATH = resolve(join('.', 'data', 'examples'))
  appConfig.EXAMPLE_CV_PATH = resolve(
    join(appConfig.EXAMPLES_PATH, appConfig.EXAMPLE_CV),
  )
  appConfig.EXAMPLE_IMAGE_PATH = resolve(
    join(appConfig.EXAMPLES_PATH, appConfig.EXAMPLE_IMAGE),
  )
  appConfig.EXAMPLE_ICONS_PATH = resolve(join(appConfig.EXAMPLES_PATH, 'icons'))
  appConfig.EXAMPLE_TEMPLATE_PATH = resolve(
    join(appConfig.EXAMPLES_PATH, `${appConfig.EXAMPLE_TEMPLATE}.hbs`),
  )

  appConfig.DEFAULT_CV_FILE_PATH = resolve(
    join(appConfig.APP_DIR, appConfig.EXAMPLE_CV),
  )
  appConfig.DEFAULT_IMAGE_PATH = resolve(
    join(appConfig.APP_DIR, 'images', appConfig.EXAMPLE_IMAGE),
  )
  appConfig.DEFAULT_ICONS_PATH = resolve(join(appConfig.APP_DIR, 'icons'))
  appConfig.DEFAULT_OUTPUT_DIR = resolve(join(appConfig.APP_DIR, 'out'))
  appConfig.DEFAULT_TEMPLATES_DIR = resolve(
    join(appConfig.APP_DIR, 'templates'),
  )
  appConfig.DEFAULT_TEMPLATE_PATH = resolve(
    join(appConfig.DEFAULT_TEMPLATES_DIR, `${appConfig.EXAMPLE_TEMPLATE}.hbs`),
  )

  appConfig.DEFAULT_USER_CONFIG = {
    LOCALES: ['en-US', 'ru-RU'],
    TEMPLATES: ['example'],
    INPUT_CV_FILE_PATH: appConfig.DEFAULT_CV_FILE_PATH,
    OUTPUT_DIR: appConfig.DEFAULT_OUTPUT_DIR,
    TEMPLATES_DIR: appConfig.DEFAULT_TEMPLATES_DIR,
  }
}

// save json data wrapper
const saveJsonSettings = async (filename, data = {}, options = {}) => {
  await fsx.writeJson(filename, data, {
    spaces: 2,
    ...options,
  })
}

// check app dir
const checkAppDir = async (appConfig) => {
  await fsx.ensureDir(appConfig.APP_DIR)

  // restore config if doesn't exist
  if (!(await fsx.pathExists(appConfig.CONFIG_FILE_PATH))) {
    await fsx.ensureFile(appConfig.CONFIG_FILE_PATH)
    await saveJsonSettings(
      appConfig.CONFIG_FILE_PATH,
      appConfig.DEFAULT_USER_CONFIG,
    )
  }
}

// restore default settings and examples
const restoreDefault = async (appConfig, force = false) => {
  await fsx.ensureDir(appConfig.APP_DIR)
  await fsx.ensureDir(appConfig.DEFAULT_OUTPUT_DIR)
  await fsx.ensureDir(appConfig.DEFAULT_TEMPLATES_DIR)

  // restore config
  if (!(await fsx.pathExists(appConfig.CONFIG_FILE_PATH)) || force) {
    await saveJsonSettings(
      appConfig.CONFIG_FILE_PATH,
      appConfig.DEFAULT_USER_CONFIG,
    )
  }

  // restore cv example
  if (!(await fsx.pathExists(appConfig.DEFAULT_CV_FILE_PATH)) || force) {
    await fsx.copy(appConfig.EXAMPLE_CV_PATH, appConfig.DEFAULT_CV_FILE_PATH)
  }

  // restore icons
  if (!(await fsx.pathExists(appConfig.DEFAULT_ICONS_PATH)) || force) {
    await fsx.copy(appConfig.EXAMPLE_ICONS_PATH, appConfig.DEFAULT_ICONS_PATH)
  }

  // restore user photo example
  if (!(await fsx.pathExists(appConfig.DEFAULT_IMAGE_PATH)) || force) {
    await fsx.copy(appConfig.EXAMPLE_IMAGE_PATH, appConfig.DEFAULT_IMAGE_PATH)
  }

  // restore template examples
  if (!(await fsx.pathExists(appConfig.DEFAULT_TEMPLATE_PATH)) || force) {
    await fsx.copy(
      appConfig.EXAMPLE_TEMPLATE_PATH,
      appConfig.DEFAULT_TEMPLATE_PATH,
    )
  }
}

// getting command line arguments
const getCommandLineOptions = async (userConfig) => {
  return yargs(hideBin(process.argv))
    .options({
      locales: {
        alias: 'l',
        describe: 'Locales to build',
        default: userConfig.LOCALES,
        type: 'array',
      },
      templates: {
        alias: 't',
        describe: 'Templates to build',
        default: userConfig.TEMPLATES,
        type: 'array',
      },
      input: {
        alias: 'i',
        describe: 'Path to the input JSON CV file',
        default: userConfig.INPUT_CV_FILE_PATH,
        type: 'string',
      },
      output: {
        alias: 'o',
        describe: 'Path to the output folder',
        default: userConfig.OUTPUT_DIR,
      },
      templatesDir: {
        alias: 'd',
        describe: 'Path to the templates folder',
        default: userConfig.TEMPLATES_DIR,
        type: 'string',
      },
      margins: {
        alias: 'm',
        describe:
          'Margins of the output PDF [top]:[right]:[bottom]:[left].  Examples: --margins=2cm:0cm:1cm:1cm | --margins=:1cm::1cm | --margins=0px:24px:0px:24px',
        usage: '2cm:1cm:1cm:0cm',
        type: 'string',
      },
      restore: {
        alias: 'r',
        describe:
          'Restore sample data, preserving existing files            !!! CAUTION: If the `--force` option given, existing      configuration, CV file `cv-example.json`, template        `example.hbs`, image `example-user-photo.jpg` WILL BE     OVERWRITTEN !!!',
        requiresArg: false,
        default: false,
        type: 'boolean',
      },
      force: {
        describe: 'See `--restore`',
        requiresArg: false,
        default: false,
        type: 'boolean',
      },
    })
    .locale('en').argv
}

// getting the json file data
const getSourceData = async (filename) => {
  return JSON.parse(await readFileData(filename))
}

// function to get the configuration by the passed filename (json file)
const getUserConfig = async (filename, defaultConfig) => {
  const data = await readFileData(filename, true)
  let result = {}
  try {
    result = JSON.parse(data)
  } catch (error) {
    error.message = `Error: Cannot parse JSON from user config file. Details: ${error?.message}`
    throw error
  }

  return { ...defaultConfig, ...result }
}

// process icons in json
const processJsonIcons = async (data, basePath = '.') => {
  if (Array.isArray(data)) {
    await Promise.all(data.map((item) => processJsonIcons(item, basePath)))
  } else if (typeof data === 'object' && data !== null) {
    await Promise.all(
      Object.keys(data).map(async (key) => {
        if (key === 'icon') {
          const path = isAbsolute(data[key])
            ? data[key]
            : resolve(join(basePath, data[key]))
          try {
            data[key] = await readFileData(path)
          } catch (error) {
            console.warn(
              `Warning: Couldn't load the icon on "${path}". The icon will be ignored.`,
            )
            data[key] = ''
          }
        } else {
          await processJsonIcons(data[key], basePath)
        }
      }),
    )
  }
  return data
}

// recursive function to re-map the data with the processed images and converted to base64
// { type: "image"; path: string; scale?: number } to { type: "image"; path: string; scale?: number; base64: string }
const processJsonImages = async (data, basePath = '.') => {
  if (Array.isArray(data)) {
    await Promise.all(data.map((item) => processJsonImages(item, basePath)))
  } else if (typeof data === 'object' && data !== null) {
    if (
      data.hasOwnProperty('path') &&
      data.hasOwnProperty('type') &&
      data.type === 'image'
    ) {
      let { path: imagePath, scale } = data
      imagePath = isAbsolute(imagePath)
        ? imagePath
        : resolve(join(basePath, imagePath))
      try {
        data.base64 = await imageToPngBase64(imagePath, scale)
      } catch (error) {
        console.warn(error.message)
        data.base64 = ''
      }
    } else {
      await Promise.all(
        Object.keys(data).map((key) => processJsonImages(data[key], basePath)),
      )
    }
  }
  return data
}

// recursive function to re-map the data with the selected language
const processJsonLocalizedData = (data, language) => {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  if (data.hasOwnProperty(language) && typeof data[language] === 'string') {
    return data[language]
  }

  if (Array.isArray(data)) {
    return data.map((item) => processJsonLocalizedData(item, language))
  }

  return Object.keys(data).reduce((acc, key) => {
    acc[key] = processJsonLocalizedData(data[key], language)
    return acc
  }, {})
}

// function to convert an image stored in a path to png and to base64 string
const imageToPngBase64 = async (path, scale) => {
  let imageBuffer, image

  // read the image file
  try {
    imageBuffer = await readFile(path)
    image = sharp(imageBuffer)
  } catch (error) {
    error.message = `Warning: Couldn't load the image on "${path}". The image will be ignored.`
    throw error
  }

  // resize if scale is specified
  if (scale > 0 && scale <= 1) {
    const metadata = await image.metadata()
    const width = Math.round((metadata.width || 1) * scale)
    image = image.resize({ width })
  }

  // convert to png, to base64, and return
  return (await image.png().toBuffer()).toString('base64')
}

// useful wrapper to read the data of a file
const readFileData = async (path, createIfNotExist = false) => {
  let data = undefined
  if (createIfNotExist) {
    await fsx.ensureFile(path)
  }
  try {
    data = await readFile(path, {
      encoding: 'utf-8',
    })
  } catch (error) {
    error.message = `Couldn't read the file: ${path}`
    throw error
  }
  return data
}

// function to parse and set margins as an object for puppeteer
const getMargins = (input) => {
  let result = {}
  if (!(typeof input === 'string')) return result

  const items = input.split(':')
  if (items.length !== 4) return result

  const labels = ['top', 'right', 'bottom', 'left']
  items.forEach((item, key) => {
    const pattern = /^\d+(px|pt|cm|mm|in)?$/
    if (pattern.test(item)) result[labels[key]] = item
  })

  return result
}

// handlebars: register `markdown` helper
const registerHandlebarsMarkdown = () => {
  Handlebars.registerHelper('markdown', (text) => {
    return new Handlebars.SafeString(parseInline(text || ''))
  })
}

// handlebars: register `image` helper
const registerHandlebarsImage = () => {
  Handlebars.registerHelper('image', (img, opt) => {
    if (!img || !img.base64) {
      return ''
    }

    const roundness = opt.hash.roundness || 0
    const width = opt.hash.width || '100px'
    const height = opt.hash.height || width

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

// handlebars: register `date` helper
const registerHandlebarsDate = (locale) => {
  Handlebars.registerHelper('date', (text) => {
    const date = new Date(text)
    return new Handlebars.SafeString(
      new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
      }).format(date),
    )
  })
}

// handlebars: unregister `date` helper
const unregisterHandlebarsDate = () => {
  Handlebars.unregisterHelper('date')
}

// main function
const main = async () => {
  try {
    // define the main app config object
    const AppConfig = {}

    // initialize the main app config
    initializeAppConfig(AppConfig)

    // check the app directory
    await checkAppDir(AppConfig)

    // registering a helper for markdown
    registerHandlebarsMarkdown()

    // registering a helper for images
    registerHandlebarsImage()

    // load user config
    const config = await getUserConfig(
      AppConfig.CONFIG_FILE_PATH,
      AppConfig.DEFAULT_USER_CONFIG,
    )
    // load command line options
    const options = await getCommandLineOptions(config)

    // restore default data if the option `restore` is set
    if (options.restore) {
      await restoreDefault(AppConfig, options.force)
      console.log('Info: Restored' + (options.force ? ' (force)' : ''))
      process.exit(0)
    }

    // load cv json file data
    const cvData = await getSourceData(options.input)
    if (!cvData) return

    // process icons and images
    const processedCvData = await processJsonImages(
      await processJsonIcons(cvData, AppConfig.APP_DIR),
      AppConfig.APP_DIR,
    )

    // walk through selected templates
    for (const template of options.templates) {
      // look for common template and read it if found
      const templateData = await readFileData(
        join(options.templatesDir, `${template}.hbs`),
      )
      if (!templateData) continue

      // walk through selected locales
      for (const locale of options.locales) {
        // registering helper for date (according to the locale)
        registerHandlebarsDate(locale)

        // determine language from the processing locale
        const lang = String(locale).split('-')[0]

        // setting up the output pdf file path
        const outputPath = join(options.output, `${template}_${locale}.pdf`)

        // language-mapped json data
        const localizedCvData = processJsonLocalizedData(processedCvData, lang)

        // compile html
        const html = Handlebars.compile(templateData)({
          ...localizedCvData,
        })

        // prepare puppeteer to render pdf
        const browser = await launch()
        const page = await browser.newPage()

        // render and save pdf
        await page.setContent(html, { waitUntil: 'networkidle0' })
        await page.pdf({
          path: outputPath,
          format: 'A4',
          margin: getMargins(options.margins),
          printBackground: true,
          preferCSSPageSize: true,
        })
        await page.close()

        await browser.close()
        console.log(`Info: PDF saved: "${outputPath}"`)

        // unregistering helper for date
        unregisterHandlebarsDate()
      }
    }
  } catch (error) {
    console.error(error.message)
  }
}

// run
main()
