import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect all /admin routes except the login page
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const sessionCookie = request.cookies.get('admin_session')

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      const session = JSON.parse(sessionCookie.value)
      
      if (!session || !session.userId || !session.role) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }

      // Role-Based Access Control (RBAC) in middleware
      // Only ADMIN can access /admin/executives and /admin/users
      const role = session.role
      if (role !== 'ADMIN') {
        if (pathname.startsWith('/admin/executives') || pathname.startsWith('/admin/users')) {
          return NextResponse.redirect(new URL('/admin', request.url))
        }
      }
    } catch (e) {
      // Clear invalid cookie and redirect to login
      const response = NextResponse.redirect(new URL('/admin/login', request.url))
      response.cookies.delete('admin_session')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
