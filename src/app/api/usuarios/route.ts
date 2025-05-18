
// src/app/api/usuarios/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { RolUsuarioPlataforma } from '@prisma/client'; // Import enum from Prisma

const usuarioCreateSchema = z.object({
  empleadoId: z.string().cuid({ message: "ID de empleado inválido." }),
  rol: z.nativeEnum(RolUsuarioPlataforma, { errorMap: () => ({ message: "Rol inválido." }) }),
  // canManageAutoregister se determinará por el rol
  // isActive será true por defecto
  // password se manejaría aquí, incluyendo hashing
});

// GET /api/usuarios - Obtener todos los usuarios de plataforma
export async function GET(request: NextRequest) {
  try {
    const usuarios = await prisma.usuarioPlataforma.findMany({
      orderBy: {
        empleado: {
            nombreApellido: 'asc'
        }
      },
      include: {
        empleado: {
          select: {
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

    // IMPORTANTE: Aquí iría la lógica para hashear la contraseña antes de guardarla
    // const hashedPassword = await hashPassword(body.password);

    const canManageAutoregister = validatedData.rol === RolUsuarioPlataforma.AdminPrincipal || validatedData.rol === RolUsuarioPlataforma.Administrador;

    const nuevoUsuario = await prisma.usuarioPlataforma.create({
      data: {
        empleadoId: validatedData.empleadoId,
        rol: validatedData.rol,
        // passwordHash: hashedPassword, // Guardar el hash
        canManageAutoregister: canManageAutoregister,
        isActive: true,
      },
       include: {
        empleado: {
          select: {
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
    return NextResponse.json(nuevoUsuario, { status: 201 });

  } catch (error) {
    console.error('API Error POST /api/usuarios:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Datos de entrada inválidos', errors: error.errors }, { status: 400 });
    }
     if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') { // Unique constraint violation
        return NextResponse.json({ message: 'Este empleado ya es un usuario de plataforma o hay un conflicto de unicidad.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error al crear el usuario de plataforma', error: (error as Error).message }, { status: 500 });
  }
}
