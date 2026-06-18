export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-06-01'
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || ''

/** True once a Sanity project is configured; until then the site falls back to local data. */
export const isSanityConfigured = Boolean(projectId)
