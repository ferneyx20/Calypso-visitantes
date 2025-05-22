// src/app/api/visitantes/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { EstadoVisita, Prisma } from '@prisma/client'; // Importar Prisma para tipos
import fs from 'fs/promises'; 
import path from 'path';     

// ... (parseDataUri, VISITOR_PHOTOS_DIR, visitanteCreateSchema sin cambios aquí) ...
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
  category: z.string().optional().nullable(), 
  tipovisita: z.string().min(1, "Tipo de visita es requerido."),
  empresaProviene: z.string().optional().nullable(),
  numerocarnet: z.string().optional().nullable(), 
  vehiculoPlaca: z.string().optional().nullable(),
  // photoDataUri: z.string().optional().nullable(), // Se maneja fuera del schema de Zod para este endpoint POST
  arl: z.string().min(2, "ARL es requerida."),
  eps: z.string().min(2, "EPS es requerida."),
  contactoemergencianombre: z.string().min(2, "Nombre de contacto de emergencia requerido."),
  contactoemergenciaapellido: z.string().min(2, "Apellido de contacto de emergencia requerido."),
  contactoemergenciatelefono: z.string().regex(/^\+?[0-9\s-()]{7,20}$/, "Teléfono de emergencia inválido."),
  contactoemergenciaparentesco: z.string().min(2, "Parentesco de contacto de emergencia requerido."),
});


// GET /api/visitantes - Obtener visitantes
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const estado = searchParams.get('estado') as EstadoVisita | null;
  const searchTerm = searchParams.get('search');
  const dateFromParam = searchParams.get('from'); // Obtener 'from'
  const dateToParam = searchParams.get('to');     // Obtener 'to'

  try {
    const whereClause: Prisma.VisitanteWhereInput = {}; // Usar tipo de Prisma

    if (estado) {
      whereClause.estado = estado;
    }

    if (searchTerm) {
      whereClause.OR = [
        { nombres: { contains: searchTerm, mode: 'insensitive' } },
        { apellidos: { contains: searchTerm, mode: 'insensitive' } },
        { numerodocumento: { contains: searchTerm, mode: 'insensitive' } },
        { empresaProviene: { contains: searchTerm, mode: 'insensitive' } },
        // Podrías añadir búsqueda por persona visitada si tienes el ID o haces un join más complejo
        // { personavisitada: { nombreApellido: { contains: searchTerm, mode: 'insensitive' } } } // Requeriría ajustes
      ];
    }

    // --- AÑADIR FILTRO DE FECHAS ---
    if (dateFromParam || dateToParam) {
      whereClause.horaentrada = {};
      if (dateFromParam) {
        try {
          // @ts-ignore
          whereClause.horaentrada.gte = new Date(dateFromParam); // gte: Greater than or equal to
        } catch (e) { console.error("Invalid 'from' date format:", dateFromParam); /* Ignorar o devolver error */ }
      }
      if (dateToParam) {
        try {
          const toDate = new Date(dateToParam);
          // El frontend ya ajusta 'to' al final del día, pero podemos reasegurar o ajustar si es necesario.
          // Si el frontend envía el final del día (23:59:59), está bien.
          // Si envía el inicio del día (00:00:00), necesitarías ajustar 'lt' al día siguiente.
          // Aquí asumimos que `dateToParam` ya representa el *final* del día deseado.
          // @ts-ignore
          whereClause.horaentrada.lte = toDate; // lte: Less than or equal to
        } catch (e) { console.error("Invalid 'to' date format:", dateToParam); /* Ignorar o devolver error */ }
      }
      // Si solo se provee una fecha, el filtro igual funcionará como "desde X" o "hasta Y"
    }
    // --- FIN DE FILTRO DE FECHAS ---

    console.log("Constructed whereClause:", JSON.stringify(whereClause, null, 2)); // Para depuración

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

// POST (tu función POST sin cambios aquí, ya que estaba bien para guardar la foto)
// ... (tu código POST para /api/visitantes) ...
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { photoDataUri, ...visitanteData } = body; 
    const validatedData = visitanteCreateSchema.parse(visitanteData);

    let photoFilename: string | null = null;

    if (photoDataUri && typeof photoDataUri === 'string') {
      const imageInfo = parseDataUri(photoDataUri);
      if (imageInfo) {
        await fs.mkdir(VISITOR_PHOTOS_DIR, { recursive: true });
        const timestamp = Date.now();
        const safeIdentificacion = validatedData.numerodocumento.replace(/[^a-zA-Z0-9]/g, '_');
        photoFilename = `${timestamp}_${safeIdentificacion}.${imageInfo.extension}`;
        const filePath = path.join(VISITOR_PHOTOS_DIR, photoFilename);
        await fs.writeFile(filePath, imageInfo.buffer);
        console.log(`Foto guardada en: ${filePath}`);
      } else {
        console.warn("Data URI de foto proporcionado pero inválido.");
      }
    }

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
        photoFilename: photoFilename,
        empresaProviene: validatedData.empresaProviene || null,
        numerocarnet: validatedData.numerocarnet || null,
        vehiculoPlaca: validatedData.vehiculoPlaca || null,
        category: validatedData.category || null,
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
      return NextResponse.json({ message: 'Datos de entrada inválidos.', errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error al registrar la visita', error: (error as Error).message }, { status: 500 });
  }
}

// (parseDataUri y VISITOR_PHOTOS_DIR deben estar definidos en este archivo como los tenías)
function parseDataUri(dataUri: string): { buffer: Buffer; extension: string; mimeType: string } | null {
  const match = dataUri.match(/^data:(image\/(.+));base64,(.*)$/);
  if (!match) return null;
  const mimeType = match[1];
  let extension = match[2];
  const base64Data = match[3];
  const buffer = Buffer.from(base64Data, 'base64');
  if (extension === 'jpeg') extension = 'jpg';
  return { buffer, extension, mimeType };
}
const VISITOR_PHOTOS_DIR = path.join(process.cwd(), 'visitor_photos');