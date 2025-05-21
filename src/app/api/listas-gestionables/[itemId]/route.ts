import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// ManagedListType no es estrictamente necesario aquí a menos que hagas validaciones cruzadas
// import { ManagedListType } from '@prisma/client'; 

// PUT /api/listas-gestionables/[itemId] - Actualizar un ítem existente
export async function PUT(
  request: NextRequest,
  { params }: { params: { itemId: string } } // <--- CORREGIDO: esperar params.itemId
) {
  const { itemId } = params; // <--- CORREGIDO: usar itemId directamente

  if (!itemId) { // Esta validación ahora debería pasar si el ID está en la URL
    return NextResponse.json({ message: 'ID del ítem es requerido.' }, { status: 400 });
  }

  try {
    const body = await request.json();

    if (!body.value || typeof body.value !== 'string' || body.value.trim() === '') {
      return NextResponse.json({ message: 'El campo "value" es inválido o faltante.' }, { status: 400 });
    }
    if (body.order !== undefined && typeof body.order !== 'number') {
        return NextResponse.json({ message: 'El campo "order" debe ser un número si se proporciona.' }, { status: 400 });
    }
    if (body.isActive !== undefined && typeof body.isActive !== 'boolean') {
        return NextResponse.json({ message: 'El campo "isActive" debe ser booleano si se proporciona.' }, { status: 400 });
    }

    const value = body.value.trim();
    const order = body.order as number | undefined;
    const isActive = body.isActive as boolean | undefined;

    const currentItem = await prisma.managedListItem.findUnique({
        where: { id: itemId },
    });

    if (!currentItem) {
        return NextResponse.json({ message: `Ítem con ID "${itemId}" no encontrado.` }, { status: 404 });
    }

    if (value !== currentItem.value) {
        const existingItemWithNewValue = await prisma.managedListItem.findUnique({
            where: {
                listType_value: {
                    listType: currentItem.listType,
                    value: value,
                },
            },
        });

        if (existingItemWithNewValue) {
            return NextResponse.json(
                { message: `El valor "${value}" ya existe en la lista "${currentItem.listType}".` },
                { status: 409 }
            );
        }
    }
    
    const dataToUpdate: { value?: string; order?: number; isActive?: boolean } = {};
    if (value !== currentItem.value) dataToUpdate.value = value; // Solo actualizar si el valor es realmente diferente
    if (order !== undefined && order !== currentItem.order) dataToUpdate.order = order;
    if (isActive !== undefined && isActive !== currentItem.isActive) dataToUpdate.isActive = isActive;

    if (Object.keys(dataToUpdate).length === 0) {
        return NextResponse.json(currentItem, { status: 200 }); 
    }

    const updatedItem = await prisma.managedListItem.update({
      where: { id: itemId },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error(`Error updating managed list item ${itemId}:`, error);
     if (error.code === 'P2002') { 
        return NextResponse.json(
            { message: `El valor "${body.value}" ya existe en esta lista.` },
            { status: 409 } 
        );
    } else if (error.code === 'P2025') { 
        return NextResponse.json({ message: `Ítem con ID "${itemId}" no encontrado.` }, { status: 404 });
    }
    return NextResponse.json(
      { message: `Error al actualizar el ítem de la lista "${itemId}".`, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE /api/listas-gestionables/[itemId] - Eliminar un ítem
export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } } // <--- CORREGIDO: esperar params.itemId
) {
  const { itemId } = params; // <--- CORREGIDO: usar itemId directamente

  if (!itemId) { // Esta validación ahora debería pasar
    return NextResponse.json({ message: 'ID del ítem es requerido.' }, { status: 400 });
  }

  try {
    await prisma.managedListItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ message: 'Ítem eliminado exitosamente.' });
  } catch (error: any) {
    console.error(`Error deleting managed list item ${itemId}:`, error);
    if (error.code === 'P2025') { 
        return NextResponse.json({ message: `Ítem con ID "${itemId}" no encontrado.` }, { status: 404 });
    }
    return NextResponse.json(
      { message: `Error al eliminar el ítem de la lista "${itemId}".`, error: (error as Error).message },
      { status: 500 }
    );
  }
}