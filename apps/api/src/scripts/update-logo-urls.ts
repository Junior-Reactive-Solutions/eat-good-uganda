/**
 * One-time script to update logo_url values in the bakeries table.
 * Run after fixing DB credentials: pnpm -w tsx apps/api/src/scripts/update-logo-urls.ts
 */
import { Pool } from 'pg'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), 'apps/api/.env') })

const LOGO_UPDATES = [
  { slug: 'kampala-crust', logo_url: '/logos/kampala-crust-logo.png' },
  { slug: 'the-golden-whisk', logo_url: '/logos/the-golden-whisk-logo.png' },
  { slug: 'maison-lea', logo_url: '/logos/maison-lea-logo.png' },
]

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL not set')
    process.exit(1)
  }

  const pool = new Pool({ connectionString })
  try {
    for (const { slug, logo_url } of LOGO_UPDATES) {
      const result = await pool.query(
        'UPDATE bakeries SET logo_url = $1 WHERE slug = $2 RETURNING slug, display_name, logo_url',
        [logo_url, slug],
      )
      if (result.rows.length === 0) {
        console.log(`  [SKIP] No bakery found with slug: ${slug}`)
      } else {
        const row = result.rows[0] as { slug: string; display_name: string; logo_url: string }
        console.log(`  [OK]   ${row.display_name} → ${row.logo_url}`)
      }
    }
    console.log('\nDone. Current bakery logos:')
    const { rows } = await pool.query(
      'SELECT slug, display_name, logo_url FROM bakeries ORDER BY slug',
    )
    ;(rows as Array<{ slug: string; display_name: string; logo_url: string }>).forEach((r) => {
      console.log(`  ${r.slug}: ${r.logo_url}`)
    })
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
