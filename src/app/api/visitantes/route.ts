// src/app/api/visitantes/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Importar Prisma Client
import { z } from 'zod';

const visitantePostSchema = z.object({
  tipodocumento: z.string().min(1),
  numerodocumento: z.string().min(5),
  nombres: z.string().min(2),
  apellidos: z.string().min(2),
  genero: z.string().min(1),
  fechanacimiento: z.string().transform((val) => new Date(val)), // Se recibe como string, se transforma a Date
  rh: z.string().min(1),
  telefono: z.string().regex(/^\+?[0-9\s-()]{7,20}$/),
  personavisitada: z.string().min(3),
  purpose: z.string().min(5),
  category: z.string().optional(),
  tipovisita: z.string().min(1),
  empresaProviene: z.string().optional(),
  numerocarnet: z.string().optional(),
  vehiculoPlaca: z.string().optional(),
  arl: z.string().min(2),
  eps: z.string().min(2),
  contactoemergencianombre: z.string().min(2),
  contactoemergenciaapellido: z.string().min(2),
  contactoemergenciatelefono: z.string().regex(/^\+?[0-9\s-()]{7,20}$/),
  contactoemergenciaparentesco: z.string().min(2),
  photoDataUri: z.string().optional(),
});

// GET /api/visitantes - Obtener visitantes (ej. activos)
export async function GET(request: NextRequest) {
  try {
    const visitantesActivos = await prisma.visitante.findMany({
      where: {
        estado: 'activa', // Filtrar por visitantes activos
      },
      orderBy: {
        horaentrada: 'desc',
      },
    });
    return NextResponse.json(visitantesActivos);
  } catch (error) {
    console.error('API Error GET /api/visitantes:', error);
    return NextResponse.json({ message: 'Error al obtener los visitantes', error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/visitantes - Registrar una nueva visita
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = visitantePostSchema.parse(body);

    const nuevaVisita = await prisma.visitante.create({
      data: {
        ...validatedData,
        // photoDataUri se maneja por el spread si existe
        estado: 'activa', // Estado inicial al registrar
        // horaentrada se establece por defecto en el schema.prisma con @default(now())
      },
    });
    return NextResponse.json(nuevaVisita, { status: 201 });

  } catch (error) {
    console.error('API Error POST /api/visitantes:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Datos de entrada inválidos', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error al registrar la visita', error: (error as Error).message }, { status: 500 });
  }
}
