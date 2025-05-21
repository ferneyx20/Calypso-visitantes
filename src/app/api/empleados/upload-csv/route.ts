// src/app/api/empleados/upload-csv/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import Papa from 'papaparse'; // Para parsear CSV
import { z } from 'zod';
import type { Sede } from '@prisma/client';

// Schema de validación para una fila del CSV (después de ser parseada)
const csvRowSchema = z.object({
  identificacion: z.string().min(1, "La identificación es requerida."),
  "nombre y apellido": z.string().min(1, "El nombre y apellido es requerido."), // Nombre de columna exacto del CSV
  cargo: z.string().min(1, "El cargo es requerido."),
  nombre_sede: z.string().min(1, "El nombre de la sede es requerido."),
});

// Tipo para la respuesta que este endpoint enviará al frontend
interface CSVUploadResponse {
  message: string;
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; identificacion?: string; error: string }>;
  createdEmployees?: any[]; // Podrías tipar esto mejor si devuelves los empleados creados
}

export async function POST(request: NextRequest) {
  let responsePayload: CSVUploadResponse = {
    message: '',
    successCount: 0,
    errorCount: 0,
    errors: [],
    createdEmployees: []
  };

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      responsePayload.message = "No se recibió ningún archivo.";
      responsePayload.errorCount = 1;
      responsePayload.errors.push({ row: 0, error: "No se envió archivo." });
      return NextResponse.json(responsePayload, { status: 400 });
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      responsePayload.message = "Formato de archivo no válido. Solo se aceptan archivos CSV.";
      responsePayload.errorCount = 1;
      responsePayload.errors.push({ row: 0, error: "Formato de archivo no válido." });
      return NextResponse.json(responsePayload, { status: 400 });
    }

    const fileContent = await file.text();

    // Parsear el CSV
    // Es importante que Papaparse se ejecute en un entorno que lo soporte (Node.js en este caso)
    const parseResult = Papa.parse(fileContent, {
      header: true,       // La primera fila son cabeceras
      skipEmptyLines: true,
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, ' '), // Normalizar cabeceras
    });

    if (parseResult.errors.length > 0) {
      responsePayload.message = "Error al parsear el archivo CSV.";
      responsePayload.errorCount = parseResult.data.length || 1; // Asumir error en todas las filas si el parseo global falla
      parseResult.errors.forEach(err => {
        responsePayload.errors.push({ row: err.row || 0, error: `Error de parseo: ${err.message}` });
      });
      return NextResponse.json(responsePayload, { status: 400 });
    }

    const rows = parseResult.data as any[]; // Tipar como any[] por ahora, luego validamos cada fila

    if (rows.length === 0) {
      responsePayload.message = "El archivo CSV está vacío o no contiene datos válidos.";
      return NextResponse.json(responsePayload, { status: 400 });
    }
    
    // Cargar todas las sedes existentes para una búsqueda eficiente en memoria
    const todasLasSedes = await prisma.sede.findMany();
    const sedesMap = new Map<string, Sede>();
    todasLasSedes.forEach(sede => sedesMap.set(sede.name.trim().toLowerCase(), sede));

    const empleadosParaCrear = [];

    for (let i = 0; i < rows.length; i++) {
      const rowData = rows[i];
      const physicalRowNumber = i + 2; // +1 por cabecera, +1 porque el índice es base 0

      // Normalizar nombres de claves del objeto `rowData` si es necesario,
      // aunque Papa.parse con `transformHeader` ya debería haberlo hecho.
      const transformedRowData = {
        identificacion: rowData['identificacion'],
        "nombre y apellido": rowData['nombre y apellido'],
        cargo: rowData['cargo'],
        nombre_sede: rowData['nombre sede'] || rowData['nombre_sede'], // Intentar con/sin guion bajo
      };
      
      const validation = csvRowSchema.safeParse(transformedRowData);

      if (!validation.success) {
        responsePayload.errorCount++;
        const errorMessages = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        responsePayload.errors.push({ 
            row: physicalRowNumber, 
            identificacion: transformedRowData.identificacion || 'N/A', 
            error: `Datos inválidos - ${errorMessages}` 
        });
        continue; // Saltar esta fila y continuar con la siguiente
      }

      const { identificacion, "nombre y apellido": nombreApellido, cargo, nombre_sede } = validation.data;

      // 2. Validar Sede
      const sedeNormalizada = nombre_sede.trim().toLowerCase();
      const sedeExistente = sedesMap.get(sedeNormalizada);

      if (!sedeExistente) {
        responsePayload.errorCount++;
        responsePayload.errors.push({ row: physicalRowNumber, identificacion, error: `La sede "${nombre_sede}" no existe.` });
        continue;
      }

      // 3. Preparar datos para la creación (aún no se crea)
      empleadosParaCrear.push({
        rowNumber: physicalRowNumber, // Guardar para reportar errores después de createMany
        originalData: validation.data,
        data: {
          identificacion,
          nombreApellido,
          cargo,
          sedeId: sedeExistente.id,
        }
      });
    }

    // 4. Intentar crear empleados en lote (si hay alguno válido)
    if (empleadosParaCrear.length > 0) {
      // `createMany` es más eficiente pero no devuelve los registros creados y tiene limitaciones
      // con conflictos de unicidad (P2002) si no se maneja con `skipDuplicates`.
      // Aquí vamos a iterar y crear uno por uno para mejor manejo de errores individuales.
      for (const emp of empleadosParaCrear) {
        try {
          const nuevoEmpleado = await prisma.empleado.create({
            data: emp.data,
          });
          responsePayload.successCount++;
          // responsePayload.createdEmployees.push(nuevoEmpleado); // Opcional si quieres devolverlos
        } catch (e: any) {
          responsePayload.errorCount++;
          let errorMessage = "Error desconocido al crear empleado.";
          if (e.code === 'P2002' && e.meta?.target?.includes('identificacion')) {
            errorMessage = `La identificación "${emp.data.identificacion}" ya existe.`;
          } else if (e.message) {
            errorMessage = e.message;
          }
          responsePayload.errors.push({ 
            row: emp.rowNumber, 
            identificacion: emp.data.identificacion, 
            error: errorMessage 
          });
        }
      }
    }

    if (responsePayload.successCount > 0 && responsePayload.errorCount === 0) {
      responsePayload.message = `Se procesaron ${responsePayload.successCount} empleado(s) exitosamente.`;
      return NextResponse.json(responsePayload, { status: 201 }); // 201 Created
    } else if (responsePayload.successCount > 0 && responsePayload.errorCount > 0) {
      responsePayload.message = `Se procesaron ${responsePayload.successCount} empleado(s) exitosamente, pero ${responsePayload.errorCount} tuvieron errores.`;
      return NextResponse.json(responsePayload, { status: 207 }); // 207 Multi-Status
    } else if (responsePayload.errorCount > 0) {
      responsePayload.message = `No se procesó ningún empleado exitosamente. Se encontraron ${responsePayload.errorCount} errores.`;
      return NextResponse.json(responsePayload, { status: 422 }); // 422 Unprocessable Entity
    } else {
      responsePayload.message = "No se encontraron empleados válidos para procesar en el archivo.";
      return NextResponse.json(responsePayload, { status: 200 }); // O 400 si se considera un error
    }

  } catch (error) {
    console.error("Error en /api/empleados/upload-csv:", error);
    responsePayload.message = "Ocurrió un error interno en el servidor al procesar el archivo.";
    if (error instanceof Error && responsePayload.errors.length === 0) {
         responsePayload.errors.push({ row: 0, error: error.message });
         responsePayload.errorCount = 1;
    }
    return NextResponse.json(responsePayload, { status: 500 });
  }
}