# CV Builder

💻 A CLI utility to generate a well-formatted CV in PDF format 📕 based on JSON CV data and a Handlebars template.

## Dependencies

- `fs-extra` for convenient filesystem interactions
- `handlebars` as the template processor
- `marked` to provide Markdown support
- `puppeteer` to generate PDFs
- `sharp` to preload and process images
- `yargs` to manage and process command-line arguments conveniently

## Why?

This project was inspired by [JSON Resume](https://jsonresume.org/). The main idea of this project is to provide you a convenient way to store the information about your work experience, achievments, and other CV data separately from its representation, in multiple languages, in one place, and to easily generate good-looking multilingual CVs in PDF format in one command.

For example, you might get tired of managing multiple CV versions in office document files. You want to add a new record in your CV and you might get confused which version is more actual or you need to add this record into all the versions. This application solves that problem.

### Advantages

- No strict JSON schema
  - Special fields enable features like Markdown support, translations, icons, or images
- Markdown support
- Multilingual support (provide multiple translations in dedicated JSON fields)
- Ready to use without complex setup
- Fully functional example included out of the box
- Clear separation of data and presentation
  - You can include private data that won't appear in the final output
  - Allows focus either on the data or on the design separately
- Privacy-oriented (no data is processed or collected outside your computer).

### Disadvantages

- Requires basic knowledge of HTML, CSS, and Handlebars
- Some dependencies, such as **Puppeteer**, are resource-heavy.

## Installation

```bash
mkdir cv-builder
cd cv-builder
git clone git@github.com:ewwmy/cv-builder.git .
npm ci
npm install -g .
```

## Uninstallation

```bash
npm uninstall -g @ewwmy/cv-builder
```

> Note: The application directory located at `~/.config/ewwmy/cv-builder` and all its contents will be preserved.

## How it works

After installation, the utility creates all the necessary files and folders in `~/.config/ewwmy/cv-builder`.

They are:

- `icons`: default base folder for icons (in case of relative paths); includes a set of common icons
- `images`: default base folder for images (in case of relative paths); includes an example AI-generated user photo
- `templates`: default folder for templates; includes an example template
- `cv-example.json`: example JSON CV data
- `out`: default folder for generated PDF files
- `settings/settings.json`: configuration file with the user preferences.

When you run the program, it:

- reads the configuration to determine what files to use, where they are stored and where to save the results
- reads the input CV JSON file
- reads selected templates
- consider seleted languages
- compiles PDF based on the CV JSON data and selected templates and languages; amount of the result PDF files is **amount of the selected templates** multiplied by **amount of the selected languages**.

## Usage

### Basics

Once installed, you can call the utility from anywhere using `cv-builder` command.

You can run it immediately with no additional setup:

```bash
cv-builder
```

This builds the included example.

As a common practice for CLI utilities, you can also check the version or access helpful usage information:

```bash
cv-builder --version
cv-builder --help
```

### Command-line options

Main command-line options:

- `-l`, `--locales`: locales (languages) to build (e.g., `-l en-US -l ru-RU` or `-l en-US ru-RU`)
- `-t`, `templates`: template files to build without `.hbs` suffix (e.g., `-t example -t main -t another-cool-template` or `-t example main another-cool-template`)
- `-i`, `--input`: path to the JSON file with the data of your CV (e.g., `-i /home/user/my-cv.json`)
- `-o`, `--output`: directory for the built PDF files (e.g., `-o /home/user/my-cv`)
- `-d`, `--templates-dir`: directory for the templates (e.g., `-o /home/user/my-cv-templates`)

Command-line options override settings defined in `settings/settings.json`. For detailed information about the configuration, please refer to the **Default Configuration** section.

If you accidentally misconfigure something, you can restore the default setup:

```bash
cv-builder --restore
```

> Note: `cv-builder --restore` does not overwrite existing files. To force overwrite, use:

```bash
cv-builder --restore --force
```

### Default Configuration

> Default settings file: `~/.config/ewwmy/cv-builder/settings/settings.json`. You should not move or rename it.

These are configuration options and their corresponding command-line options:

| Option               | Command-line            | Type     | Description                                                 |
| -------------------- | ----------------------- | -------- | ----------------------------------------------------------- |
| `LOCALES`            | `-l`, `--locales`       | `array`  | Locales (languages) to build                                |
| `TEMPLATES`          | `-t`, `templates`       | `array`  | Template files to build (omit the `.hbs` extension)         |
| `INPUT_CV_FILE_PATH` | `-i`, `--input`         | `string` | Path to the JSON file containing CV data                    |
| `OUTPUT_DIR`         | `-o`, `--output`        | `string` | Directory for the generated PDF files                       |
| `TEMPLATES_DIR`      | `-d`, `--templates-dir` | `string` | Directory containing the templates                          |
| `BASE_IMAGES_DIR`    | `--images-base-dir`     | `string` | Base directory for relative image paths in the JSON CV data |
| `BASE_ICONS_DIR`     | `--icons-base-dir`      | `string` | Base directory for relative icon paths in the JSON CV data  |

### CV JSON File

> The example file at `~/.config/ewwmy/cv-builder/cv-example.json` is used by default. It demonstrates all features and provides a template for organizing your data. It's highly recommended to explore it.

You can create any structure, use any valid JSON data, but some field names are reserved for specific features. Refer to the **Features Overview** section for details.

### Templates

CV Builder uses the Handlebars template engine and includes an example template at `~/.config/ewwmy/cv-builder/templates/example.hbs`.

Please, refer to the [Handlebars Guide](https://handlebarsjs.com/guide/) for more information on using Handlebars.

You can create as many templates as needed. Template files must have the `.hbs` extension. Specify templates you need to generate PDF with in the `TEMPLATES` setting or via command-line options. Similarly, the directory for templates can be configured via the `TEMPLATES_DIR` setting or command-line options.

> Note: The options provided via command-line override the options from the `settings/settings.json` configuration file.

### Features

#### Markdown Support

You can use Markdown anywhere in your JSON data. To render Markdown in templates, use the `{{markdown}}` helper.

##### JSON Example

```json
{
  "description": "This is **bold** and _italic_"
}
```

##### Template Usage

```handlebars
{{markdown description}}
```

> Note: The `markdown` is the special helper name and the `description` refers to the name of the JSON field.

#### Image Handling

To include an image, use a specific JSON structure and the `{{{image}}}` helper in the template.

##### JSON Example

```json
{
  "profilePicture": {
    "type": "image",
    "path": "profile.jpg",
    "scale": 0.5
  }
}
```

- `type`: required; must be `"image"`
- `path`: required; relative to the base image folder or an absolute path
- `scale`: optional; reduces image size; defaults to `1`; useful if the original image is too large and can cause aliasing while

##### Template Usage

```handlebars
{{{image profilePicture width='150px' height='150px' roundness=1}}}
```

- `width`: optional; a valid CSS value for the resulting image in the generated PDF
- `height`: optional; a valid CSS value for the resulting image in the generated PDF
- `roundness`: optional; defaults to `0` which means no roundness; `1` means an ideal circle.

> Note: The `image` is the special helper name and the `profilePicture` refers to the name of the JSON field.

#### Icons Support

Icons are loaded from SVG files. Use the `icon` field in your JSON and the `{{{icon}}}` helper in a template.

##### JSON Example

```json
{
  "social": {
    "icon": "linkedin-logo.svg"
  }
}
```

> The path must be either absolute or relative to the base icons directory which is specified in the configuration or command-line.

##### Template Usage

```handlebars
{{{icon social.icon}}}
```

#### Multilingual Support

You can include translations for any field in JSON using locale keys (e.g., `en`, `ru`). Specify the locales when building the CV or set up the default locales in the configuration.

The locale determines which translation is used. If you have 2 translations in your JSON (e.g., `en`, `ru`) and specify both in the configuration or in command-line, it will create 2 PDF files with each translation provided.

##### JSON Example

```json
{
  "greeting": {
    "en": "Hello",
    "ru": "Привет"
  }
}
```

##### Template Usage

```handlebars
{{greeting}}
```

#### Date Formatting

Dates are formatted based on the specified locale. Use the `{{date}}` helper for pretty printing.

##### JSON Example

```json
{
  "startedAt": "2020-12-31"
}
```

The date must be in `YYYY-MM-DD` format.

##### Template Usage

```handlebars
{{date startedAt}}
```
