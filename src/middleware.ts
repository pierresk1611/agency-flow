import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import * as jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Skip middleware for public routes
    if (
        pathname === '/login' ||
        pathname === '/subscription-expired' ||
        pathname.startsWith('/api/') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static')
    ) {
        return NextResponse.next()
    }

    // Check authentication
    const token = request.cookies.get('token')?.value
    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any
        const userId = decoded.userId

        // Get user and agency
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { agency: true }
        })

        if (!user || !user.agency) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // TRIAL EXPIRATION CHECK
        // Skip for SUPERADMIN
        if (user.role !== 'SUPERADMIN' && user.agency.subscriptionPlan === 'TRIAL') {
            if (user.agency.trialEndsAt && new Date(user.agency.trialEndsAt) < new Date()) {
                // Trial expired
                if (pathname !== '/subscription-expired') {
                    return NextResponse.redirect(new URL('/subscription-expired', request.url))
                }
            }
        }

        // Check if suspended
        if (user.agency.isSuspended && user.role !== 'SUPERADMIN') {
            if (pathname !== '/subscription-expired') {
                return NextResponse.redirect(new URL('/subscription-expired', request.url))
            }
        }

        return NextResponse.next()
    } catch (error) {
        console.error('Middleware error:', error)
        return NextResponse.redirect(new URL('/login', request.url))
    }
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
