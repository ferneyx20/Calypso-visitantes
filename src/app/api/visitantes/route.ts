// src/app/api/visitantes/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

// Usaremos un esquema similar al del frontend, pero podríamos adaptarlo
// para los datos que realmente se guardan en la BD.
// Nota: fechanacimiento se recibirá como string si viene de JSON, se necesita transformar a Date.
const visitantePostSchema = z.object({
  tipodocumento: z.string().min(1),
  numerodocumento: z.string().min(5),
  nombres: z.string().min(2),
  apellidos: z.string().min(2),
  genero: z.string().min(1),
  fechanacimiento: z.string().transform((val) => new Date(val)), // Transformar string a Date
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
  // horaentrada se generará en el servidor
});


// GET /api/visitantes - Obtener visitantes (ej. activos)
export async function GET(request: NextRequest) {
  try {
    // const client = await pool.connect();
    // // Ejemplo: obtener visitantes activos (sin hora de salida)
    // const result = await client.query('SELECT * FROM visitantes WHERE horasalida IS NULL ORDER BY horaentrada DESC');
    // client.release();
    // return NextResponse.json(result.rows);

    // Placeholder data
    const placeholderVisitantes = [
      { id: 'visit-1', nombres: 'Pedro API', apellidos: 'Picapiedra', numerodocumento: '111', horaentrada: new Date().toISOString(), estado: 'activa' },
      { id: 'visit-2', nombres: 'Pablo API', apellidos: 'Marmol', numerodocumento: '222', horaentrada: new Date().toISOString(), estado: 'activa' },
    ];
    return NextResponse.json(placeholderVisitantes);

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
    const horaentrada = new Date(); // Hora de entrada se establece en el servidor

    // const client = await pool.connect();
    // const queryText = \`
    //   INSERT INTO visitantes (
    //     tipodocumento, numerodocumento, nombres, apellidos, genero, fechanacimiento, rh, telefono,
    //     personavisitada, purpose, category, tipovisita, empresaProviene, numerocarnet, vehiculoPlaca,
    //     arl, eps, contactoemergencianombre, contactoemergenciaapellido, contactoemergenciatelefono,
    //     contactoemergenciaparentesco, photoDataUri, horaentrada, estado
    //   ) VALUES (
    //     $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, 'activa'
    //   ) RETURNING *;
    // \`;
    // const values = [
    //   validatedData.tipodocumento, validatedData.numerodocumento, validatedData.nombres, validatedData.apellidos,
    //   validatedData.genero, validatedData.fechanacimiento, validatedData.rh, validatedData.telefono,
    //   validatedData.personavisitada, validatedData.purpose, validatedData.category, validatedData.tipovisita,
    //   validatedData.empresaProviene, validatedData.numerocarnet, validatedData.vehiculoPlaca,
    //   validatedData.arl, validatedData.eps, validatedData.contactoemergencianombre, validatedData.contactoemergenciaapellido,
    //   validatedData.contactoemergenciatelefono, validatedData.contactoemergenciaparentesco, validatedData.photoDataUri,
    //   horaentrada
    // ];
    // const result = await client.query(queryText, values);
    // client.release();
    // return NextResponse.json(result.rows[0], { status: 201 });

    // Placeholder response
    const newVisitante = { 
      id: `visit-${Date.now()}`, 
      ...validatedData, 
      horaentrada: horaentrada.toISOString(), 
      estado: 'activa',
      horasalida: null
    };
    return NextResponse.json(newVisitante, { status: 201 });

  } catch (error) {
    console.error('API Error POST /api/visitantes:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Datos de entrada inválidos', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error al registrar la visita', error: (error as Error).message }, { status: 500 });
  }
}
