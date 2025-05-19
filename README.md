🐞 Fallas actuales y tareas pendientes
1. Gestión de empleados
Implementar carga masiva de empleados mediante archivos CSV.

2. Módulo de consultas
Agregar exportación de resultados en formatos Excel y PDF.

Al hacer clic en un resultado de búsqueda, debe abrirse un formulario con todos los campos de esa visita prellenados, incluyendo la foto del visitante.

3. Módulo de visitantes
El código QR generado no es escaneable. Aunque el enlace funciona correctamente, el código debe permitir lectura desde dispositivos.

En el registro manual de visitantes, agregar lógica para el parseo automático de la cédula. Se deben crear los archivos backend necesarios.

4. Dashboard
Permitir cargar una imagen como foto de perfil, únicamente mediante selección de archivo (no cámara).

Almacenar la imagen en una carpeta en la raíz del proyecto.

5. Gestión de listas
Las listas deben ser persistentes sin utilizar una base de datos.

Crear un archivo (por ejemplo, JSON) en la raíz del proyecto para guardar y mantener las listas actualizadas entre sesiones, de modo que los cambios sean visibles para todos los usuarios.

6. Gestión de usuarios
Actualmente, la lista de empleados no se muestra hasta realizar una búsqueda. Se requiere mostrar al menos 5 empleados por defecto.

La función para activar usuarios lanza un error relacionado con "byscript". Debe corregirse y verificarse el funcionamiento completo.

Funcionalidades requeridas:

Activar y desactivar usuarios.

Cambiar contraseña del administrador principal.

Activar y desactivar el autoregistro de usuarios.

Inactivar usuarios.

7. Login y protección de rutas
La aplicación abre por defecto la ruta /admin-dashboard en lugar de la pantalla de login.

Las rutas no están protegidas: actualmente es posible acceder sin iniciar sesión. Se debe implementar protección de rutas.

8. Error de consola (legacyBehavior en Next.js)
Se muestra el siguiente error en consola:

swift
Copiar
Editar
`legacyBehavior` is deprecated and will be removed in a future release. 
A codemod is available to upgrade your components:
npx @next/codemod@latest new-link .
El error no impide el funcionamiento de la aplicación, pero si puede corregirse fácilmente sin afectar el sistema, debería solucionarse. En caso contrario, se puede ignorar temporalmente.

