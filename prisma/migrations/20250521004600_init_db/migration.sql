-- CreateEnum
CREATE TYPE "RolUsuarioPlataforma" AS ENUM ('AdminPrincipal', 'Administrador', 'Estandar');

-- CreateEnum
CREATE TYPE "EstadoVisita" AS ENUM ('activa', 'finalizada', 'cancelada');

-- CreateTable
CREATE TABLE "Sede" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sede_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empleado" (
    "id" TEXT NOT NULL,
    "identificacion" TEXT NOT NULL,
    "nombreApellido" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "sedeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioPlataforma" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "rol" "RolUsuarioPlataforma" NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "canManageAutoregister" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsuarioPlataforma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visitante" (
    "id" TEXT NOT NULL,
    "tipodocumento" TEXT NOT NULL,
    "numerodocumento" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "genero" TEXT NOT NULL,
    "fechanacimiento" TIMESTAMP(3) NOT NULL,
    "rh" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "photoDataUri" TEXT,
    "personavisitadaId" TEXT,
    "purpose" TEXT NOT NULL,
    "category" TEXT,
    "tipovisita" TEXT NOT NULL,
    "empresaProviene" TEXT,
    "numerocarnet" TEXT,
    "vehiculoPlaca" TEXT,
    "arl" TEXT NOT NULL,
    "eps" TEXT NOT NULL,
    "contactoemergencianombre" TEXT NOT NULL,
    "contactoemergenciaapellido" TEXT NOT NULL,
    "contactoemergenciatelefono" TEXT NOT NULL,
    "contactoemergenciaparentesco" TEXT NOT NULL,
    "horaentrada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "horasalida" TIMESTAMP(3),
    "estado" "EstadoVisita" NOT NULL DEFAULT 'activa',
    "registradoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visitante_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sede_name_key" ON "Sede"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Empleado_identificacion_key" ON "Empleado"("identificacion");

-- CreateIndex
CREATE INDEX "Empleado_sedeId_idx" ON "Empleado"("sedeId");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioPlataforma_empleadoId_key" ON "UsuarioPlataforma"("empleadoId");

-- CreateIndex
CREATE INDEX "UsuarioPlataforma_empleadoId_idx" ON "UsuarioPlataforma"("empleadoId");

-- CreateIndex
CREATE INDEX "Visitante_numerodocumento_idx" ON "Visitante"("numerodocumento");

-- CreateIndex
CREATE INDEX "Visitante_personavisitadaId_idx" ON "Visitante"("personavisitadaId");

-- CreateIndex
CREATE INDEX "Visitante_registradoPorId_idx" ON "Visitante"("registradoPorId");

-- CreateIndex
CREATE INDEX "Visitante_estado_idx" ON "Visitante"("estado");

-- AddForeignKey
ALTER TABLE "Empleado" ADD CONSTRAINT "Empleado_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioPlataforma" ADD CONSTRAINT "UsuarioPlataforma_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visitante" ADD CONSTRAINT "Visitante_personavisitadaId_fkey" FOREIGN KEY ("personavisitadaId") REFERENCES "Empleado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visitante" ADD CONSTRAINT "Visitante_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "UsuarioPlataforma"("id") ON DELETE SET NULL ON UPDATE CASCADE;
