
// src/app/api/visitantes/[id]/exit/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EstadoVisita } from '@prisma/client';

// PUT /api/visitantes/[id]/exit - Marcar salida de un visitante
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params; // ID del Visitante
  const horasalida = new Date();

  try {
    if (!id) {
      return NextResponse.json({ message: 'ID de visitante es requerido' }, { status: 400 });
    }

    // Asegurarse de que el visitante exista y esté activo
    const visitanteExistente = await prisma.visitante.findUnique({
      where: { id }
    });

    if (!visitanteExistente) {
      return NextResponse.json({ message: 'Visitante no encontrado' }, { status: 404 });
    }
    if (visitanteExistente.estado !== EstadoVisita.activa) {
      return NextResponse.json({ message: `El visitante no está activo (estado actual: ${visitanteExistente.estado}). No se puede marcar salida.` }, { status: 409 });
    }
    
    const visitanteActualizado = await prisma.visitante.update({
      where: {
        id: id,
        estado: EstadoVisita.activa, // Solo actualizar si está activo
      },
      data: {
        horasalida: horasalida,
        estado: EstadoVisita.finalizada,
      },
      include: { // Para devolver datos útiles en la respuesta
        personavisitada: { select: { nombreApellido: true } }
      }
    });
    
    return NextResponse.json(visitanteActualizado);

  } catch (error) {
    console.error(`API Error PUT /api/visitantes/${id}/exit:`, error);
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
        // P2025: An operation failed because it depends on one or more records that were required but not found. (e.g. Record to update not found)
        return NextResponse.json({ message: 'No se pudo marcar la salida. Visitante no encontrado o ya no está activo.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Error al marcar la salida del visitante', error: (error as Error).message }, { status: 500 });
  }
}
