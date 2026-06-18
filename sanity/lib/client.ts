import { createClient, type SanityClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '../env'

/** Read-only client for published content. Null until a project is configured. */
export const client: SanityClient | null = projectId
  ? createClient({ projectId, dataset, apiVersion, useCdn: true, perspective: 'published' })
  : null
