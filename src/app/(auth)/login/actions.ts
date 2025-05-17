// src/app/(auth)/login/actions.ts
'use server'; // Make this a server action

// In a real app, you'd likely have a more robust way to get cookies
// For now, we'll import it dynamically when needed as it's a server-only module
// and cannot be at the top-level if this file might be imported by client components (though it shouldn't be directly).
// However, since this whole file is 'use server', direct import is fine.
import { cookies } from 'next/headers';

export interface LoginActionResult {
  success: boolean;
  message: string;
}

export async function loginAction(prevState: any, formData: FormData): Promise<LoginActionResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Simulate authentication
  if (email === 'admin@example.com' && password === 'password') {
    // In a real app, generate a secure token and set httpOnly cookie
    cookies().set('mock_auth_token', 'mock_user_jwt_token', {
      // httpOnly: true, // httpOnly can't be easily tested with client-side redirects in mock, but good for real app
      // secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });
    return { success: true, message: 'Inicio de sesión exitoso.' };
  } else {
    return { success: false, message: 'Correo electrónico o contraseña incorrectos.' };
  }
}
