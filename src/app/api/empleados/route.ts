// src/app/api/empleados/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

// Esquema de validación para un nuevo empleado
const empleadoSchema = z.object({
  identificacion: z.string().min(5, { message: "La identificación debe tener al menos 5 caracteres." }),
  nombreApellido: z.string().min(3, { message: "El nombre y apellido debe tener al menos 3 caracteres." }),
  cargo: z.string().min(3, { message: "El cargo debe tener al menos 3 caracteres." }),
  sede: z.string().min(1, { message: "Debe seleccionar una sede." }), // En DB podría ser sede_id (FK)
});

// GET /api/empleados - Obtener todos los empleados
export async function GET(request: NextRequest) {
  try {
    // const client = await pool.connect();
    // const result = await client.query('SELECT * FROM empleados ORDER BY "nombreApellido" ASC');
    // client.release();
    // return NextResponse.json(result.rows);
    
    // Placeholder data
    const placeholderEmpleados = [
      { id: 'emp-1', identificacion: '123', nombreApellido: 'Juan Pérez (API)', cargo: 'Desarrollador', sede: 'Sede Principal' },
      { id: 'emp-2', identificacion: '456', nombreApellido: 'Ana Gómez (API)', cargo: 'Diseñadora', sede: 'Sede Norte' },
    ];
    return NextResponse.json(placeholderEmpleados);

  } catch (error) {
    console.error('API Error GET /api/empleados:', error);
    return NextResponse.json({ message: 'Error al obtener los empleados', error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/empleados - Crear un nuevo empleado
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = empleadoSchema.parse(body);

    // const client = await pool.connect();
    // // Asumiendo que 'sede' es el nombre de la sede, y en tu DB tienes un 'sede_id'.
    // // Necesitarías una forma de obtener el sede_id a partir del nombre de la sede.
    // // O modificar el frontend para enviar sede_id.
    // // Por simplicidad, aquí asumimos que guardas el nombre de la sede directamente o que sede_id se maneja de otra forma.
    // const result = await client.query(
    //   'INSERT INTO empleados (identificacion, "nombreApellido", cargo, sede_nombre) VALUES ($1, $2, $3, $4) RETURNING *',
    //   [validatedData.identificacion, validatedData.nombreApellido, validatedData.cargo, validatedData.sede]
    // );
    // client.release();
    // return NextResponse.json(result.rows[0], { status: 201 });

    // Placeholder response
    const newEmpleado = { id: `emp-${Date.now()}`, ...validatedData };
    return NextResponse.json(newEmpleado, { status: 201 });

  } catch (error) {
    console.error('API Error POST /api/empleados:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Datos de entrada inválidos', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error al crear el empleado', error: (error as Error).message }, { status: 500 });
  }
}
