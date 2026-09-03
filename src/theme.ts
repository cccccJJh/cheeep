const KEY = 'cheeep-theme'

export type ThemeName = 'mint' | 'pika'

export function readTheme(): ThemeName {
  try {
    return localStorage.getItem(KEY) === 'pika' ? 'pika' : 'mint'
  } catch {
    return 'mint'
  }
}

export function applyTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* ignore */
  }
}
