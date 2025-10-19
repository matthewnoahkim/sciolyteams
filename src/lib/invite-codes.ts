import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'

/**
 * Generates a human-readable invite code
 */
export function generateInviteCode(): string {
  // Generate 12-character code
  return nanoid(12)
}

/**
 * Hashes an invite code for secure storage
 */
export async function hashInviteCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10)
}

/**
 * Verifies an invite code against a hash
 */
export async function verifyInviteCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash)
}

/**
 * Creates both captain and member invite codes
 */
export async function createInviteCodes(): Promise<{
  captainCode: string
  captainHash: string
  memberCode: string
  memberHash: string
}> {
  const captainCode = generateInviteCode()
  const memberCode = generateInviteCode()
  
  const [captainHash, memberHash] = await Promise.all([
    hashInviteCode(captainCode),
    hashInviteCode(memberCode),
  ])
  
  return {
    captainCode,
    captainHash,
    memberCode,
    memberHash,
  }
}

