// Tiny client-side fetch helpers for the admin APIs. Throw on non-2xx.

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text()
  const data = text ? JSON.parse(text) : {}
  if (!res.ok) {
    const message = (data && (data.error as string)) || `Request failed (${res.status})`
    const err = new Error(message) as Error & { issues?: unknown; status?: number }
    err.issues = data?.issues
    err.status = res.status
    throw err
  }
  return data as T
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'same-origin' })
  return parse<T>(res)
}

export async function apiSend<T>(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: unknown
): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  return parse<T>(res)
}
