import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.INVITE_CODE_ENCRYPTION_KEY || 'default-key-please-change-in-production-32-chars!!'
const ALGORITHM = 'aes-256-cbc'

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
 * Encrypts an invite code for retrievable storage
 */
export function encryptInviteCode(code: string): string {
  const iv = crypto.randomBytes(16)
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(code, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  // Return IV and encrypted data together
  return iv.toString('hex') + ':' + encrypted
}

/**
 * Decrypts an invite code
 */
export function decryptInviteCode(encrypted: string): string {
  const [ivHex, encryptedData] = encrypted.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Creates both captain and member invite codes
 */
export async function createInviteCodes(): Promise<{
  captainCode: string
  captainHash: string
  captainEncrypted: string
  memberCode: string
  memberHash: string
  memberEncrypted: string
}> {
  const captainCode = generateInviteCode()
  const memberCode = generateInviteCode()
  
  const [captainHash, memberHash] = await Promise.all([
    hashInviteCode(captainCode),
    hashInviteCode(memberCode),
  ])

  const captainEncrypted = encryptInviteCode(captainCode)
  const memberEncrypted = encryptInviteCode(memberCode)
  
  return {
    captainCode,
    captainHash,
    captainEncrypted,
    memberCode,
    memberHash,
    memberEncrypted,
  }
}

