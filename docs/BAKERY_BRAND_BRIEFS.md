# Eat Good Uganda — Bakery Brand Briefs & Logo Specifications

**Purpose:** Comprehensive brand guidelines and technical specifications for AI logo generation for three distinct bakeries.

---

## 🥖 BAKERY 1: KAMPALA CRUST

### Brand Story & Identity

**Name:** Kampala Crust  
**Tagline:** "Fresh bread, every single morning."  
**Positioning:** Kampala's neighbourhood bakery serving daily staples since 2018  
**Audience:** Everyday customers, families, office workers, students  
**Price Point:** Budget-friendly, accessible to all income levels  

### Brand Narrative

Kampala Crust is the **heartbeat of the neighbourhood**. It's where families start their mornings, where office workers grab a warm snack during lunch, where students find affordable treats. The bakery doesn't pretend to be fancy—it's authentic, warm, and deeply rooted in Kampala's daily rhythm.

Founded in 2018, Kampala Crust has become synonymous with reliability. The ovens start before dawn, producing fresh loaves of white bread, whole wheat loaves, brown buns that fill the air with the smell of baking by 5 AM. This is honest bakery work—traditional techniques, quality ingredients, consistent excellence.

The brand is about **community and tradition**. Kampala Crust serves the people of Nakawa, the everyday heroes who run the city. A mother buying bread for her children's school lunch. A taxi driver grabbing mandazi before his shift. An office worker treating themselves to a half-cake during afternoon break.

### Visual Identity

**Aesthetic:** Warm, welcoming, traditional, unpretentious  
**Mood:** Community-focused, reliable, homey, authentic  
**Era:** Timeless (not trendy, built to last)  
**Inspiration:** Wheat fields of Uganda, traditional ovens, hands kneading dough  

**Primary Color:** `#A8763E` (Warm Wheat Brown)
- Earth-toned, reminiscent of baked bread crust
- Warm and inviting
- Associated with harvest and tradition

**Secondary Color:** `#D4A96A` (Light Wheat/Gold)
- Accent color for highlights
- Represents the golden crust of fresh bread

**Tertiary Color:** `#1A0A00` (Deep Brown/Background)
- Backgrounds, text, shadows
- High contrast with primary color

### Logo Concept & Design Direction

**Concept:** A wheat sheaf or grain bundle, stylized in a way that suggests both abundance and simplicity. The wheat should feel hand-drawn, organic—not perfect geometric shapes. Incorporate subtle bread loaf shapes within or around the wheat to suggest both the raw ingredient and the finished product.

**Key Elements:**
- Wheat stalks (3-5 main stalks, organically arranged)
- Subtle bread loaf silhouette integrated into the design
- Hand-drawn quality (slightly imperfect, human touch)
- Sense of fullness and harvest (abundance)
- Simple, iconic form that works at any size

**Mood:** Honest, warm, hardworking, community-oriented. This is a bakery that shows up every morning. No artifice, no pretense.

**Style:** Modern-simplified traditional. Contemporary enough for web/app, but with hints of organic, hand-crafted quality.

### Logo Usage Context

**Where it appears:**
- Website header (primary logo)
- Mobile app icon
- Product packaging (printed on bags, boxes)
- Social media avatars
- Storefront signage
- Business cards
- Order confirmation emails
- Product category icons on e-commerce

**Size contexts:**
- Icon (16px, 24px, 32px) — requires high clarity, simple forms
- Medium (48px, 64px) — detail can emerge
- Large (128px, 256px) — full brand mark
- Extra large (512px+) — print materials, signage

### Technical Logo Specifications

#### File Format & Delivery

| Specification | Requirement | Reason |
|---|---|---|
| **Primary Format** | SVG (vector) | Scales to any size without quality loss; used throughout app |
| **Fallback Format** | PNG 512×512px | For email clients, legacy browsers that don't support SVG |
| **Color Depth** | 32-bit RGBA | Full transparency support |
| **Background** | Transparent | Logo works on any background color |
| **File Size** | < 50 KB (SVG), < 30 KB (PNG) | Web performance optimization |

#### Dimensions & Scaling

| Use Case | Canvas Size | Notes |
|---|---|---|
| **Favicon** | 32×32px | Sharp at small size; simplify details if needed |
| **Icon (mobile app)** | 192×192px | App store displays at 192px, OS scales from this |
| **Website logo (header)** | 256×256px | Standard web logo size |
| **Product display** | 512×512px | E-commerce product listings |
| **Print materials** | 300 DPI @ 4"×4" (1200×1200px) | For business cards, packaging |

#### Color Specifications

| Element | Color Value | Format | Purpose |
|---|---|---|---|
| **Primary Logo** | `#A8763E` | Hex | Main brand color |
| **Accent** | `#D4A96A` | Hex | Highlights, secondary elements |
| **Background** | `#1A0A00` | Hex | Dark backgrounds for contrast |
| **Monochrome** | Single color | Grayscale | When color not available |

#### Design Constraints

- **Minimum size:** 24px × 24px (any smaller, details get lost)
- **Safe zone (padding):** 8px clear space around logo
- **Aspect ratio:** 1:1 (square) — symmetric, versatile
- **Stroke weight:** For outlined elements, use 2-4px at 256px scale (scale proportionally down)
- **Corner radius:** Soft rounded corners preferred; no sharp points
- **Complexity:** Moderate (5-8 distinct shapes max) to remain legible at small sizes

#### Transparency & Layering

- **Background layer:** Should be transparent (checkered in PNG preview)
- **Anti-aliasing:** Smooth edges at all sizes (crucial for SVG)
- **No embedded raster images** — SVG should be pure vectors
- **Stroke caps:** Rounded (butt caps for fine details)
- **Opacity:** 100% opaque for logo itself; no fade or transparency effects

#### Accessibility

- **Color contrast:** Logo must be visible on `#faf8f4` (platform bg) and `#ffffff` (white surfaces)
- **Simplicity:** Logo must be instantly recognizable at 24px (favicon size)
- **No color-only encoding:** If color is critical to meaning, outline/shape must also distinguish the logo

### Export Instructions for AI

**When generating this logo, create:**

1. **SVG Master File** (primary)
   - Optimized for web (remove unnecessary metadata)
   - All text converted to paths (no font dependencies)
   - Colors defined using hex values or RGB (not names)
   - Clean code structure (readable XML)

2. **PNG Fallback** (512×512px, 32-bit RGBA)
   - Transparent background (not white)
   - High quality anti-aliasing
   - No compression artifacts

3. **Favicon Version** (32×32px, PNG)
   - Simplified design if needed for clarity at tiny size
   - Test in browser tab to ensure recognition

---

## ✨ BAKERY 2: THE GOLDEN WHISK

### Brand Story & Identity

**Name:** The Golden Whisk  
**Tagline:** "Where butter meets craft."  
**Positioning:** Kampala's favourite artisan patisserie and coffee corner  
**Audience:** Coffee enthusiasts, celebration planners, professionals, food lovers  
**Price Point:** Mid-range to premium; accessible luxury  

### Brand Narrative

The Golden Whisk is where **craft meets passion**. This isn't just a bakery—it's a patisserie. Every croissant is hand-laminated, every éclair is hand-piped, every cake is a work of edible art.

Located in Acacia Mall's heart, The Golden Whisk is the gathering place for Kampala's food-conscious community. The owner trained in Brussels, studied French pâtisserie techniques, and brought that excellence back to Uganda. This is not compromise—it's authentic artisan work at a price that acknowledges the labor.

The bakery is **unapologetically boutique**. Quality ingredients matter (Valrhona chocolate, French butter, Madagascar vanilla). Techniques matter (laminated dough takes hours, you can taste the time). Limited daily batches because rushing quality is disrespect to the craft.

The brand attracts people who **celebrate moments**. Custom cakes for birthdays and weddings. The ritual of a mid-morning cappuccino. The treat you buy yourself because you deserve it.

### Visual Identity

**Aesthetic:** Elegant, sophisticated, artisanal, refined  
**Mood:** Passion, craft, attention to detail, celebration  
**Era:** Timeless elegance (European-inspired but contemporary)  
**Inspiration:** French pâtisseries, whisk and mixer tools, golden pastries, steam rising from fresh coffee  

**Primary Color:** `#F9A931` (Brand Amber Gold)
- The color of fresh pastry crust
- Associated with butter, cream, richness
- Stands out as distinctive and memorable
- Premium, warm, inviting

**Secondary Color:** `#1A0A00` (Deep Brown/Background)
- Contrast with gold; suggests depth and quality
- Professional, sophisticated
- Complements amber beautifully

**Tertiary Color:** `#FDFBE5` (Cream)
- Soft background, accent color
- Reminiscent of fresh cream, sugar, elegance

### Logo Concept & Design Direction

**Concept:** A stylized whisk paired with a droplet or mixing element. The whisk should be recognizable and elegant, suggesting both the tool and the artistry. The design should feel sophisticated—sharp lines, precise angles. Incorporate subtle elements that suggest butter, cream, or a mixing motion. The overall impression should be: **elegant, intentional, crafted**.

**Key Elements:**
- Whisk (simplified, iconic silhouette)
- Droplet or flow element (butter, cream, or liquid motion)
- Precision and fine detail (speaks to craftsmanship)
- Sense of movement or mixing (dynamic energy)
- Modern, clean lines (contemporary sophistication)

**Mood:** Refined, passionate, professional, artisanal. This bakery respects the craft. Every element shows intention.

**Style:** Modern art deco with artisanal touches. Geometric precision meets organic elements.

### Logo Usage Context

**Where it appears:**
- Website header (primary brand mark)
- Pastry box labels (premium packaging)
- Coffee cup sleeves
- Business cards (high-quality stock)
- Social media (Instagram aesthetic-driven)
- Product photography (hero shots on website)
- Storefront signage (subtle, elegant)
- Delivery vehicle branding

**Size contexts:**
- Icon (16px, 24px) — clarity essential for app
- Standard web (64px, 128px, 256px)
- Print (300 DPI, various sizes for packaging)
- Large signage (physical bakery storefront)

### Technical Logo Specifications

#### File Format & Delivery

| Specification | Requirement | Reason |
|---|---|---|
| **Primary Format** | SVG (vector) | Scales perfectly; used for web and digital |
| **Fallback Format** | PNG 512×512px | Email compatibility, legacy support |
| **Color Depth** | 32-bit RGBA | Full transparency for flexible use |
| **Background** | Transparent | Elegant application on any surface |
| **File Size** | < 40 KB (SVG), < 25 KB (PNG) | Web performance |

#### Dimensions & Scaling

| Use Case | Canvas Size | Notes |
|---|---|---|
| **Favicon** | 32×32px | Must be sharp at tiny size; elegant simplification |
| **Mobile app icon** | 192×192px | Standard app store size |
| **Website header** | 256×256px | Primary logo display size |
| **Product boxes** | 512×512px | Printed on packaging |
| **Print materials** | 300 DPI @ 2"×2" (600×600px) | Business cards, labels |
| **Storefront** | Scaled as needed | May be large (24"+ width) |

#### Color Specifications

| Element | Color Value | Format | Purpose |
|---|---|---|---|
| **Primary Logo** | `#F9A931` | Hex | Main brand identity |
| **Background/Contrast** | `#1A0A00` | Hex | Dark accents, text |
| **Highlights** | `#FDFBE5` | Hex | Delicate accents, secondary elements |
| **Monochrome (gold only)** | Single color | Grayscale for simple applications |

#### Design Constraints

- **Minimum size:** 24px × 24px (elegance must survive scaling down)
- **Safe zone (padding):** 12px clear space (premium brand requires breathing room)
- **Aspect ratio:** 1:1 (square) — symmetric, refined
- **Stroke weight:** 1.5-3px at 256px scale (thin, elegant lines)
- **Corner radius:** Sharp to slightly rounded (precision over softness)
- **Complexity:** Moderate to high (intricate details okay for e-commerce; simplify for favicon)
- **Precision:** Pixel-perfect alignment where possible

#### Transparency & Layering

- **Background:** Fully transparent (no white or color backing)
- **Anti-aliasing:** Smooth, refined edges (crucial at all sizes)
- **SVG optimization:** Remove metadata, compress path data
- **Stroke definition:** Consistent line weights; no varying opacity
- **Layering:** Distinct foreground/background if multi-element design

#### Accessibility

- **Color contrast:** Must stand out on light backgrounds (`#faf8f4`, `#ffffff`) and dark backgrounds
- **Recognition:** Instantly identifiable as a whisk or patisserie-related symbol
- **Legibility:** Details readable even when scaled to 24px
- **Not color-dependent:** Shape/form should convey meaning even if color is unavailable

### Export Instructions for AI

**When generating this logo, create:**

1. **SVG Master** (primary)
   - Elegant, refined vector paths
   - Hex color values only
   - Optimized structure for web delivery
   - All strokes converted to fills if needed

2. **PNG 512×512px** (secondary)
   - Transparent background
   - Anti-aliased edges (quality must match SVG)
   - Ready for e-commerce product images

3. **Favicon 32×32px** (tertiary)
   - Simplified if necessary to maintain elegance at tiny size
   - Test in browser to ensure recognizable

---

## 🎩 BAKERY 3: MAISON LÉA

### Brand Story & Identity

**Name:** Maison Léa  
**Tagline:** "L'art de la pâtisserie, à Kampala." (The art of pâtisserie, in Kampala)  
**Positioning:** Kampala's finest French pâtisserie; classical French technique  
**Audience:** Food connoisseurs, special occasion planners, luxury market, French expatriates, high-end professionals  
**Price Point:** Luxury; premium pricing reflects imported ingredients and skilled labor  

### Brand Narrative

Maison Léa is **uncompromising luxury**. This is not a bakery trying to be French—this **is** French pâtisserie, transplanted to Kampala's Kololo district.

The owner, trained at Escuela de Pastelería in Spain and École de Pâtisserie in Paris, brings classical European technique to Uganda. Valrhona chocolate (imported from France), butter from the finest European suppliers, Madagascar vanilla pods ordered directly. Every croissant involves folding butter dough 729 times. Every ganache achieves the exact glossy finish through technique perfected over decades.

Maison Léa doesn't serve customers—it serves **celebrations and moments of refinement**. A wedding requires a gâteau that's not just beautiful but a revelation of flavor. A business dinner calls for petit fours that justify their price through taste and artistry. A personal moment of indulgence deserves an Opéra that tastes like Paris.

The brand is about **exclusivity through excellence**. Limited production ensures quality. High prices are a feature, not a bug—they mean the owner isn't racing to volume, rushing quality, cutting corners. You pay for ingredients you can taste, techniques you can see, results that are simply different.

The aesthetic is **Old World European elegance**—refined, understated, precious. No gimmicks, no shortcuts. Just the absolute best, delivered with continental grace.

### Visual Identity

**Aesthetic:** Luxury, refined, classical, exclusive, precious  
**Mood:** Sophistication, heritage, European elegance, timeless excellence  
**Era:** Parisian Belle Époque meets contemporary luxury  
**Inspiration:** French heraldry, monogram traditions, luxury European brands, precious metals, classical art  

**Primary Color:** `#7B1E3B` (Deep Burgundy/Wine)
- Associated with luxury, wine, sophistication
- Evokes French tradition and heritage
- Distinct and memorable
- Regal, exclusive quality

**Secondary Color:** `#C9A24B` (Champagne Gold)
- Accent color suggesting luxury and refinement
- Complements burgundy beautifully
- Reminiscent of gold leaf, luxury finishes

**Background:** `#1A0A00` (Deep Brown)
- Sophisticated contrast
- Jewel-tone complement

### Logo Concept & Design Direction

**Concept:** A monogram or crest featuring a stylized "L" mark, inspired by French heraldic traditions. The design should feel like a luxury brand seal—something you'd find on high-end European packaging. Could incorporate fleur-de-lis elements, crown motifs, or shield shapes. The execution should be clean, precise, and timeless—something that looks equally at home on a 19th-century letter and a contemporary website.

**Key Elements:**
- Monogram "L" as primary element
- Heraldic or crest-inspired frame (optional but recommended)
- Burgundy and gold color combination
- Precision and symmetry (formal, structured)
- Classical European design language
- Sense of exclusivity and heritage

**Mood:** Exclusive, timeless, cultured, sophisticated. This is a brand that doesn't need to explain itself—the design does. Think Hermès, think Le Cordon Bleu, think establishments that have been excellent for 150 years.

**Style:** Neo-classical with contemporary refinement. Inspired by luxury heritage brands but rendered for modern digital and print.

### Logo Usage Context

**Where it appears:**
- Website header (centerpiece of brand presence)
- Luxury packaging (printed on cake boxes, pastry boxes)
- Business correspondence (letterhead, invoices)
- Signage (understated, elegant storefront)
- Social media (Instagram-focused, high-end aesthetic)
- Custom cake labels (brand mark on personalized cakes)
- PR and press materials
- Collaborations with luxury retailers

**Size contexts:**
- Icon (small, 24px minimum — must feel luxurious at any size)
- Standard web (64px, 128px, 256px)
- Large (512px+ for packaging and print)
- Signage (variable, potentially very large)

### Technical Logo Specifications

#### File Format & Delivery

| Specification | Requirement | Reason |
|---|---|---|
| **Primary Format** | SVG (vector) | Luxury requires scalability to any size |
| **Fallback Format** | PNG 512×512px + 1024×1024px | Print and high-res applications |
| **Color Depth** | 32-bit RGBA | Transparency for flexible application |
| **Background** | Transparent | Elegant integration on any surface |
| **File Size** | < 35 KB (SVG), < 40 KB (PNG) | Professional delivery |

#### Dimensions & Scaling

| Use Case | Canvas Size | Notes |
|---|---|---|
| **Favicon** | 32×32px | Small but must maintain elegance and recognition |
| **Mobile app icon** | 192×192px | App store display |
| **Website logo** | 256×256px | Primary web presence |
| **Product packaging** | 512×512px + 1024×1024px | High-res for printing on luxury boxes |
| **Print** | 300 DPI @ 3"×3" (900×900px) | Business cards, invitations, labels |
| **Large format** | Up to 2000×2000px | For signage rendering |

#### Color Specifications

| Element | Color Value | Format | Purpose |
|---|---|---|---|
| **Primary (Burgundy)** | `#7B1E3B` | Hex RGB | Main brand color |
| **Accent (Gold)** | `#C9A24B` | Hex RGB | Secondary color, highlights |
| **Background/Frames** | `#1A0A00` | Hex RGB | Depth and contrast |
| **Monochrome (Gold foil effect)** | Single gold only | For luxury applications |

#### Design Constraints

- **Minimum size:** 32px × 32px (luxury requires elegance even tiny)
- **Safe zone (padding):** 16px clear space (premium brands deserve breathing room)
- **Aspect ratio:** 1:1 (square, symmetric, formal)
- **Stroke weight:** Thin to medium (1-2.5px at 256px) — precision and refinement
- **Corner radius:** Sharp corners preferred (geometric precision)
- **Symmetry:** Strongly encouraged (classical, balanced, formal)
- **Complexity:** Low to moderate (clarity is luxury; ornate but not cluttered)

#### Transparency & Layering

- **Background:** Fully transparent (no backing color)
- **Anti-aliasing:** Flawless smooth edges (luxury demands perfection)
- **SVG structure:** Clean, optimized paths; readable code
- **Stroke consistency:** Even, precise line weights throughout
- **No gradients or complex effects:** Solid colors only (timeless elegance)

#### Accessibility

- **Color contrast:** Must be visible on light (`#faf8f4`) and dark backgrounds; test on various surfaces
- **Recognition:** Instantly identifiable as a luxury brand mark or patisserie
- **Simplicity for small sizes:** While ornate is acceptable, must remain legible at 24px
- **Professional appearance:** Should never appear playful or casual

### Export Instructions for AI

**When generating this logo, create:**

1. **SVG Master** (primary)
   - Classical European design influence
   - Precise, geometric paths
   - Burgundy and gold color scheme
   - Monogram or crest structure
   - Optimized for web and print

2. **PNG 512×512px** (secondary)
   - Transparent background
   - High-quality anti-aliasing
   - Suitable for packaging mockups

3. **PNG 1024×1024px** (tertiary)
   - Ultra-high resolution for print
   - Professional packaging reproduction

4. **Favicon 32×32px** (quaternary)
   - Must remain elegant at tiny size
   - Test in browser tab

---

## 📋 COMPARATIVE BRAND SUMMARY

### Visual Differences at a Glance

| Attribute | Kampala Crust | The Golden Whisk | Maison Léa |
|-----------|---|---|---|
| **Primary Color** | `#A8763E` (Warm Brown) | `#F9A931` (Gold) | `#7B1E3B` (Burgundy) |
| **Design Style** | Organic, hand-drawn | Modern, elegant, precise | Classical, heraldic, formal |
| **Logo Shape** | Wheat/grain bundle | Whisk + droplet | Monogram/crest |
| **Mood** | Community, everyday | Craft, celebration | Luxury, heritage |
| **Target Market** | Families, students, workers | Food enthusiasts, professionals | High-end clientele, connoisseurs |
| **Complexity Level** | Moderate (5-8 elements) | Moderate-High (8-12 elements) | Low-Moderate (4-7 elements, high precision) |
| **Stripe Recommendation** | Rounded corners, organic | Sharp/rounded mix, dynamic | Sharp corners, symmetric |

### Design Principles for AI

**Kampala Crust:** Focus on **authenticity and warmth**. This logo should feel hand-made, traditional, trustworthy. The wheat sheaf is iconic—make it unmistakable.

**The Golden Whisk:** Focus on **sophistication and craftsmanship**. Every line should suggest skill and intention. The whisk must be instantly recognizable; the motion or flow element adds dynamism.

**Maison Léa:** Focus on **timeless elegance and exclusivity**. This logo should feel like it could have existed in 1920 and still look contemporary. Symmetry, precision, and restraint are key. Less is more.

---

## 🎨 Instructions for AI Image Generation

When using an AI tool to generate these logos, use these detailed briefs. Provide:

1. **The entire brand narrative** from each section above
2. **The specific visual identity** section (colors, mood, style)
3. **The logo concept** section (what elements to include)
4. **The technical specifications** section (exact dimensions, formats)
5. **This comparative summary** so the AI understands how each logo differs

**Example prompt structure:**

> **Logo Generation Brief: [BAKERY NAME]**
>
> **Brand Context:** [Copy entire Brand Narrative section]
>
> **Visual Identity:** [Copy entire Visual Identity section]
>
> **Design Direction:** [Copy Logo Concept section]
>
> **Technical Requirements:** [Copy technical specs - format, dimensions, colors, constraints]
>
> **Delivery:** Please create [SVG + PNG files with exact specifications listed]

---

## 📦 File Delivery Checklist

For each bakery, you should receive:

- [ ] **`kampala-crust-logo.svg`** (vector master)
- [ ] **`kampala-crust-logo.png`** (512×512px fallback)
- [ ] **`kampala-crust-favicon.png`** (32×32px)
- [ ] **`the-golden-whisk-logo.svg`** (vector master)
- [ ] **`the-golden-whisk-logo.png`** (512×512px fallback)
- [ ] **`the-golden-whisk-favicon.png`** (32×32px)
- [ ] **`maison-lea-logo.svg`** (vector master)
- [ ] **`maison-lea-logo.png`** (512×512px fallback)
- [ ] **`maison-lea-logo-large.png`** (1024×1024px for print)
- [ ] **`maison-lea-favicon.png`** (32×32px)

All files should have transparent backgrounds, be ready for web use, and follow the technical specifications in their respective sections.

---

## 💡 Final Notes

These three bakeries are **distinct brands with different markets**. The logos should look completely different from each other—not a family of similar logos, but three independent brand marks that each tell their own story.

- **Kampala Crust** should feel grassroots and real
- **The Golden Whisk** should feel aspirational and skilled
- **Maison Léa** should feel like a luxury import, European heritage

Use these briefs to help your AI tool (or your designer) create logos that **capture the soul of each bakery**, not just represent them visually.
