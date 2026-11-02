import type { Database } from '@eatgood/db'
import { getSuperAdminByEmail } from '@eatgood/db'
import { generateSync } from 'otplib'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { verifyPassword } from '../../lib/password'

import { loginAdmin } from './admin'

const TOTP_SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'

const mockAdmin = {
  id: 'admin-1',
  email: 'admin@example.com',
  password_hash: 'hashed',
  totp_secret: TOTP_SECRET,
}

vi.mock('@eatgood/db', () => ({
  getSuperAdminByEmail: vi.fn(),
  updateSuperAdminLastLogin: vi.fn(),
  getRefreshToken: vi.fn(),
  revokeRefreshToken: vi.fn(),
}))

vi.mock('../../lib/password', () => ({
  verifyPassword: vi.fn(),
}))

vi.mock('../../lib/tokens', () => ({
  signAccessToken: vi.fn(() => 'access-token'),
  createRefreshToken: vi.fn(() => ({ raw: 'refresh-token', expiresAt: new Date('2030-01-01') })),
  rotateRefreshToken: vi.fn(),
}))

const db = {} as Database

describe('loginAdmin TOTP verification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSuperAdminByEmail).mockResolvedValue(mockAdmin as never)
    vi.mocked(verifyPassword).mockResolvedValue(true)
  })

  it('accepts a correct TOTP code', async () => {
    const result = await loginAdmin(db, {
      email: mockAdmin.email,
      password: 'pw',
      totp_code: generateSync({ secret: TOTP_SECRET }),
    })

    expect(result.accessToken).toBe('access-token')
  })

  it('rejects an incorrect TOTP code (2FA must not be bypassable)', async () => {
    await expect(
      loginAdmin(db, { email: mockAdmin.email, password: 'pw', totp_code: '000000' }),
    ).rejects.toThrow('invalid totp code')
  })

  it('rejects a wrong password before checking TOTP', async () => {
    vi.mocked(verifyPassword).mockResolvedValue(false)

    await expect(
      loginAdmin(db, {
        email: mockAdmin.email,
        password: 'wrong',
        totp_code: generateSync({ secret: TOTP_SECRET }),
      }),
    ).rejects.toThrow('invalid credentials')
  })

  it('never logs the TOTP secret or submitted code', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const code = generateSync({ secret: TOTP_SECRET })

    await loginAdmin(db, { email: mockAdmin.email, password: 'pw', totp_code: code })

    const logged = JSON.stringify([...logSpy.mock.calls, ...errorSpy.mock.calls])
    expect(logged).not.toContain(TOTP_SECRET)
    expect(logged).not.toContain(code)

    logSpy.mockRestore()
    errorSpy.mockRestore()
  })
})
