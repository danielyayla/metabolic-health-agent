import { toHex } from '#server/hex.ts'

export async function emailToOAuthUserId(email: string): Promise<string> {
	const normalized = email.trim().toLowerCase()
	const data = new TextEncoder().encode(normalized)
	const hash = await crypto.subtle.digest('SHA-256', data)
	return toHex(new Uint8Array(hash))
}
