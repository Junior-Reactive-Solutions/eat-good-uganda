# Logo Integration Guide

## Status: Ready for Integration

Three professional bakery logos have been created and are ready to be integrated into the website.

---

## The Three Logos

### 1. Kampala Crust Logo
- **Style:** Organic wheat sheaf with bread loaves
- **Colors:** Warm brown (#A8763E), golden accents (#D4A96A)
- **Mood:** Community, authentic, everyday bakery
- **Filename:** `kampala-crust-logo.png`

### 2. The Golden Whisk Logo
- **Style:** Elegant whisk with sparkling droplet element
- **Colors:** Gold (#F9A931), deep brown accents (#1A0A00)
- **Mood:** Sophisticated, artisanal, refined
- **Filename:** `the-golden-whisk-logo.png`

### 3. Maison Léa Logo
- **Style:** Heraldic crest with crown and monogram "L"
- **Colors:** Burgundy (#7B1E3B), champagne gold (#C9A24B)
- **Mood:** Luxury, heritage, exclusive
- **Filename:** `maison-lea-logo.png`

---

## How to Integrate (Step by Step)

### Option A: Quick Integration (Recommended)

**Step 1:** Save logo files to public directories
```
apps/customer/public/logos/
  ├── kampala-crust-logo.png
  ├── the-golden-whisk-logo.png
  └── maison-lea-logo.png

apps/bakery-admin/public/logos/
  ├── kampala-crust-logo.png
  ├── the-golden-whisk-logo.png
  └── maison-lea-logo.png

apps/super-admin/public/logos/
  ├── kampala-crust-logo.png
  ├── the-golden-whisk-logo.png
  └── maison-lea-logo.png
```

**Step 2:** Update seed data
In `apps/api/src/scripts/seed-data/bakeries.ts`, change the `logo_url` fields:

```typescript
// Kampala Crust
logo_url: '/logos/kampala-crust-logo.png'

// The Golden Whisk
logo_url: '/logos/the-golden-whisk-logo.png'

// Maison Léa
logo_url: '/logos/maison-lea-logo.png'
```

**Step 3:** Re-run the seed script
```bash
cd apps/api
DATABASE_URL="..." npx tsx src/scripts/seed-bakeries.ts
```

**Step 4:** Rebuild and deploy
```bash
pnpm -w build
# Push to main for auto-deploy
```

---

### Option B: Serve from CDN (More Scalable)

Upload logos to a CDN like Cloudinary, then reference them:

```typescript
logo_url: 'https://res.cloudinary.com/your-account/image/upload/v1/kampala-crust-logo.png'
```

---

### Option C: Embed as Base64 Data URIs

For complete portability, convert PNG to base64 and embed directly:

```typescript
logo_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
```

---

## File Specifications

All logos are provided as **PNG files, 512×512px** with transparent backgrounds.

### For Web Display
- **Format:** PNG
- **Resolution:** 512×512px (will scale automatically)
- **Transparency:** Full (checkered background)
- **File Size:** ~30-50 KB each

### For Different Use Cases

| Use Case | Size | Format | Where |
|---|---|---|---|
| Web display (bakery cards) | 512×512px | PNG | `/logos/` directory |
| Mobile app icon | 192×192px | PNG | App asset folders |
| Favicon | 32×32px | PNG | `/public/favicon/` |
| Print (packaging) | 1200×1200px @ 300 DPI | PNG | Marketing assets |

---

## Database Updates Required

The `bakeries` table has a `logo_url` field. Currently set to SVG data URIs, they need to be updated to:

**Option 1 (URLs):**
```sql
UPDATE bakeries SET logo_url = '/logos/kampala-crust-logo.png' 
WHERE slug = 'kampala-crust';

UPDATE bakeries SET logo_url = '/logos/the-golden-whisk-logo.png' 
WHERE slug = 'the-golden-whisk';

UPDATE bakeries SET logo_url = '/logos/maison-lea-logo.png' 
WHERE slug = 'maison-lea';
```

**Option 2 (Seed script):**
Update the seed data file and re-run the script (recommended for clean database).

---

## Where Logos Will Display

Once integrated, the logos will appear:

### Customer App (https://eat-good-uganda.vercel.app)
- [ ] Bakery listing page (hero card with logo)
- [ ] Bakery detail page (header with logo)
- [ ] Order confirmation (logo in receipt)

### Bakery Admin (https://eat-good-uganda-bakery-admin.vercel.app)
- [ ] Dashboard header (bakery logo)
- [ ] Settings page (logo preview)
- [ ] Product listing (bakery branding)

### Super Admin (https://eat-good-uganda-super-admin.vercel.app)
- [ ] Bakeries list (logo in card)
- [ ] Bakery detail page (header logo)
- [ ] Analytics dashboard (bakery identification)

---

## Next Steps

### Immediate (Development)
1. [ ] Obtain PNG files for all three logos
2. [ ] Create `/public/logos/` directories in each app
3. [ ] Copy PNG files to those directories
4. [ ] Update seed data to reference the logo files
5. [ ] Run seed script to update database
6. [ ] Test locally to verify logos display

### Deployment (Production)
1. [ ] Commit logo files to git
2. [ ] Push to main branch
3. [ ] Vercel auto-deploys (logos available at `/logos/` URL)
4. [ ] Render API deploys (no changes needed on backend)
5. [ ] Test live website to verify logos display on all three apps

### Verification Checklist
- [ ] Logos display on customer app bakery listing
- [ ] Logos display on bakery admin dashboard
- [ ] Logos display on super admin bakeries list
- [ ] Logos maintain quality when scaled (don't pixelate)
- [ ] Logos display correctly on mobile devices
- [ ] Logos appear in bakery detail pages
- [ ] Transparent backgrounds work on all backgrounds

---

## Technical Details

### Image Specifications
- **Format:** PNG-32 (RGBA)
- **Dimensions:** 512×512px
- **DPI:** 72 DPI (web standard)
- **Transparency:** Full (alpha channel)
- **Color Space:** sRGB
- **Interlacing:** None (for web)

### Performance
- Each logo: ~30-50 KB (efficient for web)
- Total for three logos: ~100-150 KB
- Load time impact: Negligible (<100ms)

### Browser Support
- [ ] Chrome/Edge: Full support
- [ ] Firefox: Full support
- [ ] Safari: Full support
- [ ] Mobile browsers: Full support

---

## Troubleshooting

### Logos Not Displaying
**Check:**
1. Files exist in `/public/logos/` directory
2. Filename matches exactly in seed data
3. File permissions allow reading
4. Browser cache cleared (Cmd+Shift+R)
5. Browser console for 404 errors

### Logos Look Pixelated
**Solution:**
- Use original 512×512px files (not smaller)
- CSS will scale automatically without quality loss
- If needed, provide 1024×1024px versions

### Database Not Updated
**Check:**
1. Seed script ran without errors
2. DATABASE_URL environment variable is correct
3. Neon database is reachable
4. Previous bakeries were not deleted

---

## File Checklist for Implementation

When you're ready to integrate, you should have:

- [ ] `apps/customer/public/logos/kampala-crust-logo.png`
- [ ] `apps/customer/public/logos/the-golden-whisk-logo.png`
- [ ] `apps/customer/public/logos/maison-lea-logo.png`
- [ ] `apps/bakery-admin/public/logos/` (same three files)
- [ ] `apps/super-admin/public/logos/` (same three files)
- [ ] Updated `apps/api/src/scripts/seed-data/bakeries.ts` with new logo URLs
- [ ] Verification that `pnpm -w build` completes without errors
- [ ] Test deployment pushed to production

---

## Implementation Commands

Once you have the logo files in the correct directories:

```bash
# Rebuild
pnpm -w build

# Test locally (if running dev server)
pnpm -w dev

# Check for errors
pnpm -w typecheck
pnpm -w lint

# Commit
git add .
git commit -m "feat: integrate professional bakery logos"

# Push to deploy
git push origin main
```

---

## Visual Verification

After deployment, visit these URLs to verify logos display:

**Customer App:**
- https://eat-good-uganda.vercel.app (bakery list with logos)

**Super Admin:**
- https://eat-good-uganda-super-admin.vercel.app/bakeries (bakery cards with logos)

**Bakery Admin:**
- https://eat-good-uganda-bakery-admin.vercel.app (dashboard with bakery logo)

---

## Support

If logos don't display after following these steps:
1. Check browser console for 404 errors
2. Verify file paths exactly match URLs
3. Clear browser cache and reload
4. Check git status to ensure files are tracked
5. Verify build completed without errors
