import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Helper function to decode JWT and check expiration
function isTokenExpired(token: string): boolean {
    try {
        // JWT format: header.payload.signature
        const parts = token.split('.')
        if (parts.length !== 3) return true

        // Decode payload (base64url)
        const payload = JSON.parse(
            Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
        )

        // Check expiration time (exp is in seconds, Date.now() is in milliseconds)
        if (!payload.exp) return true
        return payload.exp * 1000 < Date.now()
    } catch {
        return true // If we can't decode, consider it expired
    }
}

export function middleware(request: NextRequest) {
    const token = request.cookies.get('access_token')?.value
    const { pathname } = request.nextUrl

    // Protected routes: dashboard
    if (pathname.startsWith('/dashboard')) {
        if (!token || isTokenExpired(token)) {
            // Clear the expired/invalid cookie
            const response = NextResponse.redirect(new URL('/auth/login', request.url))
            response.cookies.delete('access_token')
            return response
        }
    }

    // Auth routes: login
    if (pathname.startsWith('/auth/login')) {
        if (token && !isTokenExpired(token)) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/dashboard/:path*', '/auth/login'],
}
