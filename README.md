# CV Builder

💻 A CLI utility to build pretty CV in PDF format 📕 based on JSON CV data and a Handlebars template.

## Dependencies

- `fs-extra` to interact with filesystem conveniently
- `handlebars` as a template processor
- `marked` to provide Markdown support
- `puppeteer` to build PDF
- `sharp` to preload and process images
- `yargs` to manage and process command-lime arguments conveniently

## Why?

The project was inspired by [JSON Resume](https://jsonresume.org/).

### Advantages

- No strict JSON schema
  - Though special fields are made to provide Markdown support, translations, icons or images
- Markdown support
- Multilingual support (you can provide multiple translations in special JSON fields)
- Ready to use without complicated setup
- Complete working example out-of-the-box
- The data is separated from its representation
  - You can have some private data that will not be visible in the result
  - You only focus either on your data or on how it looks.

### Disadvantages

- Requires basic knowledge of HTML / CSS / Handlebars
- Some dependencies such as **Pupetteer** are heavy.

## Installation

```bash
mkdir cv-builder
cd cv-builder
git clone git@github.com:ewwmy/cv-builder.git .
npm install -g .
```

## Uninstallation

```bash
npm uninstall -g @ewwmy/cv-builder
```

> Note that the application directory on `~/.config/ewwmy/cv-builder` and all the contents inside will be preserved.

## How it works

Once installed, it cerates all the needed files and folders in `~/.config/ewwmy/cv-builder`.

They are:

- `icons`: default base folder to find icons; a set of the most useful icons is included
- `images`: default base folder to find images; an example AI-generated user photo is included
- `templates`: default folder to store templates; a template example is included
- `cv-example.json`: example of the JSON CV data
- `out`: default folder where compiled PDF files are saved
- `settings/settings.json`: settings file that you can configure

## Usage

### Basics

After the installation, the utility can be called everywhere as `cv-builder`.

You can run the builder out-of-the-box without any preparations:

```bash
cv-builder
```

It runs building the example that is included inside and set up by default.

Classically, you can print the current version and get useful help:

```bash
cv-builder --version
cv-builder --help
```

As you can see in the help, there is a lot of options that you can adjust. Options passed in the command line, override the options that set up in the settings file (`settings/settings.json`).

If you broke something, don't worry. You can always restore the default configuration, files and folders in `~/.config/ewwmy/cv-builder`:

```bash
cv-builder --restore
```

> Note that `cv-builder --restore` doesn't overwrite existing files. If you are sure the existing files don't contain any crucial information that needs to backup, you can force overwriting:

```bash
cv-builder --restore --force
```

### JSON

> By default, the JSON CV Data is placed here: `~/.config/ewwmy/cv-builder/cv-example.json`.

You can create any structure. However, some field names are preserved and used to implement the features. Please, refer to the **Features Overview** section to learn them.

You can also learn the example in `~/.config/ewwmy/cv-builder/cv-example.json`. It covers all the features and offers an idea how you can organize your data.

### Default Settings

> Default settings file is placed here: `~/.config/ewwmy/cv-builder/settings/settings.json`. It should not be moved.

| Option               | Command-line            | Type     | Description                                                     |
| -------------------- | ----------------------- | -------- | --------------------------------------------------------------- |
| `LOCALES`            | `-l`, `--locales`       | `array`  | Locales (languages) to build                                    |
| `TEMPLATES`          | `-t`, `templates`       | `array`  | Template files to build (without `.hbs` suffix)                 |
| `INPUT_CV_FILE_PATH` | `-i`, `--input`         | `string` | Path to the JSON file with the data of your CV                  |
| `OUTPUT_DIR`         | `-o`, `--output`        | `string` | Directory for the built PDF files                               |
| `TEMPLATES_DIR`      | `-d`, `--templates-dir` | `string` | Directory for the templates                                     |
| `BASE_IMAGES_DIR`    | `--images-base-dir`     | `string` | Base directory for relative paths of images in the JSON CV Data |
| `BASE_ICONS_DIR`     | `--icons-base-dir`      | `string` | Base directory for relative paths of icons in the JSON CV Data  |

### Templates

The CV Builder uses Handlebars template engine and comes with an example that you can find here: `~/.config/ewwmy/cv-builder/templates/example.hbs`.

Please, read the [Handlebars Guide](https://handlebarsjs.com/guide/) to get more detailed information on how to use it.

You can create as many templates as you want. Template files should have `.hbs` extension. You can specify the templates you want to build either in command-line options (higher priority) or in `settings.json` / `TEMPLATES`, by only providing the names without `.hbs` extension. The directory to find templates can be specified either in command-line options (higher priority) or in `settings.json` / `TEMPLATES_DIR`.

There are features you can use in a template. Please, refer to the **Features Overview** section to learn them.

### Features Overview

| Feature   | JSON                                                       | Template                                                    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------- | ---------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Markdown  | `{ "data": "My **markdown** text"`                         | `{{markdown data}}`                                         | You can use markdown at any level of the JSON. Local paths to the resources are not supported. Builds as a text node.                                                                                                                                                                                                                                                                                                                          |
| Image     | `{"data": {"type": "image", "path": "...", "scale": 0.5}}` | `{{{image data width='150px' height='150px' roundness=1}}}` | In JSON, `type` and `path` are required. `type` must be `"image"`. `path` can be either relative (to the default base folder for images) or absolute; URLs are not supported. `scale` is optional and can be used to reduce image size if it's too large. In a template, `data` means the JSON field name of the image. `width`, `height` and `roundness` (`0`..`1`) are optional and used to adjust the result CSS. Builds as an `<img>` tag. |
| Icon      | `{"icon": "linkedin-logo.svg"}`                            | `{{{icon}}}`                                                | Loads an SVG icon. In JSON, it should be a field with the name `icon` that contains either relative (to the default base folder for icons) or absolute path.; URLs are not supported. Builds as an `<svg>` tag.                                                                                                                                                                                                                                |
| Languages | `{"data": {"en": "English text", "ru": "Russian text"}}`   | `{{data}}`                                                  | Multilingual support. Each language will be used for a corresponding locale option specified to build. In JSON, use double-letter language code. If there is no translation with the required language, it may cause an error. Can be used together with `markdown`, e.g., `{{markdown data}}`. Builds as a text node with a required language.                                                                                                |
| Date      | `{"startedAt": "2020-12-31"}`                              | `{{date startedAt}}`                                        | Used to pretty print dates according to used locales. In JSON, date must be in the format `YYYY-MM-DD`. Builds as a text node.                                                                                                                                                                                                                                                                                                                 |
