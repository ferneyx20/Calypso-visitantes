import { PrismaClient, RolUsuarioPlataforma } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Inicializar Prisma Client
const prisma = new PrismaClient();

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
        address: 'Autopista Norte Km 21, Vía Gachancipá, Tocancipá, Cundinamarca', // Dirección más específica
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
        sedeId: sede.id, // Usar el ID de la sede "Tocancipa"
      },
    });
    console.log(`Created empleado "${adminFullName}" (Identificación: ${adminIdentification}) with id: ${adminEmpleado.id}`);
  } else {
    console.log(`Empleado "${adminFullName}" (Identificación: ${adminIdentification}, ID: ${adminEmpleado.id}) already exists.`);
  }

  // --- 3. Crear UsuarioPlataforma Admin Principal (si no existe) ---
  // Contraseña para el usuario admin. ¡CAMBIAR ESTO PARA PRODUCCIÓN!
  // En un escenario real, esta contraseña debería ser más segura o gestionada a través de variables de entorno para el seed.
  const adminPassword = 'admin123'; 

  let adminUsuario = await prisma.usuarioPlataforma.findUnique({
    where: { empleadoId: adminEmpleado.id }, // La relación es 1 a 1, empleadoId es unique
  });

  if (!adminUsuario) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10); // 10-12 salt rounds es un buen balance
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
    // Opcional: Podrías añadir lógica para actualizar el rol o la contraseña si fuera necesario,
    // pero para un seed simple, solo crear si no existe suele ser suficiente.
    // Ejemplo: si quieres asegurar que siempre sea AdminPrincipal y esté activo:
    // if (adminUsuario.rol !== RolUsuarioPlataforma.AdminPrincipal || !adminUsuario.isActive) {
    //   const hashedPasswordIfNeeded = await bcrypt.hash(adminPassword, 10); // Re-hashear solo si la contraseña también necesita actualizarse
    //   await prisma.usuarioPlataforma.update({
    //     where: { id: adminUsuario.id },
    //     data: {
    //       rol: RolUsuarioPlataforma.AdminPrincipal,
    //       isActive: true,
    //       // passwordHash: hashedPasswordIfNeeded, // Descomentar si se quiere forzar la actualización de contraseña
    //     },
    //   });
    //   console.log(`Updated UsuarioPlataforma for "${adminFullName}" to ensure AdminPrincipal role and active status.`);
    // }
  }

  // --- Puedes añadir más datos semilla aquí si lo necesitas ---
  // Por ejemplo, otros roles, otros empleados, etc.

  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    // Desconectar Prisma Client al finalizar
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error during seeding process:', e);
    // Desconectar Prisma Client en caso de error
    await prisma.$disconnect();
    process.exit(1); // Salir con código de error
  });