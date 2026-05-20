#!/usr/bin/env node

/**
 * Icon Variant Generator for Eat Good Uganda
 * Generates 32px and 48px variants from 24px base icons
 * Creates default, hover, active, and disabled state variants
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SIZE_CONFIGS = {
  24: { stroke: 2, nameSuffix: '_24' },
  32: { stroke: 2.67, nameSuffix: '_32' },
  48: { stroke: 4, nameSuffix: '_48' },
}

const STATES = {
  default: {
    strokeColor: '#333333',
    accentColor: '#FF6B35',
    opacity: '1.0',
    nameSuffix: '_default',
  },
  hover: {
    strokeColor: '#333333',
    accentColor: '#FF6B35',
    opacity: '1.0',
    nameSuffix: '_hover',
  },
  active: {
    strokeColor: '#FF6B35',
    accentColor: '#FF6B35',
    opacity: '1.0',
    nameSuffix: '_active',
  },
  disabled: {
    strokeColor: '#CCCCCC',
    accentColor: '#CCCCCC',
    opacity: '0.4',
    nameSuffix: '_disabled',
  },
}

function scaleSvgContent(svgContent, fromSize, toSize) {
  const strokeScaleFactor = toSize / fromSize

  // Extract all opacity attributes and store them
  const opacityMap = new Map()
  let opacityIndex = 0
  const tempContent = svgContent.replace(/opacity="([0-9.]+)"/g, (match, value) => {
    const key = `__OPACITY_${opacityIndex}__`
    opacityMap.set(key, value)
    opacityIndex++
    return `opacity="${key}"`
  })

  let result = tempContent

  // IMPORTANT: Keep viewBox at base 24x24 (do NOT scale it)
  result = result.replace(/viewBox="0 0 (\d+) (\d+)"/, 'viewBox="0 0 24 24"')

  // Update width and height attributes only
  result = result.replace(/width="\d+"/, `width="${toSize}"`)
  result = result.replace(/height="\d+"/, `height="${toSize}"`)

  // Scale stroke-width ONLY (do NOT scale coordinates)
  result = result.replace(/stroke-width="([0-9.]+)"/g, (match, value) => {
    const scaled = parseFloat(value) * strokeScaleFactor
    return `stroke-width="${scaled.toFixed(2)}"`
  })

  // Scale font-size if present
  result = result.replace(/font-size="([0-9.]+)"/g, (match, value) => {
    const scaled = parseFloat(value) * strokeScaleFactor
    return `font-size="${scaled.toFixed(2)}"`
  })

  // Restore opacity values
  for (const [key, value] of opacityMap) {
    result = result.replace(new RegExp(`opacity="${key}"`, 'g'), `opacity="${value}"`)
  }

  return result
}

function applyStateColors(svgContent, stateConfig) {
  const opacity = stateConfig.opacity
  const strokeColor = stateConfig.strokeColor
  const accentColor = stateConfig.accentColor

  // Replace stroke color
  let result = svgContent.replace(/stroke="#333333"/g, `stroke="${strokeColor}"`)

  // Replace accent color
  result = result.replace(/fill="#FF6B35"/g, `fill="${accentColor}"`)
  result = result.replace(/stroke="#FF6B35"/g, `stroke="${accentColor}"`)

  // Add opacity if not 1.0
  if (opacity !== '1.0') {
    result = result.replace(/<svg\s+([^>]*)>/, `<svg $1 opacity="${opacity}">`)
  }

  return result
}

function generateVariants() {
  const iconDir = __dirname
  const paymentDir = path.join(iconDir, 'payment')
  const deliveryDir = path.join(iconDir, 'delivery')
  const productDir = path.join(iconDir, 'product')
  const navigationDir = path.join(iconDir, 'navigation')

  const baseIcons = []

  // Find base icons (24px versions without size/state suffixes)
  for (const dir of [paymentDir, deliveryDir, productDir, navigationDir]) {
    if (!fs.existsSync(dir)) {
      console.warn(`Warning: Directory ${dir} does not exist`)
      continue
    }
    const files = fs.readdirSync(dir)
    for (const file of files) {
      if (
        file.endsWith('.svg') &&
        !file.includes('_32') &&
        !file.includes('_48') &&
        !file.includes('_hover') &&
        !file.includes('_active') &&
        !file.includes('_disabled')
      ) {
        baseIcons.push(path.join(dir, file))
      }
    }
  }

  console.log(`Found ${baseIcons.length} base icons to process\n`)

  for (const baseIcon of baseIcons.sort()) {
    console.log(`Processing: ${path.basename(baseIcon)}`)
    const baseContent = fs.readFileSync(baseIcon, 'utf8')
    const baseName = path.basename(baseIcon, '.svg')
    const baseDir = path.dirname(baseIcon)

    // Generate variants for each size
    for (const [size, sizeConfig] of Object.entries(SIZE_CONFIGS)) {
      const sizeNum = parseInt(size)

      if (sizeNum === 24) {
        // Generate all state variants for 24px
        for (const [stateName, stateConfig] of Object.entries(STATES)) {
          const newContent = applyStateColors(baseContent, stateConfig)
          const newName = `${baseName}${sizeConfig.nameSuffix}${stateConfig.nameSuffix}.svg`
          const newPath = path.join(baseDir, newName)

          fs.writeFileSync(newPath, newContent)
          console.log(`  ✓ ${newName}`)
        }
      } else {
        // Scale to new size
        const scaledContent = scaleSvgContent(baseContent, 24, sizeNum)

        // Generate state variants for this size
        for (const [stateName, stateConfig] of Object.entries(STATES)) {
          const stateContent = applyStateColors(scaledContent, stateConfig)

          let suffixParts = [sizeConfig.nameSuffix]
          if (stateConfig.nameSuffix) {
            suffixParts.push(stateConfig.nameSuffix)
          }

          const newName = `${baseName}${suffixParts.join('')}.svg`
          const newPath = path.join(baseDir, newName)

          fs.writeFileSync(newPath, stateContent)
          console.log(`  ✓ ${newName}`)
        }
      }
    }
  }

  console.log('\n✓ All variants generated successfully!')
}

generateVariants()
