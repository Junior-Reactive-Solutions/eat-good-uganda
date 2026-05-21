#!/usr/bin/env pwsh
# Script to generate React icon components from SVG files

$baseDir = "D:\Junior Reactive Projects\eatgooduganda"
$iconsDir = "$baseDir\apps\customer\src\components\icons"
$assetsDir = "$baseDir\assets\icons"

# Mapping of categories to component names and directory names
$categories = @{
    "payment" = @("momo", "airtel", "bank", "cod", "shield", "generic")
    "delivery" = @("pickup", "boda", "time", "location", "status")
    "navigation" = @("home", "search", "cart", "orders", "profile", "favorites", "menu", "settings")
    "product" = @("bread-loaf", "cake", "pastry", "cupcake", "cookie", "donut", "star-rating", "trending")
    "admin" = @("approved", "pending", "rejected", "suspended", "analytics", "customers", "revenue", "inventory", "staff", "audit-log")
}

# Helper function to convert kebab-case to PascalCase
function ConvertToPascalCase {
    param([string]$name)
    $words = $name -split "-"
    $result = @()
    foreach ($word in $words) {
        $result += [char]::ToUpper($word[0]) + $word.Substring(1)
    }
    return $result -join ""
}

# Helper function to extract SVG content from file and convert to React
function ExtractSvgContent {
    param([string]$svgPath)

    if (-not (Test-Path $svgPath)) {
        return $null
    }

    [xml]$svg = Get-Content $svgPath

    # Get the SVG root element
    $root = $svg.DocumentElement

    # Extract all child nodes (elements and text)
    $content = @()
    foreach ($child in $root.ChildNodes) {
        if ($child.NodeType -eq "Element") {
            $element = ConvertSvgElementToJsx $child
            if ($element) {
                $content += $element
            }
        }
        elseif ($child.NodeType -eq "Comment") {
            # Include comments
            $content += "      {/* $($child.Value) */}"
        }
    }

    return $content -join "`n"
}

# Helper function to convert SVG element to JSX
function ConvertSvgElementToJsx {
    param($element)

    $tag = $element.LocalName
    $attrs = @()

    # Convert attributes
    foreach ($attr in $element.Attributes) {
        $name = $attr.LocalName
        $value = $attr.Value

        # Convert attribute names from kebab-case to camelCase
        if ($name -match "-") {
            $nameParts = $name -split "-"
            $name = $nameParts[0] + (($nameParts[1..($nameParts.Length-1)] | ForEach-Object { [char]::ToUpper($_[0]) + $_.Substring(1) }) -join "")
        }

        # Skip viewBox, width, height, xmlns as they're handled by Icon wrapper
        if ($name -notin @("viewBox", "width", "height", "xmlns")) {
            # Handle color - replace hardcoded colors with currentColor
            if (($name -eq "fill" -or $name -eq "stroke") -and $value -match "^#|^rgb") {
                $value = "currentColor"
            }

            if ($value.Contains('"')) {
                $attrs += "$name={`"$value`"}"
            }
            else {
                $attrs += "$name=`"$value`""
            }
        }
    }

    $attrString = if ($attrs) { " " + ($attrs -join " ") } else { "" }

    # Handle self-closing tags and nested elements
    if ($element.ChildNodes.Count -eq 0 -and $element.InnerText.Trim() -eq "") {
        return "      <$tag$attrString />"
    }
    else {
        $innerContent = ""
        foreach ($child in $element.ChildNodes) {
            if ($child.NodeType -eq "Element") {
                $innerContent += ConvertSvgElementToJsx $child
            }
            elseif ($child.NodeType -eq "Text" -and $child.Value.Trim()) {
                $innerContent += "        $($child.Value.Trim())"
            }
        }

        if ($innerContent) {
            return "      <$tag$attrString>`n$innerContent`n      </$tag>"
        }
        else {
            return "      <$tag$attrString></$tag>"
        }
    }
}

# Main generation function
function GenerateIconComponent {
    param(
        [string]$category,
        [string]$iconName,
        [string]$displayName
    )

    # Find the base SVG file (use the _24_default_24_default variant)
    $svgFile = Get-ChildItem "$assetsDir\$category" -Filter "icon-$category-$iconName*default_24_default.svg" | Select-Object -First 1

    if (-not $svgFile) {
        Write-Host "Warning: No SVG found for $category/$iconName" -ForegroundColor Yellow
        return $false
    }

    # Extract SVG content
    [xml]$svg = Get-Content $svgFile.FullName

    # Build the component JSX content
    $componentContent = @"
import React from 'react';
import { IconProps } from '@shared/types/icon';
import { Icon } from '../Icon';

/**
 * Icon$displayName
 * $category icon component
 * @example
 * <Icon$displayName size="md" />
 * <Icon$displayName size="lg" color="accent" />
 */
export const Icon$displayName: React.FC<IconProps> = ({
  size = 'md',
  color = 'default',
  state = 'default',
  className,
  alt = '$iconName',
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
"@

    # Add SVG content - extract just the inner elements
    foreach ($child in $svg.DocumentElement.ChildNodes) {
        if ($child.NodeType -eq "Element") {
            $componentContent += ConvertSvgElementToJsx $child
        }
    }

    $componentContent += @"
    </Icon>
  );
};

Icon$displayName.displayName = 'Icon$displayName';
"@

    # Write the component file
    $outputPath = "$iconsDir\$category\Icon$displayName.tsx"
    Set-Content -Path $outputPath -Value $componentContent -Encoding UTF8

    Write-Host "Created: $outputPath" -ForegroundColor Green
    return $true
}

# Create all components
Write-Host "Generating icon components..." -ForegroundColor Cyan

$totalCreated = 0
foreach ($category in $categories.Keys) {
    Write-Host "`nProcessing category: $category" -ForegroundColor Magenta

    foreach ($iconName in $categories[$category]) {
        $displayName = ConvertToPascalCase $iconName
        # Special handling: combine category + icon name for display
        $fullDisplayName = (ConvertToPascalCase $category) + $displayName

        $success = GenerateIconComponent -category $category -iconName $iconName -displayName $fullDisplayName
        if ($success) {
            $totalCreated++
        }
    }
}

Write-Host "`nGeneration complete! Created $totalCreated icon components." -ForegroundColor Green
