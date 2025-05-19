
// src/app/api/usuarios/[id]/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { RolUsuarioPlataforma } from '@prisma/client';

const usuarioUpdateSchema = z.object({
  rol: z.nativeEnum(RolUsuarioPlataforma).optional(),
  canManageAutoregister: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/usuarios/[id] - Obtener un usuario de plataforma específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const usuario = await prisma.usuarioPlataforma.findUnique({
      where: { id },
      include: {
        empleado: {
          select: {
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
    return NextResponse.json(usuario);
  } catch (error) {
    console.error(`API Error GET /api/usuarios/${id}:`, error);
    return NextResponse.json({ message: 'Error al obtener el usuario de plataforma', error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/usuarios/[id] - Actualizar un usuario de plataforma
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const body = await request.json();
    const validatedData = usuarioUpdateSchema.parse(body);

    if (Object.keys(validatedData).length === 0) {
        return NextResponse.json({ message: 'No se proporcionaron datos para actualizar.' }, { status: 400 });
    }
    
    let dataToUpdate: Partial<PlatformUserFromAPI> & { canManageAutoregister?: boolean } = { ...validatedData };

    // Si se está actualizando el rol, ajustar canManageAutoregister en consecuencia
    if (validatedData.rol) {
        dataToUpdate.canManageAutoregister = validatedData.rol === RolUsuarioPlataforma.AdminPrincipal || validatedData.rol === RolUsuarioPlataforma.Administrador;
    }


    const usuarioActualizado = await prisma.usuarioPlataforma.update({
      where: { id },
      data: dataToUpdate,
      include: {
        empleado: {
          select: {
            identificacion: true,
            nombreApellido: true,
            cargo: true,
            sede: { select: { name: true } }
          }
        }
      }
    });
    return NextResponse.json(usuarioActualizado);
  } catch (error) {
    console.error(`API Error PUT /api/usuarios/${id}:`, error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Datos de entrada inválidos', errors: error.errors }, { status: 400 });
    }
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
        return NextResponse.json({ message: 'Usuario de plataforma no encontrado para actualizar.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Error al actualizar el usuario de plataforma', error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/usuarios/[id] - Eliminar un usuario de plataforma
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    // Eliminar el usuario de plataforma no elimina el registro del empleado
    await prisma.usuarioPlataforma.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Usuario de plataforma eliminado exitosamente' });
  } catch (error) {
    console.error(`API Error DELETE /api/usuarios/${id}:`, error);
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
        return NextResponse.json({ message: 'Usuario de plataforma no encontrado para eliminar.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Error al eliminar el usuario de plataforma', error: (error as Error).message }, { status: 500 });
  }
}

// Definición del tipo PlatformUserFromAPI para la respuesta del PUT
interface PlatformUserFromAPI {
  id: string; 
  empleadoId: string;
  rol: RolUsuarioPlataforma;
  canManageAutoregister: boolean;
  isActive: boolean;
  empleado: { 
    identificacion: string;
    nombreApellido: string;
    cargo: string;
    sede?: { name: string };
  };
  createdAt?: Date;
  updatedAt?: Date;
}
