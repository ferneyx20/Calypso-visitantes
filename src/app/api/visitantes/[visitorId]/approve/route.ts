import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Asegúrate que la ruta a tu cliente Prisma sea correcta

export async function PUT(
  request: Request,
  { params }: { params: { visitorId: string } } // El visitorId vendrá de la URL
) {
  try {
    const { visitorId } = params;
    const body = await request.json();
    const { personavisitadaId } = body; // El ID del empleado anfitrión

    if (!visitorId) {
      return NextResponse.json({ message: 'El ID del visitante es requerido en la URL' }, { status: 400 });
    }

    if (!personavisitadaId) {
      return NextResponse.json({ message: 'El ID de la persona visitada (anfitrión) es requerido' }, { status: 400 });
    }

    // Buscar la visita para asegurarse de que existe y está en estado pendiente (opcional pero recomendado)
    const visita = await prisma.visita.findUnique({
      where: { id: visitorId },
    });

    if (!visita) {
      return NextResponse.json({ message: 'Visita no encontrada' }, { status: 404 });
    }

    // Opcional: Verificar si la visita ya está aprobada o en un estado que no permite aprobación
    if (visita.estado !== 'PENDIENTE_APROBACION') { // Asegúrate que 'PENDIENTE_APROBACION' sea el estado correcto
      return NextResponse.json({ message: `La visita ya está en estado '${visita.estado}' y no puede ser aprobada nuevamente o no está pendiente.` }, { status: 409 }); // 409 Conflict
    }

    // Actualizar la visita
    const updatedVisita = await prisma.visita.update({
      where: { id: visitorId },
      data: {
        estado: 'activa', // Cambiar el estado a 'activa'
        personavisitadaId: personavisitadaId, // Asignar el anfitrión
        horaentrada: new Date(), // Establecer la hora de entrada al momento de la aprobación
        // Opcional: puedes querer registrar quién aprobó y cuándo
        // approvedById: userIdFromSession, // Necesitarías obtener el ID del usuario admin de la sesión
        // approvedAt: new Date(),
      },
      // Incluir datos relacionados si quieres devolverlos (ej. anfitrión, sede)
      include: {
        personavisitada: { // Asumiendo que tienes una relación 'personavisitada' con 'Empleado'
          select: {
            id: true,
            // Ajusta los campos que quieres devolver del empleado
            // Por ejemplo, si tienes 'nombres' y 'apellidos' separados:
            // nombres: true,
            // apellidos: true,
            // O si tienes un campo combinado como 'nombreApellido':
            nombreApellido: true, 
          }
        },
        sede: { // Asumiendo que tienes una relación 'sede' con 'Sede'
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // Aquí podrías añadir lógica para enviar notificaciones si es necesario

    return NextResponse.json(updatedVisita, { status: 200 });

  } catch (error) {
    console.error("Error al aprobar visita:", error);
    let errorMessage = 'Error desconocido al aprobar la visita';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Error interno del servidor al aprobar la visita', error: errorMessage }, { status: 500 });
  }
}