// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { RolUsuarioPlataforma } from '@prisma/client'; // Importar si usas el rol

const MOCK_AUTH_COOKIE_NAME = 'mock_auth_token';
const LOGIN_PATH = '/login';
// Definir rutas base para cada rol
const ADMIN_DASHBOARD_PATH = '/admin-dashboard';
const STANDARD_DASHBOARD_PATH = '/standard-dashboard'; // Asumiendo que existe esta ruta

const PUBLIC_PATHS = ['/autoregistro'];

interface UserSessionData { // Tipo para los datos de la sesión en la cookie
  userId: string;
  empleadoId: string;
  rol: RolUsuarioPlataforma;
  nombre: string;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get(MOCK_AUTH_COOKIE_NAME);
  let isAuthenticated = false;
  let userSession: UserSessionData | null = null;

  if (authCookie && authCookie.value) {
    try {
      userSession = JSON.parse(authCookie.value) as UserSessionData;
      // Podrías añadir más validaciones aquí si userSession no tiene la estructura esperada
      if (userSession && userSession.userId && userSession.rol) {
        isAuthenticated = true;
      }
    } catch (e) {
      console.error('Error parsing auth cookie:', e);
      // Cookie inválida, tratar como no autenticado y quizás borrar la cookie
      const response = NextResponse.next();
      response.cookies.delete(MOCK_AUTH_COOKIE_NAME); // Borrar cookie malformada
      // Podrías redirigir a login aquí también si es una ruta protegida
      // return NextResponse.redirect(new URL(LOGIN_PATH, request.url), { headers: response.headers });
    }
  }


  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') || 
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.startsWith('/images/') 
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (isAuthenticated && userSession) {
    let expectedPathPrefix = '/';
    switch (userSession.rol) {
      case 'AdminPrincipal':
      case 'Administrador':
        expectedPathPrefix = ADMIN_DASHBOARD_PATH;
        break;
      case 'Estandar':
        expectedPathPrefix = STANDARD_DASHBOARD_PATH;
        break;
    }

    if (pathname === LOGIN_PATH) {
      // Si está autenticado y en login, redirigir a su dashboard correspondiente
      return NextResponse.redirect(new URL(expectedPathPrefix, request.url));
    }

    // Opcional: Si está autenticado pero en una ruta que no le corresponde a su rol
    // if (!pathname.startsWith(expectedPathPrefix) && pathname !== '/') { // Asumiendo que '/' es una landing genérica o no protegida por rol
    //   console.log(`Role mismatch: User with role ${userSession.rol} trying to access ${pathname}. Redirecting to ${expectedPathPrefix}`);
    //   return NextResponse.redirect(new URL(expectedPathPrefix, request.url));
    // }

  } else { // No autenticado
    if (pathname !== LOGIN_PATH) {
      const redirectUrl = new URL(LOGIN_PATH, request.url);
      // Guardar la URL original para redirigir después del login
      // redirectUrl.searchParams.set('callbackUrl', request.nextUrl.href); // O solo pathname
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|images|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$).*)',
  ],
};