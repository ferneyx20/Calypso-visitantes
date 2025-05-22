import { type NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { cookies } from 'next/headers'; // Para verificar la cookie de autenticación

// Directorio donde se guardan las fotos de los visitantes
const VISITOR_PHOTOS_DIR = path.join(process.cwd(), 'visitor_photos');
const MOCK_AUTH_COOKIE_NAME = 'mock_auth_token'; // Asegúrate que este sea el nombre de tu cookie

export async function GET(
  request: NextRequest,
  { params }: { params: { photoFilename: string } }
) {
  const { photoFilename } = params;

  // 1. Verificar autenticación (simple verificación de cookie para este ejemplo)
  // En una aplicación real, validarías el token/sesión más rigurosamente.
  const authCookie = cookies().get(MOCK_AUTH_COOKIE_NAME);
  if (!authCookie) {
    // Podrías devolver una imagen placeholder de "acceso denegado" o un 401/403
    // Devolver 401/403 es más estándar para APIs, pero el navegador podría no mostrar nada en <img>
    // Considera devolver una imagen por defecto o un error claro.
    // Por ahora, un 401 es semánticamente correcto.
    return new NextResponse('No autorizado para acceder a esta imagen.', { status: 401 });
  }
  // Aquí podrías añadir lógica para verificar si el usuario autenticado tiene permiso
  // para ver esta imagen específica, aunque para fotos de visitantes un admin usualmente puede ver todas.

  if (!photoFilename || typeof photoFilename !== 'string' || photoFilename.includes('..')) {
    // Medida de seguridad básica para evitar path traversal
    return new NextResponse('Nombre de archivo inválido.', { status: 400 });
  }

  try {
    const filePath = path.join(VISITOR_PHOTOS_DIR, photoFilename);

    // Verificar que el archivo exista
    await fs.access(filePath); // Lanza error si no existe o no hay permisos

    const fileBuffer = await fs.readFile(filePath);

    // Determinar el Content-Type basado en la extensión del archivo
    let contentType = 'application/octet-stream'; // Default
    const extension = path.extname(photoFilename).toLowerCase();
    if (extension === '.png') {
      contentType = 'image/png';
    } else if (extension === '.jpg' || extension === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (extension === '.gif') {
      contentType = 'image/gif';
    } // Añade más tipos si los necesitas

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        // Opcional: Cabeceras de caché para que el navegador no pida la imagen repetidamente
        // 'Cache-Control': 'public, max-age=3600, must-revalidate', // Cache por 1 hora
      },
    });

  } catch (error: any) {
    console.error(`Error sirviendo imagen ${photoFilename}:`, error);
    // Si el error es porque el archivo no existe (ENOENT)
    if (error.code === 'ENOENT') {
      // Podrías devolver una imagen placeholder de "no encontrada" o un 404
      return new NextResponse('Imagen no encontrada.', { status: 404 });
    }
    return new NextResponse('Error interno al servir la imagen.', { status: 500 });
  }
}