import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const token = request.cookies.get('access_token')?.value
    const { pathname } = request.nextUrl

    // Protected routes: dashboard
    if (pathname.startsWith('/dashboard')) {
        if (!token) {
            return NextResponse.redirect(new URL('/auth/login', request.url))
        }
    }

    // Auth routes: login
    if (pathname.startsWith('/auth/login')) {
        if (token) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/dashboard/:path*', '/auth/login'],
}
