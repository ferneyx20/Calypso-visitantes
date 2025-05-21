import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ManagedListType } from '@prisma/client'; // Importar el enum

// GET /api/listas-gestionables?listType=UN_TIPO_DE_LISTA
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const listTypeParam = searchParams.get('listType');

  // Validar que listTypeParam sea un valor válido del enum ManagedListType
  if (!listTypeParam || !Object.values(ManagedListType).includes(listTypeParam as ManagedListType)) {
    return NextResponse.json(
      { message: 'Parámetro "listType" inválido o faltante.' },
      { status: 400 }
    );
  }

  const listType = listTypeParam as ManagedListType;

  try {
    const items = await prisma.managedListItem.findMany({
      where: {
        listType: listType,
        isActive: true, // Opcional: Solo devolver ítems activos, ajusta si necesitas todos
      },
      orderBy: [
        { order: 'asc' },  // Ordenar por el campo 'order'
        { value: 'asc' }   // Luego por valor, si 'order' es el mismo o nulo
      ],
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error(`Error fetching list items for ${listType}:`, error);
    return NextResponse.json(
      { message: `Error al obtener los ítems de la lista "${listType}".`, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/listas-gestionables - Para crear un nuevo ítem en una lista
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar el cuerpo de la petición
    if (!body.listType || !Object.values(ManagedListType).includes(body.listType as ManagedListType)) {
      return NextResponse.json({ message: 'El campo "listType" es inválido o faltante.' }, { status: 400 });
    }
    if (!body.value || typeof body.value !== 'string' || body.value.trim() === '') {
      return NextResponse.json({ message: 'El campo "value" es inválido o faltante.' }, { status: 400 });
    }
    if (body.order !== undefined && typeof body.order !== 'number') {
        return NextResponse.json({ message: 'El campo "order" debe ser un número si se proporciona.' }, { status: 400 });
    }


    const listType = body.listType as ManagedListType;
    const value = body.value.trim();
    const order = body.order as number | undefined;

    // Verificar si el valor ya existe para este tipo de lista (debido al @@unique)
    // Prisma lo haría automáticamente, pero podemos dar un mensaje más amigable.
    const existingItem = await prisma.managedListItem.findUnique({
      where: {
        listType_value: { // Usando el índice unique
          listType: listType,
          value: value,
        },
      },
    });

    if (existingItem) {
      return NextResponse.json(
        { message: `El valor "${value}" ya existe en la lista "${listType}".` },
        { status: 409 } // Conflict
      );
    }
    
    // Si no se proporciona un orden, calcular el siguiente
    let finalOrder = order;
    if (finalOrder === undefined) {
        const maxOrderEntry = await prisma.managedListItem.findFirst({
            where: { listType },
            orderBy: { order: 'desc' },
            select: { order: true }
        });
        finalOrder = (maxOrderEntry?.order ?? 0) + 1;
    }


    const newItem = await prisma.managedListItem.create({
      data: {
        listType: listType,
        value: value,
        order: finalOrder, // Usar el orden calculado o proporcionado
        isActive: true, // Por defecto activo
      },
    });

    return NextResponse.json(newItem, { status: 201 }); // 201 Created
  } catch (error: any) {
    console.error('Error creating managed list item:', error);
    if (error.code === 'P2002') { // Error de restricción unique de Prisma
        return NextResponse.json(
            { message: `El valor "${error.meta?.target?.includes('value') ? body.value : 'desconocido'}" ya existe en esta lista.` },
            { status: 409 } // Conflict
        );
    }
    return NextResponse.json(
      { message: 'Error al crear el ítem de la lista.', error: (error as Error).message },
      { status: 500 }
    );
  }
}