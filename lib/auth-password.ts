import { hash, verify } from '@node-rs/argon2'

// argon2id defaults from @node-rs are sensible; keep options minimal.
export async function hashPassword(plain: string): Promise<string> {
  return hash(plain)
}

export async function verifyPassword(hashed: string, plain: string): Promise<boolean> {
  try {
    return await verify(hashed, plain)
  } catch {
    return false
  }
}
