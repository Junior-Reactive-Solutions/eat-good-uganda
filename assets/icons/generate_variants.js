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
  24: { stroke: 2, nameSuffix: '' },
  32: { stroke: 2.67, nameSuffix: '_32' },
  48: { stroke: 4, nameSuffix: '_48' },
}

const STATES = {
  default: {
    strokeColor: '#333333',
    accentColor: '#FF6B35',
    opacity: '1.0',
    nameSuffix: '',
  },
  hover: {
    strokeColor: '#FF6B35',
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
  const scaleFactor = toSize / fromSize

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

  // Update viewBox
  result = result.replace(/viewBox="0 0 (\d+) (\d+)"/, `viewBox="0 0 ${toSize} ${toSize}"`)

  // Update width and height
  result = result.replace(/width="\d+"/, `width="${toSize}"`)
  result = result.replace(/height="\d+"/, `height="${toSize}"`)

  // Scale numeric attributes
  const attrs = ['cx', 'cy', 'r', 'x', 'y', 'x1', 'x2', 'y1', 'y2']
  for (const attr of attrs) {
    const regex = new RegExp(`${attr}="([0-9.]+)"`, 'g')
    result = result.replace(regex, (match, value) => {
      const scaled = parseFloat(value) * scaleFactor
      return `${attr}="${scaled.toFixed(2)}"`
    })
  }

  // Scale stroke-width
  result = result.replace(/stroke-width="([0-9.]+)"/g, (match, value) => {
    const scaled = parseFloat(value) * scaleFactor
    return `stroke-width="${scaled.toFixed(2)}"`
  })

  // Scale font-size
  result = result.replace(/font-size="([0-9.]+)"/g, (match, value) => {
    const scaled = parseFloat(value) * scaleFactor
    return `font-size="${scaled.toFixed(2)}"`
  })

  // Scale path d values
  result = result.replace(/d="([^"]*)"/g, (match, pathValue) => {
    const scaled = pathValue.replace(/([0-9.]+)/g, (num) => {
      const parsed = parseFloat(num)
      const scaledVal = parsed * scaleFactor
      return scaledVal.toFixed(2)
    })
    return `d="${scaled}"`
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

  const baseIcons = []

  // Find base icons (24px versions without size/state suffixes)
  for (const dir of [paymentDir, deliveryDir]) {
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
        // Only generate state variants for 24px
        for (const [stateName, stateConfig] of Object.entries(STATES)) {
          if (stateName === 'default') continue // Skip, it's the original

          const newContent = applyStateColors(baseContent, stateConfig)
          const newName = `${baseName}${stateConfig.nameSuffix}.svg`
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
