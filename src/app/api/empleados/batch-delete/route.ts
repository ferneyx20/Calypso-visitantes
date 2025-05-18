
// src/app/api/empleados/batch-delete/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const batchDeleteSchema = z.object({
  ids: z.array(z.string().cuid({ message: "ID de empleado inválido en la lista." })).min(1, { message: "Se requiere al menos un ID de empleado." }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = batchDeleteSchema.parse(body);

    // Verificar cuáles de los empleados a eliminar son usuarios de plataforma
    const usuariosPlataforma = await prisma.usuarioPlataforma.findMany({
      where: {
        empleadoId: { in: validatedData.ids },
      },
      select: { empleadoId: true },
    });
    const empleadoIdsSiendoUsuarios = usuariosPlataforma.map(u => u.empleadoId);

    // Verificar cuáles de los empleados a eliminar están referenciados en visitas
    const empleadosEnVisitas = await prisma.visitante.findMany({
        where: {
            personavisitadaId: { in: validatedData.ids }
        },
        select: { personavisitadaId: true },
        distinct: ['personavisitadaId']
    });
    const empleadoIdsEnVisitas = empleadosEnVisitas.map(v => v.personavisitadaId).filter(id => id !== null) as string[];


    const empleadosAEliminarIds = validatedData.ids.filter(id => 
        !empleadoIdsSiendoUsuarios.includes(id) && !empleadoIdsEnVisitas.includes(id)
    );
    
    const empleadosNoEliminadosUsuarios = validatedData.ids.filter(id => empleadoIdsSiendoUsuarios.includes(id));
    const empleadosNoEliminadosVisitas = validatedData.ids.filter(id => empleadoIdsEnVisitas.includes(id) && !empleadoIdsSiendoUsuarios.includes(id));


    let count = 0;
    if (empleadosAEliminarIds.length > 0) {
        const result = await prisma.empleado.deleteMany({
          where: {
            id: { in: empleadosAEliminarIds },
          },
        });
        count = result.count;
    }
    
    let messages: string[] = [];
    if (count > 0) {
        messages.push(`${count} empleado(s) eliminado(s) exitosamente.`);
    }
    if (empleadosNoEliminadosUsuarios.length > 0) {
        messages.push(`${empleadosNoEliminadosUsuarios.length} empleado(s) no se pudieron eliminar porque son usuarios de la plataforma.`);
    }
    if (empleadosNoEliminadosVisitas.length > 0) {
        messages.push(`${empleadosNoEliminadosVisitas.length} empleado(s) no se pudieron eliminar porque están referenciados en visitas.`);
    }

    const finalMessage = messages.join(' ');
    const totalNotDeleted = empleadosNoEliminadosUsuarios.length + empleadosNoEliminadosVisitas.length;

    if (count > 0 && totalNotDeleted > 0) {
        return NextResponse.json({ message: finalMessage, deletedCount: count, notDeletedCount: totalNotDeleted }, { status: 207 }); // Multi-Status
    } else if (count > 0) {
        return NextResponse.json({ message: finalMessage, deletedCount: count }, { status: 200 });
    } else if (totalNotDeleted > 0) {
        return NextResponse.json({ message: finalMessage, deletedCount: 0, notDeletedCount: totalNotDeleted }, { status: 409 }); // Conflict
    } else {
        return NextResponse.json({ message: "No se encontraron empleados para eliminar con los IDs proporcionados o ya fueron eliminados.", deletedCount: 0 }, { status: 404 });
    }

  } catch (error) {
    console.error('API Error POST /api/empleados/batch-delete:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Datos de entrada inválidos', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error al eliminar los empleados', error: (error as Error).message }, { status: 500 });
  }
}
