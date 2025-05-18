
// src/app/api/empleados/[id]/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const empleadoUpdateSchema = z.object({
  identificacion: z.string().min(5).optional(),
  nombreApellido: z.string().min(3).optional(),
  cargo: z.string().min(3).optional(),
  sedeId: z.string().cuid().optional(),
});

// GET /api/empleados/[id] - Obtener un empleado específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const empleado = await prisma.empleado.findUnique({
      where: { id },
      include: { sede: { select: { name: true } } },
    });
    if (!empleado) {
      return NextResponse.json({ message: 'Empleado no encontrado' }, { status: 404 });
    }
    return NextResponse.json(empleado);
  } catch (error) {
    console.error(`API Error GET /api/empleados/${id}:`, error);
    return NextResponse.json({ message: 'Error al obtener el empleado', error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/empleados/[id] - Actualizar un empleado existente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  let body;
  try {
    body = await request.json();
    const validatedData = empleadoUpdateSchema.parse(body);

    if (Object.keys(validatedData).length === 0) {
        return NextResponse.json({ message: 'No se proporcionaron datos para actualizar.' }, { status: 400 });
    }

    // Si se actualiza sedeId, verificar que la nueva sede exista
    if (validatedData.sedeId) {
      const sedeExistente = await prisma.sede.findUnique({
        where: { id: validatedData.sedeId },
      });
      if (!sedeExistente) {
        return NextResponse.json({ message: `La sede con ID '${validatedData.sedeId}' no existe.` }, { status: 404 });
      }
    }

    const empleadoActualizado = await prisma.empleado.update({
      where: { id },
      data: validatedData,
      include: { sede: { select: { name: true } } }
    });
    return NextResponse.json(empleadoActualizado);
  } catch (error) {
    console.error(`API Error PUT /api/empleados/${id}:`, error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Datos de entrada inválidos', errors: error.errors }, { status: 400 });
    }
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
      const target = (error as any).meta?.target as string[];
      if (target && target.includes('identificacion')) {
          return NextResponse.json({ message: `El empleado con identificación '${body?.identificacion}' ya existe.` }, { status: 409 });
      }
      return NextResponse.json({ message: 'Error de unicidad al actualizar el empleado.' }, { status: 409 });
    }
     if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
        return NextResponse.json({ message: 'Empleado no encontrado para actualizar.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Error al actualizar el empleado', error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/empleados/[id] - Eliminar un empleado
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    // Verificar si el empleado es un usuario de plataforma
    const usuarioPlataforma = await prisma.usuarioPlataforma.findUnique({
      where: { empleadoId: id },
    });

    if (usuarioPlataforma) {
      return NextResponse.json({ message: 'No se puede eliminar el empleado porque es un usuario de la plataforma. Primero elimine o desasocie al usuario.' }, { status: 409 });
    }

    await prisma.empleado.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Empleado eliminado exitosamente' }, { status: 200});
  } catch (error) {
    console.error(`API Error DELETE /api/empleados/${id}:`, error);
     if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
        return NextResponse.json({ message: 'Empleado no encontrado para eliminar.' }, { status: 404 });
    }
    // P2003: Foreign key constraint failed on the field: `Visitante_personavisitadaId_fkey (index)`
    // Esto significa que el empleado es `personavisitada` en alguna visita
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2003') {
        return NextResponse.json({ message: 'No se puede eliminar el empleado porque está referenciado en registros de visitas.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error al eliminar el empleado', error: (error as Error).message }, { status: 500 });
  }
}
