#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const baseDir = 'D:/Junior Reactive Projects/eatgooduganda'
const iconsDir = path.join(baseDir, 'apps/customer/src/components/icons')
const assetsDir = path.join(baseDir, 'assets/icons')

// Mapping of categories to icon names
const categories = {
  payment: ['momo', 'airtel', 'bank', 'cod', 'shield', 'generic'],
  delivery: ['pickup', 'boda', 'time', 'location', 'status'],
  navigation: ['home', 'search', 'cart', 'orders', 'profile', 'favorites', 'menu', 'settings'],
  product: [
    'bread-loaf',
    'cake',
    'pastry',
    'cupcake',
    'cookie',
    'donut',
    'star-rating',
    'trending',
  ],
  admin: [
    'approved',
    'pending',
    'rejected',
    'suspended',
    'analytics',
    'customers',
    'revenue',
    'inventory',
    'staff',
    'audit-log',
  ],
}

// Helper to convert kebab-case to PascalCase
function toPascalCase(str) {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

// Helper to find SVG file
function findSvgFile(category, iconName) {
  const dir = path.join(assetsDir, category)
  const files = fs.readdirSync(dir)

  // For most categories, look for _24_default_24_default pattern
  let svgFile = files.find((f) => {
    const base = `icon-${category}-${iconName}`
    return f.startsWith(base) && f.includes('_24_default_24_default')
  })

  // If not found, try looking for base SVG or _24_default pattern (for admin icons)
  if (!svgFile) {
    svgFile = files.find((f) => {
      const base = `icon-${category}-${iconName}`
      return f === `${base}.svg` || f.startsWith(`${base}_24_default.svg`)
    })
  }

  return svgFile
}

// Extract SVG content
function extractSvgContent(svgPath) {
  const content = fs.readFileSync(svgPath, 'utf-8')

  // Extract just the inner SVG elements (between <svg> and </svg>)
  const match = content.match(/<svg[^>]*>([\s\S]*?)<\/svg>/)
  if (!match) return ''

  let innerContent = match[1]

  // Remove HTML/XML comments
  innerContent = innerContent.replace(/<!--[\s\S]*?-->/g, '')

  // Clean up and convert to React
  // Replace stroke="#XXXXXX" with stroke="currentColor"
  innerContent = innerContent.replace(/stroke="#[0-9a-fA-F]+"/g, 'stroke="currentColor"')
  // Replace fill="#XXXXXX" with fill="currentColor" (but not fill="none")
  innerContent = innerContent.replace(/fill="#[0-9a-fA-F]+"/g, 'fill="currentColor"')

  // Convert SVG attributes to camelCase
  innerContent = innerContent.replace(/stroke-width/g, 'strokeWidth')
  innerContent = innerContent.replace(/stroke-linecap/g, 'strokeLinecap')
  innerContent = innerContent.replace(/stroke-linejoin/g, 'strokeLinejoin')
  innerContent = innerContent.replace(/text-anchor/g, 'textAnchor')
  innerContent = innerContent.replace(/font-family/g, 'fontFamily')
  innerContent = innerContent.replace(/font-size/g, 'fontSize')
  innerContent = innerContent.replace(/font-weight/g, 'fontWeight')

  return innerContent.trim()
}

// Generate component code
function generateComponent(category, iconName) {
  const svgFileName = findSvgFile(category, iconName)
  if (!svgFileName) {
    console.warn(`No SVG found for ${category}/${iconName}`)
    return null
  }

  const svgPath = path.join(assetsDir, category, svgFileName)
  const svgContent = extractSvgContent(svgPath)

  const categoryPascal = toPascalCase(category)
  const iconPascal = toPascalCase(iconName)
  const componentName = `Icon${categoryPascal}${iconPascal}`

  const code = `import React from 'react';
import { IconProps } from '@shared/types/icon';
import { Icon } from '../Icon';

/**
 * ${componentName}
 * ${category} icon component
 * @example
 * <${componentName} size="md" />
 * <${componentName} size="lg" color="accent" />
 */
export const ${componentName}: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = '${iconName}',
  'data-testid': dataTestId,
}) => {
  return (
    <Icon
      size={size}
      color={color}
      state={state}
      className={className}
      alt={alt}
      data-testid={dataTestId}
    >
${svgContent
  .split('\n')
  .map((line) => '      ' + line)
  .join('\n')}
    </Icon>
  );
};

${componentName}.displayName = '${componentName}';
`

  return { componentName, code }
}

// Main execution
function main() {
  console.log('Generating icon components...\n')

  let totalCreated = 0
  const exportMap = {}

  for (const [category, icons] of Object.entries(categories)) {
    console.log(`Processing category: ${category}`)
    exportMap[category] = []

    for (const iconName of icons) {
      const result = generateComponent(category, iconName)
      if (!result) continue

      const { componentName, code } = result
      const outputPath = path.join(iconsDir, category, `${componentName}.tsx`)

      // Ensure directory exists
      const dir = path.dirname(outputPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      fs.writeFileSync(outputPath, code, 'utf-8')
      console.log(`  ✓ Created ${componentName}`)

      exportMap[category].push(componentName)
      totalCreated++
    }
  }

  // Generate barrel export file
  console.log('\nGenerating barrel export...')
  let barrelContent = ''

  for (const [category, components] of Object.entries(exportMap)) {
    barrelContent += `\n// ${category.charAt(0).toUpperCase() + category.slice(1)} icons\n`
    for (const comp of components) {
      barrelContent += `export { ${comp} } from './${category}/${comp}';\n`
    }
  }

  const barrelPath = path.join(iconsDir, 'index.ts')
  fs.writeFileSync(barrelPath, barrelContent.trim() + '\n', 'utf-8')
  console.log(`  ✓ Created barrel export: ${barrelPath}`)

  console.log(`\n✅ Successfully created ${totalCreated} icon components!`)
}

main()
