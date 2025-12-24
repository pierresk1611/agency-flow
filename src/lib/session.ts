import { cookies } from 'next/headers'
import * as jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export interface Session {
  userId: string
  agencyId: string
  role: string
}

export function getSession(): Session | null {
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value

  if (!token) return null

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return {
      userId: decoded.userId,
      agencyId: decoded.agencyId,
      role: decoded.role
    }
  } catch (error) {
    return null
  }
}