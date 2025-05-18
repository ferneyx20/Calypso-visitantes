
// src/app/api/sedes/[id]/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const sedeUpdateSchema = z.object({
  name: z.string().min(3, { message: "El nombre de la sede debe tener al menos 3 caracteres." }).optional(),
  address: z.string().min(5, { message: "La dirección debe tener al menos 5 caracteres." }).optional(),
});

// GET /api/sedes/[id] - Obtener una sede específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const sede = await prisma.sede.findUnique({
      where: { id },
    });
    if (!sede) {
      return NextResponse.json({ message: 'Sede no encontrada' }, { status: 404 });
    }
    return NextResponse.json(sede);
  } catch (error) {
    console.error(`API Error GET /api/sedes/${id}:`, error);
    return NextResponse.json({ message: 'Error al obtener la sede', error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/sedes/[id] - Actualizar una sede existente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  let body;
  try {
    body = await request.json();
    const validatedData = sedeUpdateSchema.parse(body);

    if (Object.keys(validatedData).length === 0) {
        return NextResponse.json({ message: 'No se proporcionaron datos para actualizar.' }, { status: 400 });
    }

    const sedeActualizada = await prisma.sede.update({
      where: { id },
      data: validatedData,
    });
    return NextResponse.json(sedeActualizada);
  } catch (error) {
    console.error(`API Error PUT /api/sedes/${id}:`, error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Datos de entrada inválidos', errors: error.errors }, { status: 400 });
    }
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
      const target = (error as any).meta?.target as string[];
      if (target && target.includes('name')) {
          return NextResponse.json({ message: `La sede con nombre '${body?.name}' ya existe.` }, { status: 409 });
      }
      return NextResponse.json({ message: 'Error de unicidad al actualizar la sede.' }, { status: 409 });
    }
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
        return NextResponse.json({ message: 'Sede no encontrada para actualizar.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Error al actualizar la sede', error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/sedes/[id] - Eliminar una sede
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    await prisma.sede.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Sede eliminada exitosamente' }, { status: 200 });
  } catch (error) {
    console.error(`API Error DELETE /api/sedes/${id}:`, error);
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
        return NextResponse.json({ message: 'Sede no encontrada para eliminar.' }, { status: 404 });
    }
    // Consider P2003 for foreign key constraint violations if sedes have employees
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2003') {
        return NextResponse.json({ message: 'No se puede eliminar la sede porque tiene empleados asociados.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error al eliminar la sede', error: (error as Error).message }, { status: 500 });
  }
}
