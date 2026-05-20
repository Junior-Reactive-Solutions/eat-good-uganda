#!/usr/bin/env python3
"""
Icon Variant Generator for Eat Good Uganda
Generates 32px and 48px variants from 24px base icons
Creates default, hover, active, and disabled state variants
"""

import os
import re
from pathlib import Path

# Define stroke scaling for different sizes
SIZE_CONFIGS = {
    24: {"stroke": 2, "name_suffix": ""},
    32: {"stroke": 2.67, "name_suffix": "_32"},
    48: {"stroke": 4, "name_suffix": "_48"},
}

# Define state variations
STATES = {
    "default": {
        "stroke_color": "#333333",
        "accent_color": "#FF6B35",
        "opacity": "1.0",
        "name_suffix": "",
    },
    "hover": {
        "stroke_color": "#FF6B35",
        "accent_color": "#FF6B35",
        "opacity": "1.0",
        "name_suffix": "_hover",
    },
    "active": {
        "stroke_color": "#FF6B35",
        "accent_color": "#FF6B35",
        "opacity": "1.0",
        "name_suffix": "_active",
    },
    "disabled": {
        "stroke_color": "#CCCCCC",
        "accent_color": "#CCCCCC",
        "opacity": "0.4",
        "name_suffix": "_disabled",
    },
}


def scale_stroke_width(original_width: str, from_size: int, to_size: int) -> str:
    """Scale stroke width proportionally"""
    try:
        width = float(original_width)
        scaled = width * (to_size / from_size)
        return f"{scaled:.2f}".rstrip("0").rstrip(".")
    except ValueError:
        return original_width


def scale_svg_content(svg_content: str, from_size: int, to_size: int) -> str:
    """
    Scale SVG for different sizes.

    IMPORTANT: viewBox stays at 0 0 24 24 (original base).
    Only width, height, and stroke-width scale.
    All coordinates (cx, cy, x, y, etc.) remain at original 24px values.
    """
    stroke_scale_factor = to_size / from_size

    # Keep viewBox at base 24x24
    svg_content = re.sub(
        r'viewBox="0 0 (\d+) (\d+)"',
        f'viewBox="0 0 24 24"',
        svg_content,
    )

    # Update width and height attributes only
    svg_content = re.sub(r'width="(\d+)"', f'width="{to_size}"', svg_content)
    svg_content = re.sub(r'height="(\d+)"', f'height="{to_size}"', svg_content)

    # Scale stroke-width ONLY (not coordinates)
    def scale_stroke(match):
        width = float(match.group(1))
        scaled = width * stroke_scale_factor
        return f'stroke-width="{scaled:.2f}"'

    svg_content = re.sub(r'stroke-width="([0-9.]+)"', scale_stroke, svg_content)

    # Scale font-size if present
    def scale_font(match):
        size = float(match.group(1))
        scaled = size * stroke_scale_factor
        return f'font-size="{scaled:.2f}"'

    svg_content = re.sub(r'font-size="([0-9.]+)"', scale_font, svg_content)

    return svg_content


def apply_state_colors(svg_content: str, state_config: dict) -> str:
    """Apply color and opacity changes for different states"""
    opacity = state_config["opacity"]
    stroke_color = state_config["stroke_color"]
    accent_color = state_config["accent_color"]

    # Replace default stroke color
    svg_content = svg_content.replace('stroke="#333333"', f'stroke="{stroke_color}"')

    # Replace accent color
    svg_content = svg_content.replace('fill="#FF6B35"', f'fill="{accent_color}"')
    svg_content = svg_content.replace('stroke="#FF6B35"', f'stroke="{accent_color}"')

    # Add opacity to root SVG element if not 1.0
    if opacity != "1.0":
        svg_content = re.sub(
            r'<svg ([^>]*)>',
            f'<svg \\1 opacity="{opacity}">',
            svg_content,
            count=1,
        )

    return svg_content


def generate_variants():
    """Generate all size and state variants"""
    icon_dir = Path(__file__).parent
    payment_dir = icon_dir / "payment"
    delivery_dir = icon_dir / "delivery"
    product_dir = icon_dir / "product"

    base_icons = []
    for icon_file in payment_dir.glob("icon-payment-*.svg"):
        if not any(suffix in icon_file.name for suffix in ["_32", "_48", "_hover", "_active", "_disabled"]):
            base_icons.append(icon_file)

    for icon_file in delivery_dir.glob("icon-delivery-*.svg"):
        if not any(suffix in icon_file.name for suffix in ["_32", "_48", "_hover", "_active", "_disabled"]):
            base_icons.append(icon_file)

    for icon_file in product_dir.glob("icon-product-*.svg"):
        if not any(suffix in icon_file.name for suffix in ["_32", "_48", "_hover", "_active", "_disabled"]):
            base_icons.append(icon_file)

    print(f"Found {len(base_icons)} base icons to process")

    for base_icon in sorted(base_icons):
        print(f"\nProcessing: {base_icon.name}")
        base_content = base_icon.read_text()

        # Generate variants for each size
        for size, size_config in sorted(SIZE_CONFIGS.items()):
            # Skip 24px as it's the base
            if size == 24:
                # Only generate state variants for 24px
                for state_name, state_config in STATES.items():
                    if state_name == "default":
                        continue  # Skip, it's the original

                    new_content = apply_state_colors(base_content, state_config)
                    new_name = base_icon.stem + state_config["name_suffix"] + ".svg"
                    new_path = base_icon.parent / new_name

                    new_path.write_text(new_content)
                    print(f"  ✓ {new_name}")
            else:
                # Scale to new size
                scaled_content = scale_svg_content(base_content, 24, size)

                # Generate state variants for this size
                for state_name, state_config in STATES.items():
                    state_content = apply_state_colors(scaled_content, state_config)

                    suffix_parts = [size_config["name_suffix"]]
                    if state_config["name_suffix"]:
                        suffix_parts.append(state_config["name_suffix"])

                    new_name = base_icon.stem + "".join(suffix_parts) + ".svg"
                    new_path = base_icon.parent / new_name

                    new_path.write_text(state_content)
                    print(f"  ✓ {new_name}")

    print("\n✓ All variants generated successfully!")


if __name__ == "__main__":
    generate_variants()
