
// src/app/api/visitantes/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { EstadoVisita } from '@prisma/client';

const visitanteCreateSchema = z.object({
  tipodocumento: z.string().min(1, "Tipo de documento es requerido."),
  numerodocumento: z.string().min(5, "Número de documento es requerido."),
  nombres: z.string().min(2, "Nombres son requeridos."),
  apellidos: z.string().min(2, "Apellidos son requeridos."),
  genero: z.string().min(1, "Género es requerido."),
  fechanacimiento: z.string().transform((val) => new Date(val)), // El frontend enviará string, convertir a Date
  rh: z.string().min(1, "RH es requerido."),
  telefono: z.string().regex(/^\+?[0-9\s-()]{7,20}$/, "Teléfono inválido."),
  
  personavisitadaId: z.string().cuid({ message: "ID de persona visitada inválido." }).optional().nullable(), // ID del empleado
  purpose: z.string().min(5, "Propósito de la visita es requerido."),
  category: z.string().optional(),
  tipovisita: z.string().min(1, "Tipo de visita es requerido."),
  
  empresaProviene: z.string().optional(),
  numerocarnet: z.string().optional(),
  vehiculoPlaca: z.string().optional(),
  photoDataUri: z.string().optional(), // @db.Text ya lo maneja Prisma
  
  arl: z.string().min(2, "ARL es requerida."),
  eps: z.string().min(2, "EPS es requerida."),
  
  contactoemergencianombre: z.string().min(2, "Nombre de contacto de emergencia requerido."),
  contactoemergenciaapellido: z.string().min(2, "Apellido de contacto de emergencia requerido."),
  contactoemergenciatelefono: z.string().regex(/^\+?[0-9\s-()]{7,20}$/, "Teléfono de emergencia inválido."),
  contactoemergenciaparentesco: z.string().min(2, "Parentesco de contacto de emergencia requerido."),
  // registradoPorId: z.string().cuid().optional(), // Se obtendría del usuario autenticado
});

// GET /api/visitantes - Obtener visitantes
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const estado = searchParams.get('estado') as EstadoVisita | null;
  const searchTerm = searchParams.get('search');
  // TODO: Añadir más filtros como rango de fechas, personaVisitadaId, etc.

  try {
    const whereClause: any = {};
    if (estado) {
      whereClause.estado = estado;
    }
    if (searchTerm) {
      whereClause.OR = [
        { nombres: { contains: searchTerm, mode: 'insensitive' } },
        { apellidos: { contains: searchTerm, mode: 'insensitive' } },
        { numerodocumento: { contains: searchTerm, mode: 'insensitive' } },
        { empresaProviene: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const visitantes = await prisma.visitante.findMany({
      where: whereClause,
      orderBy: {
        horaentrada: 'desc',
      },
      include: {
        personavisitada: { select: { nombreApellido: true } },
        // registradoPor: { select: { empleado: { select: { nombreApellido: true } } } }, // Si se implementa registradoPorId
      }
    });
    return NextResponse.json(visitantes);
  } catch (error) {
    console.error('API Error GET /api/visitantes:', error);
    return NextResponse.json({ message: 'Error al obtener los visitantes', error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/visitantes - Registrar una nueva visita
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = visitanteCreateSchema.parse(body);

    // Validar que personavisitadaId (si se provee) exista
    if (validatedData.personavisitadaId) {
      const empleadoAnfitrion = await prisma.empleado.findUnique({
        where: { id: validatedData.personavisitadaId }
      });
      if (!empleadoAnfitrion) {
        return NextResponse.json({ message: `El empleado a visitar con ID '${validatedData.personavisitadaId}' no existe.` }, { status: 404 });
      }
    }
    
    // TODO: Obtener `registradoPorId` del usuario autenticado en la sesión/token
    // const registradoPorId = ...; 

    const nuevaVisita = await prisma.visitante.create({
      data: {
        ...validatedData,
        // photoDataUri es opcional y se maneja por el spread
        estado: EstadoVisita.activa, // Estado inicial al registrar
        // horaentrada se establece por defecto en el schema.prisma con @default(now())
        // registradoPorId: registradoPorId, 
      },
      include: { // Para devolver datos útiles en la respuesta
        personavisitada: { select: { nombreApellido: true } }
      }
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
  