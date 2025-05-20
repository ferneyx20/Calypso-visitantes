// src/app/(auth)/login/actions.ts
'use server';

import { cookies } from 'next/headers';
import prisma from '@/lib/prisma'; // Asegúrate que la ruta a tu cliente Prisma sea correcta
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type { RolUsuarioPlataforma } from '@prisma/client'; // Para el tipo de rol si lo almacenamos en la cookie

// Opcional: Schema para validar el input del formulario si quieres ser más estricto
const loginSchema = z.object({
  identification: z.string().min(1, "El número de identificación es requerido."),
  password: z.string().min(1, "La contraseña es requerida."),
});

export interface LoginActionResult {
  success: boolean;
  message: string;
  redirectTo?: string; // Opcional, para redirigir desde el cliente si es necesario
  error?: string; // Para errores más detallados
  userRole?: RolUsuarioPlataforma; // Para pasar el rol al cliente si es necesario
}

export async function loginAction(
  prevState: any, // El estado previo no se usa mucho aquí, pero es parte de la firma de useFormState
  formData: FormData
): Promise<LoginActionResult> {
  const rawFormData = {
    identification: formData.get('identification') as string,
    password: formData.get('password') as string,
  };

  // Validación con Zod (opcional pero recomendado)
  const validationResult = loginSchema.safeParse(rawFormData);
  if (!validationResult.success) {
    return {
      success: false,
      message: "Datos de entrada inválidos.",
      // Podrías mapear validationResult.error.flatten().fieldErrors para errores más específicos
      error: validationResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
    };
  }

  const { identification, password } = validationResult.data;

  try {
    // 1. Buscar el empleado por identificación
    const empleado = await prisma.empleado.findUnique({
      where: { identificacion: identification },
      include: {
        // 2. Incluir el UsuarioPlataforma asociado
        usuarioPlataforma: true,
      },
    });

    if (!empleado) {
      return { success: false, message: 'Número de identificación o contraseña incorrectos.' };
    }

    if (!empleado.usuarioPlataforma) {
      return { success: false, message: 'Este empleado no tiene una cuenta de usuario de plataforma.' };
    }

    if (!empleado.usuarioPlataforma.isActive) {
      return { success: false, message: 'La cuenta de este usuario está inactiva. Contacte al administrador.' };
    }

    // 3. Verificar la contraseña
    // Asegurarse de que passwordHash no sea null (si lo hiciste opcional en el schema)
    if (!empleado.usuarioPlataforma.passwordHash) {
        console.error(`Usuario ${empleado.identificacion} no tiene passwordHash configurado.`);
        return { success: false, message: 'Error de configuración de cuenta. Contacte al administrador.' };
    }
    
    const isPasswordValid = await bcrypt.compare(password, empleado.usuarioPlataforma.passwordHash);

    if (!isPasswordValid) {
      return { success: false, message: 'Número de identificación o contraseña incorrectos.' };
    }

    // 4. Autenticación exitosa: Crear la sesión (cookie)
    // Podrías almacenar más información en la cookie si fuera un JWT, como el rol o ID del usuario.
    // Por ahora, seguimos con el mock, pero podrías usar el ID del usuario real.
    const userSessionData = {
      userId: empleado.usuarioPlataforma.id,
      empleadoId: empleado.id,
      rol: empleado.usuarioPlataforma.rol,
      nombre: empleado.nombreApellido,
    };

    // Aquí podrías usar una librería como 'jose' para crear un JWT si quieres
    // const token = await new SignJWT(userSessionData)
    //   .setProtectedHeader({ alg: 'HS256' })
    //   .setIssuedAt()
    //   .setExpirationTime('1w') // 1 week
    //   .sign(new TextEncoder().encode(process.env.JWT_SECRET_KEY)); // Necesitarías una JWT_SECRET_KEY en .env

    // Por ahora, para mantenerlo simple y compatible con tu middleware actual:
    cookies().set('mock_auth_token', JSON.stringify(userSessionData), { // Almacenamos un objeto JSON stringificado
      // httpOnly: true, // Recomendado en producción
      // secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: '/',
    });
    
    let redirectTo = '/'; // Default redirect
    switch (empleado.usuarioPlataforma.rol) {
        case 'AdminPrincipal':
        case 'Administrador':
            redirectTo = '/admin-dashboard';
            break;
        case 'Estandar':
            redirectTo = '/standard-dashboard'; // O la ruta que corresponda
            break;
        default:
            redirectTo = '/'; // Fallback
    }

    return {
      success: true,
      message: 'Inicio de sesión exitoso.',
      redirectTo: redirectTo, // El cliente usará esto para redirigir
      userRole: empleado.usuarioPlataforma.rol
    };

  } catch (error) {
    console.error('Error en loginAction:', error);
    return { success: false, message: 'Ocurrió un error en el servidor. Intente de nuevo.' };
  }
}