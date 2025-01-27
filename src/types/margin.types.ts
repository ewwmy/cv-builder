export type MarginLabel = 'top' | 'right' | 'bottom' | 'left'

export type MarginObject = {
  [key in MarginLabel]?: string
}
