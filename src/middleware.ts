import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import * as jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Skip middleware for public routes
    if (
        pathname === '/login' ||
        pathname === '/register' ||
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
        // Just verify token is valid
        jwt.verify(token, JWT_SECRET)

        // Trial check will be done in individual pages/layouts
        // to avoid Edge Runtime limitations with Prisma

        return NextResponse.next()
    } catch (error) {
        console.error('Middleware error:', error)
        return NextResponse.redirect(new URL('/login', request.url))
    }
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
