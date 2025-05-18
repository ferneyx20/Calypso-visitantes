// src/lib/db.ts
import { Pool } from 'pg';

let pool: Pool;

// Esta función inicializa el pool de conexiones.
// En una aplicación real, tomarías los datos de conexión de variables de entorno.
// Ejemplo: process.env.POSTGRES_URL o process.env.DB_HOST, etc.
function initializePool() {
  if (!pool) {
    const connectionString = process.env.POSTGRES_DATABASE_URL; // Ejemplo de variable de entorno

    if (!connectionString) {
      console.warn(
        "Advertencia: Variable de entorno POSTGRES_DATABASE_URL no está definida. Usando configuración de desarrollo por defecto (puede fallar si no está configurada localmente)."
      );
      // Configuración de fallback para desarrollo local (¡ajusta según sea necesario!)
      // ¡NO USES ESTO EN PRODUCCIÓN CON CREDENCIALES REALES DIRECTAMENTE EN EL CÓDIGO!
      pool = new Pool({
        user: process.env.DB_USER || 'postgres', // Usuario de tu DB
        host: process.env.DB_HOST || 'localhost',  // Host de tu DB
        database: process.env.DB_NAME || 'registro_visitantes_db', // Nombre de tu DB
        password: process.env.DB_PASSWORD || 'password', // Contraseña de tu DB
        port: Number(process.env.DB_PORT) || 5432,   // Puerto de tu DB
      });
    } else {
      pool = new Pool({
        connectionString: connectionString,
        // Considera añadir configuraciones SSL para producción si es necesario
        // ssl: {
        //   rejectUnauthorized: false, // Ajusta según la configuración de tu proveedor de DB
        // },
      });
    }

    pool.on('connect', () => {
      console.log('Cliente conectado a la base de datos PostgreSQL');
    });

    pool.on('error', (err) => {
      console.error('Error inesperado en el cliente de la base de datos PostgreSQL', err);
      // Podrías considerar reiniciar el pool o la aplicación aquí en un escenario real.
    });
  }
  return pool;
}

// Exportamos la instancia del pool inicializada.
// Next.js puede crear múltiples instancias en desarrollo debido al hot-reloading.
// Esta inicialización "lazy" ayuda a mitigar eso, pero para producción
// asegúrate de que la conexión se maneje eficientemente.
export default initializePool();

// Función de utilidad para probar la conexión (opcional)
export async function testDbConnection() {
  if (!pool) {
    console.log("Pool no inicializado. Inicializando ahora...");
    initializePool();
  }
  try {
    const client = await pool.connect();
    console.log('Conexión a la base de datos exitosa!');
    const res = await client.query('SELECT NOW()');
    console.log('Hora actual de la base de datos:', res.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
    return false;
  }
}
