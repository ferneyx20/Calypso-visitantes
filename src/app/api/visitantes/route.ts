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
  fechanacimiento: z.string().transform((val) => new Date(val)),
  rh: z.string().min(1, "RH es requerido."),
  telefono: z.string().regex(/^\+?[0-9\s-()]{7,20}$/, "Teléfono inválido."),
  
  personavisitadaId: z.string().cuid({ message: "ID de persona visitada inválido." }).optional().nullable(),
  purpose: z.string().min(5, "Propósito de la visita es requerido."),
  // MODIFICADO: Hacer 'category' opcional y nulable
  category: z.string().optional().nullable(), 
  tipovisita: z.string().min(1, "Tipo de visita es requerido."),
  
  empresaProviene: z.string().optional().nullable(), // MODIFICADO: .nullable()
  numerocarnet: z.string().optional().nullable(),   // MODIFICADO: .nullable()
  vehiculoPlaca: z.string().optional().nullable(),  // MODIFICADO: .nullable()
  photoDataUri: z.string().optional().nullable(),   // MODIFICADO: .nullable()
  
  arl: z.string().min(2, "ARL es requerida."),
  eps: z.string().min(2, "EPS es requerida."),
  
  contactoemergencianombre: z.string().min(2, "Nombre de contacto de emergencia requerido."),
  contactoemergenciaapellido: z.string().min(2, "Apellido de contacto de emergencia requerido."),
  contactoemergenciatelefono: z.string().regex(/^\+?[0-9\s-()]{7,20}$/, "Teléfono de emergencia inválido."),
  contactoemergenciaparentesco: z.string().min(2, "Parentesco de contacto de emergencia requerido."),
});

// GET /api/visitantes - Obtener visitantes
export async function GET(request: NextRequest) {
  // ... (sin cambios en GET por ahora)
  const { searchParams } = new URL(request.url);
  const estado = searchParams.get('estado') as EstadoVisita | null;
  const searchTerm = searchParams.get('search');

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

    if (validatedData.personavisitadaId) {
      const empleadoAnfitrion = await prisma.empleado.findUnique({
        where: { id: validatedData.personavisitadaId }
      });
      if (!empleadoAnfitrion) {
        return NextResponse.json({ message: `El empleado a visitar con ID '${validatedData.personavisitadaId}' no existe.` }, { status: 404 });
      }
    }
    
    const nuevaVisita = await prisma.visitante.create({
      data: {
        ...validatedData,
        // Asegurar que los campos opcionales que pueden ser null o string vacío se manejen bien
        // Si Prisma espera `null` para opcionales no provistos y Zod los pasa como `undefined` o `""`,
        // podrías necesitar una transformación aquí. Pero con `.optional().nullable()` en Zod,
        // y si el campo en Prisma es `String?`, `null` debería estar bien.
        // Si el campo en Prisma es `String` pero opcional en el create (no tiene default),
        // `undefined` es lo correcto para que Prisma no intente insertarlo.
        // Zod `.optional()` produce `undefined` si no está. `.nullable()` permite `null`.
        // Para que coincida con el schema de Prisma `String?` (que puede ser string o null),
        // el payload debería enviar `null` si no hay valor, o el string si lo hay.
        // El schema del frontend ya lo hace con `category: null`
        empresaProviene: validatedData.empresaProviene || null,
        numerocarnet: validatedData.numerocarnet || null,
        vehiculoPlaca: validatedData.vehiculoPlaca || null,
        photoDataUri: validatedData.photoDataUri || null,
        category: validatedData.category || null, // Asegurar que se envíe null si es undefined

        estado: EstadoVisita.activa,
      },
      include: { 
        personavisitada: { select: { nombreApellido: true } }
      }
    });
    return NextResponse.json(nuevaVisita, { status: 201 });

  } catch (error) {
    console.error('API Error POST /api/visitantes:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Datos de entrada inválidos.', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error al registrar la visita', error: (error as Error).message }, { status: 500 });
  }
}