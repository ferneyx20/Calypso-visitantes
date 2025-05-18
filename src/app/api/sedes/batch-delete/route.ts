
// src/app/api/sedes/batch-delete/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const batchDeleteSchema = z.object({
  ids: z.array(z.string().cuid({ message: "ID de sede inválido en la lista." })).min(1, { message: "Se requiere al menos un ID de sede." }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = batchDeleteSchema.parse(body);

    // Check for associated employees before deleting
    const sedesWithEmployees = await prisma.empleado.findMany({
      where: {
        sedeId: { in: validatedData.ids },
      },
      select: { sedeId: true },
      distinct: ['sedeId'],
    });

    const sedeIdsWithEmployees = sedesWithEmployees.map(e => e.sedeId);
    const sedesToDelete = validatedData.ids.filter(id => !sedeIdsWithEmployees.includes(id));
    
    let count = 0;
    if (sedesToDelete.length > 0) {
        const result = await prisma.sede.deleteMany({
          where: {
            id: { in: sedesToDelete },
          },
        });
        count = result.count;
    }
    
    let message = `${count} sede(s) eliminada(s) exitosamente.`;
    if (sedeIdsWithEmployees.length > 0) {
      message += ` ${sedeIdsWithEmployees.length} sede(s) no se pudieron eliminar porque tienen empleados asociados.`;
      const sedesNoEliminadasNombres = await prisma.sede.findMany({
        where: { id: { in: sedeIdsWithEmployees } },
        select: { name: true }
      });
      message += ` Sedes no eliminadas: ${sedesNoEliminadasNombres.map(s => s.name).join(', ')}.`;
    }


    if (count > 0 && sedeIdsWithEmployees.length > 0) {
        return NextResponse.json({ message, deletedCount: count, notDeletedCount: sedeIdsWithEmployees.length }, { status: 207 }); // Multi-Status
    } else if (count > 0) {
        return NextResponse.json({ message, deletedCount: count }, { status: 200 });
    } else if (sedeIdsWithEmployees.length > 0) {
        return NextResponse.json({ message, deletedCount: 0, notDeletedCount: sedeIdsWithEmployees.length }, { status: 409 }); // Conflict
    } else {
        return NextResponse.json({ message: "No se encontraron sedes para eliminar con los IDs proporcionados o ya fueron eliminadas." , deletedCount: 0 }, { status: 404 });
    }

  } catch (error) {
    console.error('API Error POST /api/sedes/batch-delete:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Datos de entrada inválidos', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error al eliminar las sedes', error: (error as Error).message }, { status: 500 });
  }
}
