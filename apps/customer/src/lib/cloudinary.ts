type CloudinaryTransformOptions = {
  w?: number | undefined
  h?: number | undefined
  q?: string | undefined
  f?: string | undefined
  c?: string | undefined
}

function cloudinaryImage(
  url: string | undefined,
  options: CloudinaryTransformOptions = {},
): string {
  if (!url) return ''

  // If the URL is already a Cloudinary URL, modify it
  if (url.includes('cloudinary')) {
    const parts = url.split('/upload/')
    if (parts.length === 2) {
      const transformations: string[] = []

      if (options.w) transformations.push(`w_${String(options.w)}`)
      if (options.h) transformations.push(`h_${String(options.h)}`)
      if (options.q) transformations.push(`q_${options.q}`)
      if (options.f) transformations.push(`f_${options.f}`)
      if (options.c) transformations.push(`c_${options.c}`)

      const transformString = transformations.join(',')
      if (transformString && parts[0] && parts[1]) {
        return `${parts[0]}/upload/${transformString}/${parts[1]}`
      }
      return url
    }
  }

  // For non-Cloudinary URLs, return as-is
  return url
}

export default cloudinaryImage
