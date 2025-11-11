import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROUTES, TOKEN_COOKIE_NAME } from '@/constants';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;

  // Public routes that don't require authentication
  const publicRoutes = [
    ROUTES.LOGIN,
    ROUTES.SIGNUP,
    ROUTES.FORGOT_PASSWORD,
    ROUTES.OAUTH_CALLBACK,
  ];

  const isPublicRoute = publicRoutes.includes(pathname);
  const isApiRoute = pathname.startsWith('/api');
  const isAuthRoute = pathname.startsWith('/api/auth');

  // Allow API routes and static files
  if (isApiRoute || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  // Redirect authenticated users away from auth pages
  if (token && isPublicRoute && pathname !== ROUTES.OAUTH_CALLBACK) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
  }

  // Redirect unauthenticated users to login for protected routes
  if (!token && !isPublicRoute && pathname !== '/') {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
