// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
  // Puedes añadir opciones de log aquí si lo necesitas, por ejemplo:
  // log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;

// Función de utilidad para probar la conexión (opcional)
export async function testDbConnection() {
  try {
    await prisma.$connect();
    console.log('Conexión a la base de datos (Prisma) exitosa!');
    const result = await prisma.$queryRaw`SELECT NOW()`;
    console.log('Hora actual de la base de datos:', (result as any)[0].now);
    return true;
  } catch (error) {
    console.error('Error al conectar con la base de datos (Prisma):', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}
