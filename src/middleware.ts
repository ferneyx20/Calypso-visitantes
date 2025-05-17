
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const MOCK_AUTH_COOKIE_NAME = 'mock_auth_token';
const LOGIN_PATH = '/login';
const APP_ROOT_PATH = '/admin-dashboard'; // Updated APP_ROOT_PATH
const PUBLIC_PATHS = ['/autoregistro']; // Rutas públicas además del login

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.has(MOCK_AUTH_COOKIE_NAME);

  // Allow access to API routes, static files, image optimization, and public assets without auth check
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') || // Covers _next/static and _next/image
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') || 
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.startsWith('/images/') 
  ) {
    return NextResponse.next();
  }

  // Allow access to explicitly defined public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Temporarily commented out authentication logic
  /*
  if (isAuthenticated) {
    // If authenticated and trying to access /login, redirect to app root
    if (pathname === LOGIN_PATH) {
      return NextResponse.redirect(new URL(APP_ROOT_PATH, request.url));
    }
  } else {
    // If not authenticated and not on /login page (and not other public paths), redirect to /login
    if (pathname !== LOGIN_PATH) {
      const redirectUrl = new URL(LOGIN_PATH, request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }
  */

  return NextResponse.next();
}

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - api (API routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - images (public images folder if you have one)
   * The middleware function above handles these exclusions explicitly as well.
   * This matcher helps to avoid running middleware on unnecessary paths.
   */
  matcher: [
    '/((?!api|_next/static|_next/image|images|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$).*)',
  ],
};
