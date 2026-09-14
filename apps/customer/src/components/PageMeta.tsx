const SITE_NAME = 'Eat Good Uganda'
const DEFAULT_DESCRIPTION = "Order from Uganda's best bakeries — fresh bread, cakes, and pastries delivered to your door or ready for pickup."
const DEFAULT_IMAGE = 'https://eat-good-uganda-customer.vercel.app/og-default.png'

type Props = {
  /** Page-specific title. Rendered as "{title} | Eat Good Uganda", unless `raw` is set. */
  title: string
  /** Render `title` verbatim without appending the site name (used for the homepage). */
  raw?: boolean
  description?: string
  image?: string
  noIndex?: boolean
}

/**
 * Sets the document <title> and meta/Open Graph/Twitter tags for the current page.
 *
 * Relies on React 19's built-in support for hoisting <title>/<meta> rendered
 * anywhere in the tree up into <head> — no portal or effect required.
 */
export function PageMeta({ title, raw = false, description, image, noIndex = false }: Props) {
  const fullTitle = raw ? title : `${title} | ${SITE_NAME}`
  const metaDescription = description ?? DEFAULT_DESCRIPTION
  const metaImage = image ?? DEFAULT_IMAGE

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={metaImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
    </>
  )
}
