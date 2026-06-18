import { createClient, type SanityClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '../env'

const token = process.env.SANITY_API_WRITE_TOKEN

/** Server-only client with write access (contact submissions, seeding). Never import client-side. */
export const writeClient: SanityClient | null =
  projectId && token
    ? createClient({ projectId, dataset, apiVersion, token, useCdn: false })
    : null
