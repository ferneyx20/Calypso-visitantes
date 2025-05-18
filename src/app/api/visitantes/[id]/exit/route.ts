// src/app/api/visitantes/[id]/exit/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// PUT /api/visitantes/[id]/exit - Marcar salida de un visitante
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params; // El ID del visitante de la URL
  const horasalida = new Date();

  try {
    if (!id) {
      return NextResponse.json({ message: 'ID de visitante es requerido' }, { status: 400 });
    }

    // const client = await pool.connect();
    // const result = await client.query(
    //   'UPDATE visitantes SET horasalida = $1, estado = $2 WHERE id = $3 AND horasalida IS NULL RETURNING *',
    //   [horasalida, 'finalizada', id]
    // );
    // client.release();

    // if (result.rowCount === 0) {
    //   return NextResponse.json({ message: 'Visitante no encontrado o ya tiene hora de salida' }, { status: 404 });
    // }
    // return NextResponse.json(result.rows[0]);

    // Placeholder response
    console.log(`Marcando salida para visitante ${id} a las ${horasalida.toISOString()}`);
    return NextResponse.json({ 
        message: `Salida marcada para visitante ${id}`, 
        id, 
        horasalida: horasalida.toISOString(), 
        estado: 'finalizada' 
    });

  } catch (error) {
    console.error(`API Error PUT /api/visitantes/${id}/exit:`, error);
    return NextResponse.json({ message: 'Error al marcar la salida del visitante', error: (error as Error).message }, { status: 500 });
  }
}
