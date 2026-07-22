/**
 * WCAG 2.1 Color Contrast Validation
 * Validates bakery theme colors meet accessibility requirements
 */

/**
 * Calculate relative luminance of a color
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  // Convert 0-255 to 0-1
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }) as [number, number, number]

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Parse color string to RGB
 * Supports: #fff, #ffffff, rgb(255,255,255)
 */
function parseColor(color: string): { r: number; g: number; b: number } | null {
  const hex = color.match(/^#?([a-f\d]{3}|[a-f\d]{6})$/i)
  if (hex && hex[1]) {
    let hexStr = hex[1]
    if (hexStr.length === 3) {
      hexStr = hexStr
        .split('')
        .map((c) => c + c)
        .join('')
    }
    return {
      r: parseInt(hexStr.slice(0, 2), 16),
      g: parseInt(hexStr.slice(2, 4), 16),
      b: parseInt(hexStr.slice(4, 6), 16),
    }
  }

  const rgb = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
  if (rgb && rgb[1] && rgb[2] && rgb[3]) {
    return {
      r: parseInt(rgb[1], 10),
      g: parseInt(rgb[2], 10),
      b: parseInt(rgb[3], 10),
    }
  }

  return null
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 */
export function getContrastRatio(color1: string, color2: string): number {
  const c1 = parseColor(color1)
  const c2 = parseColor(color2)

  if (!c1 || !c2) {
    throw new Error(`Invalid color format: ${color1} or ${color2}`)
  }

  const l1 = getRelativeLuminance(c1.r, c1.g, c1.b)
  const l2 = getRelativeLuminance(c2.r, c2.g, c2.b)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * WCAG 2.1 Level AA contrast requirements
 */
const CONTRAST_LEVELS = {
  AA_NORMAL: 4.5, // Normal text (< 18pt)
  AA_LARGE: 3, // Large text (≥ 18pt or ≥ 14pt bold)
  AA_UI: 3, // UI components and graphical objects
}

export interface ContrastValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  ratios: {
    primary: number
    secondary: number
    accent: number
  }
}

/**
 * Validate bakery theme colors meet WCAG AA contrast requirements
 *
 * Requirements:
 * - Primary text on primary background: 4.5:1
 * - Secondary text on secondary background: 4.5:1
 * - Accent on background: 3:1 minimum
 *
 * Critical failures (errors) reject the theme.
 * Secondary failures (warnings) allow but notify.
 */
export function validateThemeContrast(theme: {
  primaryColor: string
  primaryTextColor: string
  secondaryColor?: string
  secondaryTextColor?: string
  accentColor?: string
  backgroundColor?: string
}): ContrastValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const ratios: { primary: number; secondary: number; accent: number } = {
    primary: 0,
    secondary: 0,
    accent: 0,
  }

  // Primary text on primary background (critical)
  try {
    const primaryRatio = getContrastRatio(theme.primaryColor, theme.primaryTextColor)
    ratios.primary = Math.round(primaryRatio * 100) / 100

    if (primaryRatio < CONTRAST_LEVELS.AA_NORMAL) {
      errors.push(
        `Primary text on primary background has ${ratios.primary}:1 contrast, ` +
          `but WCAG AA requires 4.5:1 for normal text.`,
      )
    }
  } catch (e) {
    errors.push(`Invalid primary colors: ${(e as Error).message}`)
  }

  // Secondary text on secondary background (warning level)
  if (theme.secondaryColor && theme.secondaryTextColor) {
    try {
      const secondaryRatio = getContrastRatio(theme.secondaryColor, theme.secondaryTextColor)
      ratios.secondary = Math.round(secondaryRatio * 100) / 100

      if (secondaryRatio < CONTRAST_LEVELS.AA_NORMAL) {
        warnings.push(
          `Secondary text on secondary background has ${ratios.secondary}:1 contrast. ` +
            `WCAG AA recommends 4.5:1 for normal text.`,
        )
      }
    } catch (e) {
      warnings.push(`Invalid secondary colors: ${(e as Error).message}`)
    }
  }

  // Accent on background (warning level)
  if (theme.accentColor && theme.backgroundColor) {
    try {
      const accentRatio = getContrastRatio(theme.accentColor, theme.backgroundColor)
      ratios.accent = Math.round(accentRatio * 100) / 100

      if (accentRatio < CONTRAST_LEVELS.AA_UI) {
        warnings.push(
          `Accent color on background has ${ratios.accent}:1 contrast. ` +
            `WCAG AA recommends 3:1 for UI components.`,
        )
      }
    } catch (e) {
      warnings.push(`Invalid accent colors: ${(e as Error).message}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    ratios,
  }
}

/**
 * Format contrast ratio for display
 */
export function formatContrastRatio(ratio: number): string {
  return `${Math.round(ratio * 100) / 100}:1`
}

/**
 * Check if contrast meets WCAG AA standard
 */
export function meetsWCAGAA(contrast: number, type: 'normal' | 'large' | 'ui' = 'normal'): boolean {
  const required = {
    normal: CONTRAST_LEVELS.AA_NORMAL,
    large: CONTRAST_LEVELS.AA_LARGE,
    ui: CONTRAST_LEVELS.AA_UI,
  }
  return contrast >= required[type]
}

/**
 * Get closest WCAG AA compliant color by adjusting lightness
 * Simple algorithm: lightens/darkens color until contrast improves
 *
 * Note: This is a simplified version. Production implementations
 * may need more sophisticated color adjustment algorithms.
 */
export function adjustColorForContrast(
  foreground: string,
  background: string,
  targetContrast: number = CONTRAST_LEVELS.AA_NORMAL,
): string | null {
  const fg = parseColor(foreground)
  const bg = parseColor(background)

  if (!fg || !bg) {
    return null
  }

  // Try lightening and darkening the foreground color
  // by adjusting each component
  for (let adjustment = 1; adjustment <= 255; adjustment += 5) {
    // Try lighter version
    const lighter = {
      r: Math.min(255, fg.r + adjustment),
      g: Math.min(255, fg.g + adjustment),
      b: Math.min(255, fg.b + adjustment),
    }

    const lighterHex =
      '#' +
      [lighter.r, lighter.g, lighter.b]
        .map((c) => c.toString(16).padStart(2, '0'))
        .join('')

    const lighterRatio = getContrastRatio(lighterHex, background)
    if (lighterRatio >= targetContrast) {
      return lighterHex
    }

    // Try darker version
    const darker = {
      r: Math.max(0, fg.r - adjustment),
      g: Math.max(0, fg.g - adjustment),
      b: Math.max(0, fg.b - adjustment),
    }

    const darkerHex =
      '#' +
      [darker.r, darker.g, darker.b]
        .map((c) => c.toString(16).padStart(2, '0'))
        .join('')

    const darkerRatio = getContrastRatio(darkerHex, background)
    if (darkerRatio >= targetContrast) {
      return darkerHex
    }
  }

  return null
}

/**
 * Test a palette of colors for accessibility
 */
export function validateColorPalette(
  colors: Record<string, string>,
  background: string,
): Record<string, { ratio: number; accessible: boolean }> {
  const results: Record<string, { ratio: number; accessible: boolean }> = {}

  for (const [name, color] of Object.entries(colors)) {
    try {
      const ratio = getContrastRatio(color, background)
      results[name] = {
        ratio: Math.round(ratio * 100) / 100,
        accessible: meetsWCAGAA(ratio),
      }
    } catch (e) {
      results[name] = {
        ratio: 0,
        accessible: false,
      }
    }
  }

  return results
}
