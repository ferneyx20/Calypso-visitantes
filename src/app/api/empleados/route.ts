
// src/app/api/empleados/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const empleadoCreateSchema = z.object({
  identificacion: z.string().min(5, { message: "La identificación debe tener al menos 5 caracteres." }),
  nombreApellido: z.string().min(3, { message: "El nombre y apellido debe tener al menos 3 caracteres." }),
  cargo: z.string().min(3, { message: "El cargo debe tener al menos 3 caracteres." }),
  sedeId: z.string().cuid({ message: "ID de sede inválido." }),
});

// GET /api/empleados - Obtener todos los empleados
export async function GET(request: NextRequest) {
  // TODO: Implementar filtros por query params si es necesario (ej. /api/empleados?sedeId=xxx&search=nombre)
  try {
    const empleados = await prisma.empleado.findMany({
      orderBy: {
        nombreApellido: 'asc',
      },
      include: {
        sede: {
          select: {
            name: true,
          },
        },
      },
    });
    return NextResponse.json(empleados);
  } catch (error) {
    console.error('API Error GET /api/empleados:', error);
    return NextResponse.json({ message: 'Error al obtener los empleados', error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/empleados - Crear un nuevo empleado
export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
    const validatedData = empleadoCreateSchema.parse(body);

    // Verificar que la sede exista
    const sedeExistente = await prisma.sede.findUnique({
      where: { id: validatedData.sedeId },
    });
    if (!sedeExistente) {
      return NextResponse.json({ message: `La sede con ID '${validatedData.sedeId}' no existe.` }, { status: 404 });
    }

    const nuevoEmpleado = await prisma.empleado.create({
      data: {
        identificacion: validatedData.identificacion,
        nombreApellido: validatedData.nombreApellido,
        cargo: validatedData.cargo,
        sedeId: validatedData.sedeId,
      },
      include: { // Incluir la sede en la respuesta
        sede: { select: { name: true } }
      }
    });
    return NextResponse.json(nuevoEmpleado, { status: 201 });

  } catch (error) {
    console.error('API Error POST /api/empleados:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Datos de entrada inválidos', errors: error.errors }, { status: 400 });
    }
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
        const target = (error as any).meta?.target as string[];
        if (target && target.includes('identificacion')) {
            return NextResponse.json({ message: `El empleado con identificación '${body?.identificacion}' ya existe.` }, { status: 409 });
        }
        return NextResponse.json({ message: 'Error de unicidad al crear el empleado.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error al crear el empleado', error: (error as Error).message }, { status: 500 });
  }
}
