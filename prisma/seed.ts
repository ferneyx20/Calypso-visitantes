import { PrismaClient, RolUsuarioPlataforma, ManagedListType } from '@prisma/client'; // Asegúrate de importar ManagedListType
import bcrypt from 'bcryptjs';

// Inicializar Prisma Client
const prisma = new PrismaClient();

// Valores iniciales para las listas gestionables (similares a tus constantes originales)
const initialListValues = {
  [ManagedListType.TIPOS_DE_DOCUMENTO]: [
    "Cédula de Ciudadanía",
    "Cédula de Extranjería",
    "Pasaporte",
    "Tarjeta de Identidad",
    "NIT",
    "PEP (Permiso Especial de Permanencia)",
    "PPT (Permiso por Protección Temporal)"
  ],
  [ManagedListType.GENEROS]: [
    "Masculino",
    "Femenino",
    "Otro",
    "Prefiero no decirlo"
  ],
  [ManagedListType.FACTORES_RH]: [
    "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"
  ],
  [ManagedListType.TIPOS_DE_VISITA]: [
    "Visita Programada",
    "Visita Espontánea",
    "Entrega de Mercancía/Proveedor",
    "Reunión de Negocios",
    "Entrevista de Trabajo",
    "Servicio Técnico/Mantenimiento",
    "Auditoría/Inspección",
    "Evento/Capacitación",
    "Familiar/Personal Empleado",
    "Otro"
  ],
  [ManagedListType.ARLS]: [ // Ejemplo, ajusta según tus necesidades
    "Sura",
    "Positiva",
    "Colmena",
    "Bolívar",
    "Liberty",
    "Mapfre",
    "No Aplica"
  ],
  [ManagedListType.EPSS]: [ // Ejemplo, ajusta según tus necesidades
    "Sura EPS",
    "Sanitas",
    "Compensar",
    "Nueva EPS",
    "Salud Total",
    "Coomeva EPS (en liquidación)",
    "Aliansalud",
    "Famisanar",
    "SOS (Servicio Occidental de Salud)",
    "No Aplica"
  ],
  [ManagedListType.PARENTESCOS_CONTACTO_EMERGENCIA]: [
    "Esposo(a)/Compañero(a)",
    "Hijo(a)",
    "Padre",
    "Madre",
    "Hermano(a)",
    "Tío(a)",
    "Abuelo(a)",
    "Amigo(a)",
    "Otro"
  ]
};


async function seedManagedList(listType: ManagedListType, items: string[]) {
  console.log(`Seeding list: ${listType}...`);
  let createdCount = 0;
  let existingCount = 0;

  for (const [index, value] of items.entries()) {
    const existingItem = await prisma.managedListItem.findUnique({
      where: {
        listType_value: { // Usar el nombre del índice unique que definimos
          listType: listType,
          value: value,
        },
      },
    });

    if (!existingItem) {
      await prisma.managedListItem.create({
        data: {
          listType: listType,
          value: value,
          order: index + 1, // Asignar un orden basado en la posición en el array
          isActive: true,
        },
      });
      createdCount++;
    } else {
      existingCount++;
      // Opcional: Actualizar el orden si es necesario
      if (existingItem.order !== index + 1) {
        await prisma.managedListItem.update({
          where: { id: existingItem.id },
          data: { order: index + 1 }
        });
        console.log(`  Updated order for item "${value}" in list ${listType}.`);
      }
    }
  }
  if (createdCount > 0) console.log(`  Created ${createdCount} new items for ${listType}.`);
  if (existingCount > 0 && createdCount === 0) console.log(`  All ${existingCount} items for ${listType} already exist.`);
  else if (existingCount > 0) console.log(`  ${existingCount} items for ${listType} already existed.`);
}


async function main() {
  console.log(`Start seeding ...`);

  // --- 1. Crear Sede "Tocancipa" (si no existe) ---
  const sedeName = 'Tocancipa';
  let sede = await prisma.sede.findUnique({
    where: { name: sedeName },
  });

  if (!sede) {
    sede = await prisma.sede.create({
      data: {
        name: sedeName,
        address: 'Autopista Norte Km 21, Vía Gachancipá, Tocancipá, Cundinamarca',
      },
    });
    console.log(`Created sede "${sedeName}" with id: ${sede.id}`);
  } else {
    console.log(`Sede "${sedeName}" (ID: ${sede.id}) already exists.`);
  }

  // --- 2. Crear Empleado para el Admin Principal (si no existe) ---
  const adminIdentification = 'admin';
  const adminFullName = 'Administrador Principal';

  let adminEmpleado = await prisma.empleado.findUnique({
    where: { identificacion: adminIdentification },
  });

  if (!adminEmpleado) {
    adminEmpleado = await prisma.empleado.create({
      data: {
        identificacion: adminIdentification,
        nombreApellido: adminFullName,
        cargo: 'System Administrator',
        sedeId: sede.id,
      },
    });
    console.log(`Created empleado "${adminFullName}" (Identificación: ${adminIdentification}) with id: ${adminEmpleado.id}`);
  } else {
    console.log(`Empleado "${adminFullName}" (Identificación: ${adminIdentification}, ID: ${adminEmpleado.id}) already exists.`);
  }

  // --- 3. Crear UsuarioPlataforma Admin Principal (si no existe) ---
  const adminPassword = 'admin123';

  let adminUsuario = await prisma.usuarioPlataforma.findUnique({
    where: { empleadoId: adminEmpleado.id },
  });

  if (!adminUsuario) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    adminUsuario = await prisma.usuarioPlataforma.create({
      data: {
        empleadoId: adminEmpleado.id,
        rol: RolUsuarioPlataforma.AdminPrincipal,
        passwordHash: hashedPassword,
        canManageAutoregister: true,
        isActive: true,
      },
    });
    console.log(`Created UsuarioPlataforma for "${adminFullName}" with rol AdminPrincipal.`);
    console.log(`  >>> Login with Identificación: ${adminIdentification} and Password: ${adminPassword} (Password for development only)`);
  } else {
    console.log(`UsuarioPlataforma for "${adminFullName}" (Rol: ${adminUsuario.rol}) already exists.`);
  }

  // --- 4. Sembrar las Listas Gestionables ---
  console.log("\nSeeding Managed Lists...");
  for (const key in initialListValues) {
    const listTypeKey = key as keyof typeof initialListValues; // Asegurar que la clave es un tipo de ManagedListType
    // Verificar que listTypeKey sea realmente un valor del enum ManagedListType
    if (Object.values(ManagedListType).includes(listTypeKey as ManagedListType)) {
        await seedManagedList(listTypeKey as ManagedListType, initialListValues[listTypeKey]);
    } else {
        console.warn(`  Skipping unknown list type in seed: ${listTypeKey}`);
    }
  }

  console.log(`\nSeeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error during seeding process:', e);
    await prisma.$disconnect();
    process.exit(1);
  });