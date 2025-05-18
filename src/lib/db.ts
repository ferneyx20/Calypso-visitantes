// src/lib/db.ts
// Este archivo ya no es necesario ya que hemos migrado a Prisma.
// Su contenido ha sido reemplazado por src/lib/prisma.ts.
// Puedes eliminar este archivo (src/lib/db.ts).

console.warn(
  "El archivo src/lib/db.ts está obsoleto y ha sido reemplazado por src/lib/prisma.ts. Por favor, elimínelo."
);

// Para evitar errores de importación si alguna parte del código aún lo referencia por error,
// exportamos un objeto vacío o null.
export default null; 
// O podrías re-exportar prisma si quieres una transición más suave,
// pero es mejor actualizar todas las importaciones a '@lib/prisma'.
// import prisma from './prisma';
// export default prisma;
