// src/app/api/visitantes/[id]/exit/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Importar Prisma Client

// PUT /api/visitantes/[id]/exit - Marcar salida de un visitante
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const horasalida = new Date();

  try {
    if (!id) {
      return NextResponse.json({ message: 'ID de visitante es requerido' }, { status: 400 });
    }

    const visitanteActualizado = await prisma.visitante.updateMany({
      where: {
        id: id,
        horasalida: null, // Solo actualizar si no tiene ya hora de salida
      },
      data: {
        horasalida: horasalida,
        estado: 'finalizada',
      },
    });

    if (visitanteActualizado.count === 0) {
      // Intentar encontrar el visitante para ver por qué no se actualizó
      const visitante = await prisma.visitante.findUnique({ where: { id } });
      if (!visitante) {
        return NextResponse.json({ message: 'Visitante no encontrado' }, { status: 404 });
      }
      if (visitante.horasalida) {
        return NextResponse.json({ message: 'El visitante ya tiene registrada una hora de salida' }, { status: 409 });
      }
      // Otro caso
      return NextResponse.json({ message: 'No se pudo marcar la salida del visitante' }, { status: 400 });
    }
    
    // Obtener el visitante actualizado para devolverlo (opcional, pero útil)
    const visitanteConSalida = await prisma.visitante.findUnique({ where: { id } });
    return NextResponse.json(visitanteConSalida);

  } catch (error) {
    console.error(`API Error PUT /api/visitantes/${id}/exit:`, error);
    return NextResponse.json({ message: 'Error al marcar la salida del visitante', error: (error as Error).message }, { status: 500 });
  }
}
