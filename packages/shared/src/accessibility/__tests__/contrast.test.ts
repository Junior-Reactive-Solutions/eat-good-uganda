import { describe, it, expect } from 'vitest'
import {
  getContrastRatio,
  validateThemeContrast,
  meetsWCAGAA,
  formatContrastRatio,
  validateColorPalette,
} from '../contrast'

describe('Color Contrast Validation', () => {
  describe('getContrastRatio', () => {
    it('should calculate contrast ratio between black and white', () => {
      const ratio = getContrastRatio('#000000', '#ffffff')
      expect(ratio).toBe(21) // Maximum contrast
    })

    it('should calculate contrast ratio between similar colors', () => {
      const ratio = getContrastRatio('#ffffff', '#f0f0f0')
      expect(ratio).toBeLessThan(2)
    })

    it('should handle RGB format', () => {
      const ratio = getContrastRatio('rgb(0,0,0)', 'rgb(255,255,255)')
      expect(ratio).toBe(21)
    })

    it('should handle 3-character hex codes', () => {
      const ratio = getContrastRatio('#000', '#fff')
      expect(ratio).toBe(21)
    })
  })

  describe('meetsWCAGAA', () => {
    it('should pass WCAG AA normal text requirement (4.5:1)', () => {
      expect(meetsWCAGAA(4.5, 'normal')).toBe(true)
      expect(meetsWCAGAA(4.4, 'normal')).toBe(false)
    })

    it('should pass WCAG AA large text requirement (3:1)', () => {
      expect(meetsWCAGAA(3, 'large')).toBe(true)
      expect(meetsWCAGAA(2.9, 'large')).toBe(false)
    })

    it('should pass WCAG AA UI component requirement (3:1)', () => {
      expect(meetsWCAGAA(3, 'ui')).toBe(true)
      expect(meetsWCAGAA(2.9, 'ui')).toBe(false)
    })
  })

  describe('formatContrastRatio', () => {
    it('should format ratio as "X:1" string', () => {
      expect(formatContrastRatio(4.5)).toBe('4.5:1')
      expect(formatContrastRatio(21)).toBe('21:1')
    })
  })

  describe('validateThemeContrast', () => {
    it('should pass high contrast theme', () => {
      const result = validateThemeContrast({
        primaryColor: '#ffffff',
        primaryTextColor: '#000000',
      })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail low contrast primary theme', () => {
      const result = validateThemeContrast({
        primaryColor: '#ffffff',
        primaryTextColor: '#f0f0f0',
      })
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should warn on low contrast secondary colors', () => {
      const result = validateThemeContrast({
        primaryColor: '#ffffff',
        primaryTextColor: '#000000',
        secondaryColor: '#f5f5f5',
        secondaryTextColor: '#e0e0e0',
      })
      expect(result.valid).toBe(true)
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('should include all contrast ratios', () => {
      const result = validateThemeContrast({
        primaryColor: '#ffffff',
        primaryTextColor: '#000000',
        secondaryColor: '#f0f0f0',
        secondaryTextColor: '#555555',
        accentColor: '#ff6600',
        backgroundColor: '#ffffff',
      })
      expect(result.ratios.primary).toBeGreaterThan(0)
      expect(result.ratios.secondary).toBeGreaterThan(0)
      expect(result.ratios.accent).toBeGreaterThan(0)
    })
  })

  describe('validateColorPalette', () => {
    it('should validate multiple colors against background', () => {
      const palette = {
        dark: '#000000',
        light: '#ffffff',
        gray: '#808080',
      }

      const results = validateColorPalette(palette, '#ffffff')

      expect(results.dark.accessible).toBe(true)
      expect(results.light.accessible).toBe(false)
      expect(results.gray.ratio).toBeGreaterThan(0)
    })
  })

  describe('Real-world bakery themes', () => {
    it('should validate Kampala Crust theme', () => {
      const result = validateThemeContrast({
        primaryColor: '#8B4513', // Saddle brown
        primaryTextColor: '#FFFFFF',
        accentColor: '#D2691E', // Chocolate
        backgroundColor: '#FFF8DC', // Cornsilk
      })
      expect(result.valid).toBe(true)
      expect(result.ratios.primary).toBeGreaterThan(4.5)
    })

    it('should reject low contrast bakery theme', () => {
      const result = validateThemeContrast({
        primaryColor: '#FFEEEE', // Very light red
        primaryTextColor: '#FFE0E0', // Slightly darker light red
      })
      expect(result.valid).toBe(false)
    })
  })
})
