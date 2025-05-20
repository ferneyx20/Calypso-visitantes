// src/app/api/usuarios/[id]/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { RolUsuarioPlataforma } from '@prisma/client';

interface PlatformUserResponse {
  id: string;
  empleadoId: string;
  rol: RolUsuarioPlataforma;
  canManageAutoregister: boolean;
  isActive: boolean;
  empleado: {
    id: string;
    identificacion: string;
    nombreApellido: string;
    cargo: string;
    sede?: { name: string };
  };
  createdAt: Date;
  updatedAt: Date;
}

const usuarioUpdateSchema = z.object({
  rol: z.nativeEnum(RolUsuarioPlataforma).optional(),
  canManageAutoregister: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ message: 'ID de usuario inválido' }, { status: 400 });
  }
  try {
    const usuario = await prisma.usuarioPlataforma.findUnique({
      where: { id },
      include: {
        empleado: {
          select: {
            id: true,
            identificacion: true,
            nombreApellido: true,
            cargo: true,
            sede: { select: { name: true } }
          }
        }
      }
    });
    if (!usuario) {
      return NextResponse.json({ message: 'Usuario de plataforma no encontrado' }, { status: 404 });
    }
    const { passwordHash, ...usuarioSinPassword } = usuario;
    return NextResponse.json(usuarioSinPassword);
  } catch (error) {
    console.error(`API Error GET /api/usuarios/${id}:`, error);
    return NextResponse.json({ message: 'Error al obtener el usuario de plataforma', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ message: 'ID de usuario inválido' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validatedData = usuarioUpdateSchema.parse(body);

    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json({ message: 'No se proporcionaron datos para actualizar.' }, { status: 400 });
    }

    const usuarioActual = await prisma.usuarioPlataforma.findUnique({
      where: { id },
    });

    if (!usuarioActual) {
      return NextResponse.json({ message: 'Usuario de plataforma no encontrado para actualizar.' }, { status: 404 });
    }

    let dataToUpdate: Partial<typeof usuarioActual> = {};

    if (typeof validatedData.isActive === 'boolean') {
      dataToUpdate.isActive = validatedData.isActive;
    }

    // Si se está actualizando el rol
    if (validatedData.rol) {
      dataToUpdate.rol = validatedData.rol;
      // Si el nuevo rol es Estándar y canManageAutoregister no se está especificando,
      // se establece a false por defecto al cambiar a Estándar.
      // Si se está especificando canManageAutoregister, se respetará ese valor más abajo.
      if (validatedData.rol === RolUsuarioPlataforma.Estandar && typeof validatedData.canManageAutoregister === 'undefined') {
        dataToUpdate.canManageAutoregister = false;
      }
      // Si el nuevo rol es Admin o AdminPrincipal y canManageAutoregister no se está especificando,
      // se establece a true por defecto.
      else if (
        (validatedData.rol === RolUsuarioPlataforma.Administrador || validatedData.rol === RolUsuarioPlataforma.AdminPrincipal) &&
        typeof validatedData.canManageAutoregister === 'undefined'
      ) {
        dataToUpdate.canManageAutoregister = true;
      }
    }

    // Si se está actualizando canManageAutoregister explícitamente
    if (typeof validatedData.canManageAutoregister === 'boolean') {
      // Ya no hay restricción para el rol Estándar aquí, se permite establecerlo.
      dataToUpdate.canManageAutoregister = validatedData.canManageAutoregister;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ message: 'No hay cambios válidos para aplicar.' }, { status: 400 });
    }

    const usuarioActualizado = await prisma.usuarioPlataforma.update({
      where: { id },
      data: dataToUpdate,
      include: {
        empleado: {
          select: {
            id: true,
            identificacion: true,
            nombreApellido: true,
            cargo: true,
            sede: { select: { name: true } }
          }
        }
      }
    });
    const { passwordHash, ...usuarioSinPassword } = usuarioActualizado;
    return NextResponse.json(usuarioSinPassword);

  } catch (error) {
    console.error(`API Error PUT /api/usuarios/${id}:`, error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Datos de entrada inválidos', errors: error.errors }, { status: 400 });
    }
    if (error instanceof Error && typeof (error as any).code === 'string' && (error as any).code === 'P2025') {
      return NextResponse.json({ message: 'Usuario de plataforma no encontrado para actualizar.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Error al actualizar el usuario de plataforma', error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ message: 'ID de usuario inválido' }, { status: 400 });
  }
  try {
    await prisma.usuarioPlataforma.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Usuario de plataforma eliminado exitosamente' });
  } catch (error) {
    console.error(`API Error DELETE /api/usuarios/${id}:`, error);
    if (error instanceof Error && typeof (error as any).code === 'string' && (error as any).code === 'P2025') {
      return NextResponse.json({ message: 'Usuario de plataforma no encontrado para eliminar.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Error al eliminar el usuario de plataforma', error: (error as Error).message }, { status: 500 });
  }
}