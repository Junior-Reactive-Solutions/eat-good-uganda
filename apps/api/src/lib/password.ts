import * as argon2 from 'argon2'

export async function hashPassword(plaintext: string): Promise<string> {
  return argon2.hash(plaintext, {
    type: argon2.argon2id,
  })
}

export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return argon2.verify(hash, plaintext)
}
