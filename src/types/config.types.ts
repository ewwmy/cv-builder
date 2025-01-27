export type UserConfig = {
  LOCALES: string[]
  TEMPLATES: string[]
  INPUT_CV_FILE_PATH: string
  OUTPUT_DIR: string
  TEMPLATES_DIR: string
  BASE_IMAGES_DIR: string
  BASE_ICONS_DIR: string
}

export type Config = {
  APP_GROUP_NAME: string
  APP_NAME: string

  EXAMPLE_CV: string
  EXAMPLE_IMAGES: string
  EXAMPLE_ICONS: string
  EXAMPLE_TEMPLATES: string

  APP_DIR: string

  CONFIG_DIR: string
  CONFIG_FILE_PATH: string

  EXAMPLES_DIR: string
  EXAMPLE_CV_FILE_PATH: string
  EXAMPLE_IMAGES_DIR: string
  EXAMPLE_ICONS_DIR: string
  EXAMPLE_TEMPLATES_DIR: string

  DEFAULT_CV_FILE_PATH: string
  DEFAULT_IMAGES_DIR: string
  DEFAULT_ICONS_DIR: string
  DEFAULT_TEMPLATES_DIR: string
  DEFAULT_OUTPUT_DIR: string

  DEFAULT_USER_CONFIG: UserConfig
}
