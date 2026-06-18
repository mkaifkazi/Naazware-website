import imageUrlBuilder from '@sanity/image-url'
import type { Image } from 'sanity'
import { dataset, projectId } from '../env'

const builder = projectId ? imageUrlBuilder({ projectId, dataset }) : null

/** Returns a CDN URL for a Sanity image, or null if unconfigured/empty. */
export function urlForImage(source: Image | undefined | null, width = 1200): string | null {
  if (!builder || !source || !(source as { asset?: unknown }).asset) return null
  return builder.image(source).width(width).fit('max').auto('format').url()
}
