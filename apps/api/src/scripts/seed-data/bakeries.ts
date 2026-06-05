/**
 * seed-data/bakeries.ts
 * Static data definitions for the three demo bakeries.
 * Prices are in UGX minor units (price × 100). e.g. UGX 2,000 → 200000.
 */

export interface ProductVariantDef {
  name: string
  price_minor: number
  sort_order: number
}

export interface ProductDef {
  slug: string
  name: string
  description: string
  base_price_minor: number
  image_urls: string[]
  tags: string[]
  sort_order: number
  requires_advance_notice_hours?: number
  variants?: ProductVariantDef[]
}

export interface CategoryDef {
  name: string
  slug: string
  sort_order: number
  products: ProductDef[]
}

export interface OwnerDef {
  email: string
  password: string
  full_name: string
}

export interface BakeryDef {
  slug: string
  legal_name: string
  display_name: string
  tagline: string
  description: string
  logo_url: string
  hero_image_url: string
  primary_color: string
  accent_color: string
  phone: string
  email: string
  address_line1: string
  address_line2?: string
  city: string
  latitude: number
  longitude: number
  accepts_pickup: boolean
  accepts_delivery: boolean
  delivery_fee_minor: number | null
  delivery_radius_km: number | null
  min_order_minor: number | null
  owner: OwnerDef
  categories: CategoryDef[]
}

function svgDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`
}

// ─── SVG Logos ────────────────────────────────────────────────────────────────

const KAMPALA_CRUST_LOGO = svgDataUri(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="32" fill="#1A0A00"/>
    <path d="M32 50L32 24M32 50L23 22M32 50L41 22" stroke="#A8763E" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <ellipse cx="32" cy="20" rx="4" ry="7" fill="#A8763E"/>
    <ellipse cx="22.5" cy="18" rx="3.5" ry="6" fill="#A8763E" transform="rotate(-12 22.5 18)"/>
    <ellipse cx="41.5" cy="18" rx="3.5" ry="6" fill="#A8763E" transform="rotate(12 41.5 18)"/>
    <rect x="29" y="36" width="6" height="4" rx="2" fill="#D4A96A"/>
  </svg>`,
)

const GOLDEN_WHISK_LOGO = svgDataUri(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="32" fill="#1A0A00"/>
    <line x1="40" y1="50" x2="28" y2="34" stroke="#F9A931" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="25" cy="25" rx="8" ry="11" fill="none" stroke="#F9A931" stroke-width="2"/>
    <line x1="25" y1="14" x2="25" y2="36" stroke="#F9A931" stroke-width="1.5"/>
    <line x1="17" y1="20" x2="33" y2="30" stroke="#F9A931" stroke-width="1.5"/>
    <line x1="33" y1="20" x2="17" y2="30" stroke="#F9A931" stroke-width="1.5"/>
    <path d="M45 42Q48 37 45 32Q42 37 45 42Z" fill="#F9A931"/>
  </svg>`,
)

const MAISON_LEA_LOGO = svgDataUri(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="32" fill="#1A0A00"/>
    <path d="M32 10L50 18L50 40Q50 52 32 58Q14 52 14 40L14 18Z" fill="none" stroke="#C9A24B" stroke-width="1.5"/>
    <path d="M32 14L46 21L46 39Q46 49 32 54Q18 49 18 39L18 21Z" fill="#7B1E3B"/>
    <rect x="26" y="20" width="5" height="24" rx="1" fill="#C9A24B"/>
    <rect x="26" y="39" width="14" height="5" rx="1" fill="#C9A24B"/>
  </svg>`,
)

// ─── Image URL helpers ─────────────────────────────────────────────────────────

function img(id: string): string {
  return `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`
}

// ─── Bakery 1: Kampala Crust ──────────────────────────────────────────────────

const KAMPALA_CRUST: BakeryDef = {
  slug: 'kampala-crust',
  legal_name: 'Kampala Crust Bakeries Ltd',
  display_name: 'Kampala Crust',
  tagline: 'Fresh bread, every single morning.',
  description:
    "Kampala's neighbourhood bakery serving daily staples since 2018. Fresh bread every morning, warm snacks all day.",
  logo_url: KAMPALA_CRUST_LOGO,
  hero_image_url: img('1509440159596-0249088772ff'),
  primary_color: '#A8763E',
  accent_color: '#D4A96A',
  phone: '+256700100001',
  email: 'hello@kampalacrust.ug',
  address_line1: 'Plot 14, Nakawa Market Road',
  city: 'Kampala',
  latitude: 0.317,
  longitude: 32.6149,
  accepts_pickup: true,
  accepts_delivery: true,
  delivery_fee_minor: 300000,
  delivery_radius_km: 5.0,
  min_order_minor: 500000,
  owner: {
    email: 'owner@kampalacrust.ug',
    password: 'KampalaCrust!2026',
    full_name: 'Kampala Crust Owner',
  },
  categories: [
    {
      name: 'Breads',
      slug: 'breads',
      sort_order: 1,
      products: [
        {
          slug: 'white-sandwich-loaf',
          name: 'White Sandwich Loaf',
          description: 'Soft, fluffy white bread baked fresh daily. Perfect for breakfast or packed lunches.',
          base_price_minor: 150000,
          image_urls: [img('1598373182133-52452f7691ef')],
          tags: ['bread', 'daily-staple', 'breakfast'],
          sort_order: 1,
          variants: [
            { name: 'Small', price_minor: 150000, sort_order: 1 },
            { name: 'Large', price_minor: 280000, sort_order: 2 },
          ],
        },
        {
          slug: 'whole-wheat-loaf',
          name: 'Whole Wheat Loaf',
          description: 'Hearty whole wheat loaf with a slightly nutty flavour. A healthy everyday choice.',
          base_price_minor: 200000,
          image_urls: [img('1549931319-a545dcf3bc7c')],
          tags: ['bread', 'whole-wheat', 'healthy'],
          sort_order: 2,
        },
        {
          slug: 'brown-buns',
          name: 'Brown Buns (6-pack)',
          description: 'Six soft brown dinner rolls, ideal for sandwiches or alongside a bowl of soup.',
          base_price_minor: 300000,
          image_urls: [img('1586444248902-2f64eddc13df')],
          tags: ['bread', 'buns', 'pack'],
          sort_order: 3,
        },
      ],
    },
    {
      name: 'Snacks',
      slug: 'snacks',
      sort_order: 2,
      products: [
        {
          slug: 'mandazi',
          name: 'Mandazi (6-pack)',
          description: 'Light and airy East African doughnuts, lightly spiced with cardamom. A Ugandan morning favourite.',
          base_price_minor: 50000,
          image_urls: [img('1574085733277-851d9d856a3a')],
          tags: ['snack', 'fried', 'ugandan'],
          sort_order: 1,
        },
        {
          slug: 'beef-samosa',
          name: 'Beef Samosa',
          description: 'Crispy golden pastry filled with seasoned minced beef and onions. Served hot.',
          base_price_minor: 70000,
          image_urls: [img('1601050690597-df0568f70950')],
          tags: ['snack', 'savoury', 'fried'],
          sort_order: 2,
        },
        {
          slug: 'half-cake',
          name: 'Half-Cake / Daddies',
          description: 'Ugandan street-food classic — a small, lightly sweetened half-cake snack bun.',
          base_price_minor: 40000,
          image_urls: [img('1558955141-3a2e3da3b9b4')],
          tags: ['snack', 'ugandan', 'sweet'],
          sort_order: 3,
        },
      ],
    },
    {
      name: 'Cakes',
      slug: 'cakes',
      sort_order: 3,
      products: [
        {
          slug: 'simple-vanilla-slab',
          name: 'Simple Vanilla Slab',
          description: 'A classic moist vanilla sponge decorated with buttercream. Great for birthdays or celebrations.',
          base_price_minor: 1500000,
          image_urls: [img('1535141192574-5d4897c12636')],
          tags: ['cake', 'vanilla', 'celebration'],
          sort_order: 1,
          requires_advance_notice_hours: 24,
        },
        {
          slug: 'marble-cake',
          name: 'Marble Cake',
          description: 'A beautiful swirl of vanilla and chocolate sponge, topped with a dusting of icing sugar.',
          base_price_minor: 1800000,
          image_urls: [img('1558326567-98ae2405596b')],
          tags: ['cake', 'marble', 'chocolate'],
          sort_order: 2,
          requires_advance_notice_hours: 24,
        },
      ],
    },
    {
      name: 'Drinks',
      slug: 'drinks',
      sort_order: 4,
      products: [
        {
          slug: 'ugandan-milk-tea',
          name: 'Ugandan Milk Tea',
          description: 'Strong black tea brewed with full-cream milk, lightly sweetened. The real Kampala staple.',
          base_price_minor: 150000,
          image_urls: [img('1571934811356-5cc061b6821f')],
          tags: ['drink', 'tea', 'hot'],
          sort_order: 1,
        },
        {
          slug: 'black-coffee',
          name: 'Black Coffee',
          description: 'Freshly brewed Ugandan Robusta coffee, bold and full-bodied.',
          base_price_minor: 150000,
          image_urls: [img('1495474472287-4d71bcdd2085')],
          tags: ['drink', 'coffee', 'hot'],
          sort_order: 2,
        },
        {
          slug: 'bottled-soda',
          name: 'Bottled Soda',
          description: 'Chilled glass-bottle soda. Available in cola, orange, and lemon-lime.',
          base_price_minor: 200000,
          image_urls: [img('1527960471264-932f39eb5846')],
          tags: ['drink', 'cold', 'soda'],
          sort_order: 3,
        },
      ],
    },
  ],
}

// ─── Bakery 2: The Golden Whisk ───────────────────────────────────────────────

const GOLDEN_WHISK: BakeryDef = {
  slug: 'the-golden-whisk',
  legal_name: 'Golden Whisk Patisserie Ltd',
  display_name: 'The Golden Whisk',
  tagline: 'Where butter meets craft.',
  description:
    "Kampala's favourite artisan patisserie and coffee corner. Handcrafted viennoiserie, celebration cakes, and specialty coffee at Acacia Mall.",
  logo_url: GOLDEN_WHISK_LOGO,
  hero_image_url: img('1556742049-0cfed4f6a45d'),
  primary_color: '#F9A931',
  accent_color: '#1A0A00',
  phone: '+256700200002',
  email: 'hello@goldenwhisk.ug',
  address_line1: 'Acacia Mall, Kisementi',
  city: 'Kampala',
  latitude: 0.336,
  longitude: 32.585,
  accepts_pickup: true,
  accepts_delivery: true,
  delivery_fee_minor: 500000,
  delivery_radius_km: 10.0,
  min_order_minor: 1500000,
  owner: {
    email: 'owner@goldenwhisk.ug',
    password: 'GoldenWhisk!2026',
    full_name: 'Golden Whisk Owner',
  },
  categories: [
    {
      name: 'Viennoiserie',
      slug: 'viennoiserie',
      sort_order: 1,
      products: [
        {
          slug: 'butter-croissant',
          name: 'Butter Croissant',
          description: 'Classic laminated butter croissant — flaky, golden, and deeply buttery. Baked fresh each morning.',
          base_price_minor: 450000,
          image_urls: [img('1555507036-ab1f4038808a')],
          tags: ['pastry', 'croissant', 'breakfast', 'viennoiserie'],
          sort_order: 1,
        },
        {
          slug: 'pain-au-chocolat',
          name: 'Pain au Chocolat',
          description: 'Buttery croissant dough enveloping two dark chocolate sticks. A patisserie essential.',
          base_price_minor: 550000,
          image_urls: [img('1623334044303-241021148842')],
          tags: ['pastry', 'chocolate', 'breakfast', 'viennoiserie'],
          sort_order: 2,
        },
        {
          slug: 'almond-danish',
          name: 'Almond Danish',
          description: 'A rich Danish pastry filled with almond frangipane and topped with toasted flaked almonds.',
          base_price_minor: 600000,
          image_urls: [img('1526081347589-7151db73a7e9')],
          tags: ['pastry', 'almond', 'danish', 'viennoiserie'],
          sort_order: 3,
        },
      ],
    },
    {
      name: 'Cupcakes',
      slug: 'cupcakes',
      sort_order: 2,
      products: [
        {
          slug: 'red-velvet-cupcake',
          name: 'Red Velvet Cupcake',
          description: 'Deep crimson velvet sponge topped with a cloud of cream cheese frosting.',
          base_price_minor: 400000,
          image_urls: [img('1614707267537-b85aaf00c4b7')],
          tags: ['cupcake', 'red-velvet', 'cream-cheese'],
          sort_order: 1,
        },
        {
          slug: 'salted-caramel-cupcake',
          name: 'Salted Caramel Cupcake',
          description: 'Brown butter sponge filled with house-made caramel, finished with fleur de sel.',
          base_price_minor: 450000,
          image_urls: [img('1568051243858-533a607809a5')],
          tags: ['cupcake', 'caramel', 'salted'],
          sort_order: 2,
        },
        {
          slug: 'lemon-drizzle-cupcake',
          name: 'Lemon Drizzle Cupcake',
          description: 'Bright lemon sponge soaked in a sharp lemon syrup and crowned with lemon buttercream.',
          base_price_minor: 400000,
          image_urls: [img('1519869325930-281384150729')],
          tags: ['cupcake', 'lemon', 'citrus'],
          sort_order: 3,
        },
      ],
    },
    {
      name: 'Layer Cakes',
      slug: 'layer-cakes',
      sort_order: 3,
      products: [
        {
          slug: 'classic-chocolate-fudge',
          name: 'Classic Chocolate Fudge',
          description: 'Three layers of dark chocolate sponge with silky chocolate fudge frosting. A celebration staple.',
          base_price_minor: 4500000,
          image_urls: [img('1578985545062-69928b1d9587')],
          tags: ['cake', 'chocolate', 'celebration', 'layer-cake'],
          sort_order: 1,
          requires_advance_notice_hours: 48,
          variants: [
            { name: '6 inch (serves 8)', price_minor: 4500000, sort_order: 1 },
            { name: '9 inch (serves 14)', price_minor: 8500000, sort_order: 2 },
          ],
        },
        {
          slug: 'carrot-walnut-cake',
          name: 'Carrot & Walnut',
          description: 'Spiced carrot cake with chopped walnuts and a thick cream cheese frosting.',
          base_price_minor: 5000000,
          image_urls: [img('1621955511929-5d86c58e2d3e')],
          tags: ['cake', 'carrot', 'walnut', 'celebration'],
          sort_order: 2,
          requires_advance_notice_hours: 48,
          variants: [
            { name: '6 inch (serves 8)', price_minor: 5000000, sort_order: 1 },
            { name: '9 inch (serves 14)', price_minor: 9500000, sort_order: 2 },
          ],
        },
      ],
    },
    {
      name: 'Coffee Bar',
      slug: 'coffee-bar',
      sort_order: 4,
      products: [
        {
          slug: 'cappuccino',
          name: 'Cappuccino',
          description: 'Double shot of single-origin Ugandan espresso with equal parts steamed and frothed milk.',
          base_price_minor: 600000,
          image_urls: [img('1509042239860-f550ce710b93')],
          tags: ['coffee', 'hot', 'espresso'],
          sort_order: 1,
        },
        {
          slug: 'caffe-latte',
          name: 'Caffè Latte',
          description: 'Smooth double espresso topped with a generous pour of velvety steamed milk.',
          base_price_minor: 650000,
          image_urls: [img('1461023058943-07fcbe16d735')],
          tags: ['coffee', 'hot', 'milk'],
          sort_order: 2,
        },
        {
          slug: 'iced-mocha',
          name: 'Iced Mocha',
          description: 'Chilled espresso, house-made chocolate sauce, and cold milk over ice. Summer in a cup.',
          base_price_minor: 800000,
          image_urls: [img('1570968915860-54d5c301fa9f')],
          tags: ['coffee', 'cold', 'chocolate', 'iced'],
          sort_order: 3,
        },
        {
          slug: 'hot-chocolate',
          name: 'Hot Chocolate',
          description: 'Rich blended cocoa with steamed whole milk. Comforting, sweet, deeply chocolatey.',
          base_price_minor: 550000,
          image_urls: [img('1517578239113-b03992dcdd25')],
          tags: ['chocolate', 'hot', 'drink'],
          sort_order: 4,
        },
      ],
    },
  ],
}

// ─── Bakery 3: Maison Léa ─────────────────────────────────────────────────────

const MAISON_LEA: BakeryDef = {
  slug: 'maison-lea',
  legal_name: 'Maison Léa Fine Pâtisserie Ltd',
  display_name: 'Maison Léa',
  tagline: "L'art de la pâtisserie, à Kampala.",
  description:
    "Kampala's finest French pâtisserie. Classical French technique, imported Valrhona chocolate, and signature gâteaux crafted daily at our Kololo atelier.",
  logo_url: MAISON_LEA_LOGO,
  hero_image_url: img('1483695028939-5bb13f8648b0'),
  primary_color: '#7B1E3B',
  accent_color: '#C9A24B',
  phone: '+256700300003',
  email: 'bonjour@maisonlea.ug',
  address_line1: '4 Elizabeth Avenue',
  address_line2: 'Kololo',
  city: 'Kampala',
  latitude: 0.339,
  longitude: 32.589,
  accepts_pickup: true,
  accepts_delivery: true,
  delivery_fee_minor: 1500000,
  delivery_radius_km: 15.0,
  min_order_minor: 5000000,
  owner: {
    email: 'owner@maisonlea.ug',
    password: 'MaisonLea!2026',
    full_name: 'Maison Léa Owner',
  },
  categories: [
    {
      name: 'Macarons',
      slug: 'macarons',
      sort_order: 1,
      products: [
        {
          slug: 'macaron-gift-box',
          name: 'Macaron Gift Box',
          description:
            'Seasonal assortment of hand-piped macarons in classic French flavours: vanilla, framboise, citron, caramel, pistache, and chocolat.',
          base_price_minor: 3500000,
          image_urls: [img('1558326567-98ae2405596b')],
          tags: ['macaron', 'gift', 'french', 'luxury'],
          sort_order: 1,
          requires_advance_notice_hours: 24,
          variants: [
            { name: 'Box of 6', price_minor: 3500000, sort_order: 1 },
            { name: 'Box of 12', price_minor: 6500000, sort_order: 2 },
          ],
        },
      ],
    },
    {
      name: 'Signature Gâteaux',
      slug: 'signature-gateaux',
      sort_order: 2,
      products: [
        {
          slug: 'opera',
          name: 'Opéra',
          description:
            'The French classic — layers of joconde almond sponge, coffee buttercream, and Valrhona chocolate ganache. Serves 8.',
          base_price_minor: 9500000,
          image_urls: [img('1578985545062-69928b1d9587')],
          tags: ['gateau', 'opera', 'french', 'luxury', 'chocolate', 'coffee'],
          sort_order: 1,
          requires_advance_notice_hours: 72,
        },
        {
          slug: 'framboise-pistache-entremet',
          name: 'Framboise Pistache Entremet',
          description:
            'A modern entremet of pistachio dacquoise, framboise mousse, and mirror glaze. A showstopper for any occasion. Serves 8.',
          base_price_minor: 12000000,
          image_urls: [img('1611293388250-580b08c4a145')],
          tags: ['gateau', 'entremet', 'raspberry', 'pistachio', 'luxury'],
          sort_order: 2,
          requires_advance_notice_hours: 72,
        },
        {
          slug: 'royal-chocolat',
          name: 'Royal Chocolat',
          description:
            'Valrhona dark chocolate mousse over a hazelnut dacquoise base, finished with a velvet cocoa spray. Serves 10.',
          base_price_minor: 14000000,
          image_urls: [img('1571115177098-24ec42ed204d')],
          tags: ['gateau', 'chocolate', 'valrhona', 'luxury'],
          sort_order: 3,
          requires_advance_notice_hours: 72,
        },
      ],
    },
    {
      name: 'Pâtisserie',
      slug: 'patisserie',
      sort_order: 3,
      products: [
        {
          slug: 'eclair-au-chocolat',
          name: 'Éclair au Chocolat',
          description:
            'Crisp choux shell piped with Valrhona chocolate pastry cream, topped with a glossy fondant glaze.',
          base_price_minor: 1200000,
          image_urls: [img('1615484477778-ca3b77940c25')],
          tags: ['patisserie', 'eclair', 'chocolate', 'choux'],
          sort_order: 1,
        },
        {
          slug: 'mille-feuille',
          name: 'Mille-feuille',
          description:
            'Three layers of shattering feuilletage caramelisée, filled with vanilla bean pastry cream. Assembled to order.',
          base_price_minor: 1500000,
          image_urls: [img('1612809077868-f862c12f4db5')],
          tags: ['patisserie', 'mille-feuille', 'vanilla', 'classic'],
          sort_order: 2,
        },
        {
          slug: 'lemon-tart',
          name: 'Lemon Tart',
          description:
            "Crisp pâte sucrée shell filled with smooth lemon curd and topped with Italian meringue, torched to order.",
          base_price_minor: 1400000,
          image_urls: [img('1519869325930-281384150729')],
          tags: ['tart', 'lemon', 'meringue', 'patisserie'],
          sort_order: 3,
        },
      ],
    },
    {
      name: 'Artisan Bread',
      slug: 'artisan-bread',
      sort_order: 4,
      products: [
        {
          slug: 'sourdough-boule',
          name: 'Sourdough Boule',
          description:
            'Long-fermented sourdough using our 5-year-old starter. Open crumb, crackly crust. Baked Tuesday, Thursday, and Saturday.',
          base_price_minor: 1800000,
          image_urls: [img('1549931319-a545dcf3bc7c')],
          tags: ['bread', 'sourdough', 'artisan'],
          sort_order: 1,
          requires_advance_notice_hours: 24,
        },
        {
          slug: 'country-baguette',
          name: 'Country Baguette',
          description: "A rustique baguette with a golden blistered crust and airy open crumb. Perfect with fromage.",
          base_price_minor: 800000,
          image_urls: [img('1568471173242-461f0a730452')],
          tags: ['bread', 'baguette', 'french', 'artisan'],
          sort_order: 2,
        },
      ],
    },
    {
      name: 'Café',
      slug: 'cafe',
      sort_order: 5,
      products: [
        {
          slug: 'single-origin-espresso',
          name: 'Single-Origin Espresso',
          description: 'A rotating single-origin from East African estates — bright, fruity, complex.',
          base_price_minor: 900000,
          image_urls: [img('1521302080334-4bebac2763a6')],
          tags: ['coffee', 'espresso', 'single-origin'],
          sort_order: 1,
        },
        {
          slug: 'flat-white',
          name: 'Flat White',
          description: 'Double ristretto with microfoamed whole milk. Intense and silky.',
          base_price_minor: 1100000,
          image_urls: [img('1461023058943-07fcbe16d735')],
          tags: ['coffee', 'flat-white', 'milk'],
          sort_order: 2,
        },
        {
          slug: 'affogato',
          name: 'Affogato',
          description:
            'A scoop of house-made vanilla gelato drowned in a double shot of hot espresso. Serve immediately.',
          base_price_minor: 1600000,
          image_urls: [img('1568470977543-7f6b9f7df0b4')],
          tags: ['coffee', 'dessert', 'gelato', 'affogato'],
          sort_order: 3,
        },
        {
          slug: 'hot-valrhona-chocolate',
          name: 'Hot Valrhona Chocolate',
          description:
            '100% Valrhona cocoa dissolved in steamed whole milk — thick, bittersweet, unmistakably premium.',
          base_price_minor: 1400000,
          image_urls: [img('1517578239113-b03992dcdd25')],
          tags: ['chocolate', 'hot', 'valrhona', 'drink'],
          sort_order: 4,
        },
      ],
    },
  ],
}

export const BAKERIES: BakeryDef[] = [KAMPALA_CRUST, GOLDEN_WHISK, MAISON_LEA]
