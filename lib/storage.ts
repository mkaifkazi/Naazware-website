import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const {
  R2_ACCOUNT_ID = '',
  R2_ACCESS_KEY_ID = '',
  R2_SECRET_ACCESS_KEY = '',
  R2_BUCKET = '',
  R2_PUBLIC_URL = '',
} = process.env

export function r2Configured(): boolean {
  return Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET && R2_PUBLIC_URL)
}

// Lazily created so importing this module never throws when R2 is unconfigured.
let _client: S3Client | null = null
function client(): S3Client {
  if (!r2Configured()) throw new Error('R2 is not configured')
  if (!_client) {
    _client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
      },
    })
  }
  return _client
}

const slugifyFilename = (name: string) => {
  const dot = name.lastIndexOf('.')
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const ext = dot > 0 ? name.slice(dot).toLowerCase().replace(/[^a-z0-9.]/g, '') : ''
  return `${base || 'file'}${ext}`
}

export function buildObjectKey(folder: string, filename: string): string {
  const id = Math.random().toString(36).slice(2, 8)
  const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, '').replace(/^\/+|\/+$/g, '') || 'uploads'
  return `${safeFolder}/${id}_${slugifyFilename(filename)}`
}

export function publicUrl(key: string): string {
  return `${(process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '')}/${key}`
}

export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresSeconds = 300
): Promise<string> {
  const cmd = new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, ContentType: contentType })
  return getSignedUrl(client(), cmd, { expiresIn: expiresSeconds })
}

export async function putObject(
  key: string,
  body: Uint8Array | Buffer | string,
  contentType: string
): Promise<void> {
  await client().send(
    new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, Body: body, ContentType: contentType })
  )
}

export async function deleteObject(key: string): Promise<void> {
  await client().send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }))
}
