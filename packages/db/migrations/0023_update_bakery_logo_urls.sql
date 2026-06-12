-- 0023_update_bakery_logo_urls
-- Purpose: Update bakery logo_url from SVG data URIs to Vercel-hosted PNG URLs
-- Safe to re-run: yes (idempotent UPDATE)
-- migrate:up

UPDATE bakeries
SET logo_url = CASE slug
  WHEN 'kampala-crust' THEN 'https://eat-good-uganda-customer.vercel.app/logos/kampala-crust-logo.png'
  WHEN 'the-golden-whisk' THEN 'https://eat-good-uganda-customer.vercel.app/logos/the-golden-whisk-logo.png'
  WHEN 'maison-lea' THEN 'https://eat-good-uganda-customer.vercel.app/logos/maison-lea-logo.png'
  ELSE logo_url
END
WHERE slug IN ('kampala-crust', 'the-golden-whisk', 'maison-lea');

-- migrate:down

UPDATE bakeries
SET logo_url = CASE slug
  WHEN 'kampala-crust' THEN 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http://www.w3.org/2000/svg%22%20viewBox%3D%220%200%20200%20200%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23f59e0b%22/%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-size%3D%2224%22%20fill%3D%22white%22%20font-weight%3D%22bold%22%3EKampala%20Crust%3C/text%3E%3C/svg%3E'
  WHEN 'the-golden-whisk' THEN 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http://www.w3.org/2000/svg%22%20viewBox%3D%220%200%20200%20200%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23ec4899%22/%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-size%3D%2224%22%20fill%3D%22white%22%20font-weight%3D%22bold%22%3EGolden%20Whisk%3C/text%3E%3C/svg%3E'
  WHEN 'maison-lea' THEN 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http://www.w3.org/2000/svg%22%20viewBox%3D%220%200%20200%20200%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%238b5cf6%22/%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-size%3D%2224%22%20fill%3D%22white%22%20font-weight%3D%22bold%22%3EMaison%20L%C3%A9a%3C/text%3E%3C/svg%3E'
  ELSE logo_url
END
WHERE slug IN ('kampala-crust', 'the-golden-whisk', 'maison-lea');
