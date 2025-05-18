// src/app/api/sedes/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Importar Prisma Client
import { z } from 'zod';

const sedeSchema = z.object({
  name: z.string().min(3, { message: "El nombre de la sede debe tener al menos 3 caracteres." }),
  address: z.string().min(5, { message: "La dirección debe tener al menos 5 caracteres." }),
});

// GET /api/sedes - Obtener todas las sedes
export async function GET(request: NextRequest) {
  try {
    const sedes = await prisma.sede.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(sedes);
  } catch (error) {
    console.error('API Error GET /api/sedes:', error);
    return NextResponse.json({ message: 'Error al obtener las sedes', error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/sedes - Crear una nueva sede
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = sedeSchema.parse(body);

    const nuevaSede = await prisma.sede.create({
      data: {
        name: validatedData.name,
        address: validatedData.address,
      },
    });
    return NextResponse.json(nuevaSede, { status: 201 });

  } catch (error) {
    console.error('API Error POST /api/sedes:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Datos de entrada inválidos', errors: error.errors }, { status: 400 });
    }
    // Manejo de errores específicos de Prisma (ej. violación de unicidad)
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') { // Prisma unique constraint violation
        return NextResponse.json({ message: `La sede con nombre '${(error as any).meta?.target?.includes('name') ? body.name : 'desconocido'}' ya existe.` }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error al crear la sede', error: (error as Error).message }, { status: 500 });
  }
}
