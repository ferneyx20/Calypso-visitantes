// src/app/api/usuarios/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { RolUsuarioPlataforma } from '@prisma/client'; // Import enum from Prisma
import bcrypt from 'bcryptjs'; // Importar bcrypt

// MODIFICADO: Añadir password al schema de creación
const usuarioCreateSchema = z.object({
  empleadoId: z.string().cuid({ message: "ID de empleado inválido." }),
  rol: z.nativeEnum(RolUsuarioPlataforma, { errorMap: () => ({ message: "Rol inválido." }) }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  // canManageAutoregister se determinará por el rol
  // isActive será true por defecto
});

// GET /api/usuarios - Obtener todos los usuarios de plataforma
export async function GET(request: NextRequest) {
  try {
    const usuarios = await prisma.usuarioPlataforma.findMany({
      orderBy: {
        // MODIFICADO: Ordenar por fecha de creación para ver los más recientes primero
        createdAt: 'desc'
      },
      include: {
        empleado: {
          select: {
            id: true, // Incluir ID del empleado para referencia si es necesario
            identificacion: true,
            nombreApellido: true,
            cargo: true,
            sede: {
              select: { name: true }
            }
          }
        }
      }
    });
    return NextResponse.json(usuarios);
  } catch (error) {
    console.error('API Error GET /api/usuarios:', error);
    return NextResponse.json({ message: 'Error al obtener los usuarios de plataforma', error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/usuarios - Crear un nuevo usuario de plataforma
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Validar que el body contenga la contraseña
    if (!body.password) {
        return NextResponse.json({ message: 'La contraseña es requerida.' }, { status: 400 });
    }
    const validatedData = usuarioCreateSchema.parse(body);

    // Verificar que el empleado exista y no sea ya un usuario
    const empleadoExistente = await prisma.empleado.findUnique({
      where: { id: validatedData.empleadoId },
      include: { usuarioPlataforma: true }
    });

    if (!empleadoExistente) {
      return NextResponse.json({ message: `El empleado con ID '${validatedData.empleadoId}' no existe.` }, { status: 404 });
    }
    if (empleadoExistente.usuarioPlataforma) {
      return NextResponse.json({ message: `El empleado '${empleadoExistente.nombreApellido}' ya es un usuario de la plataforma.` }, { status: 409 });
    }

    // Hashear la contraseña
    const saltRounds = 10; // Número de rondas de salting. 10-12 es un buen balance.
    const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds);

    const canManageAutoregister = validatedData.rol === RolUsuarioPlataforma.AdminPrincipal || validatedData.rol === RolUsuarioPlataforma.Administrador;

    const nuevoUsuario = await prisma.usuarioPlataforma.create({
      data: {
        empleadoId: validatedData.empleadoId,
        rol: validatedData.rol,
        passwordHash: hashedPassword, // Guardar el hash
        canManageAutoregister: canManageAutoregister,
        isActive: true,
      },
      include: { // Devolver el usuario creado con la info del empleado para actualizar el frontend
        empleado: {
          select: {
            id: true,
            identificacion: true,
            nombreApellido: true,
            cargo: true,
            sede: {
              select: { name: true }
            }
          }
        }
      }
    });
    // No devolver el passwordHash al cliente
    const { passwordHash, ...usuarioParaCliente } = nuevoUsuario;
    return NextResponse.json(usuarioParaCliente, { status: 201 });

  } catch (error) {
    console.error('API Error POST /api/usuarios:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Datos de entrada inválidos', errors: error.errors }, { status: 400 });
    }
    // Prisma ClientKnownRequestError para P2002 (unique constraint)
    if (error instanceof Error && typeof (error as any).code === 'string' && (error as any).code === 'P2002') {
      // Podrías intentar ser más específico si sabes qué campo causó el P2002,
      // pero empleadoId es el más probable aquí para UsuarioPlataforma.
      return NextResponse.json({ message: 'Este empleado ya está asignado como usuario de plataforma o hay un conflicto de datos único.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error al crear el usuario de plataforma', error: (error as Error).message }, { status: 500 });
  }
}