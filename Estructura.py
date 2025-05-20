import os

# Ruta base a analizar
ruta_base = '.'

# Lista de nombres de carpetas a excluir (solo nombres, no rutas completas)
excluir_carpetas = ['.git', '__pycache__', 'node_modules', 'venv','next']

# Archivo de salida
archivo_salida = 'estructura.txt'

with open(archivo_salida, 'w', encoding='utf-8') as f:
    for raiz, directorios, archivos in os.walk(ruta_base):
        # Filtrar carpetas excluidas
        directorios[:] = [d for d in directorios if d not in excluir_carpetas]

        nivel = raiz.replace(ruta_base, '').count(os.sep)
        indentacion = '│   ' * nivel
        f.write(f'{indentacion}├── {os.path.basename(raiz)}/\n')

        subindentacion = '│   ' * (nivel + 1)
        for archivo in archivos:
            f.write(f'{subindentacion}├── {archivo}\n')

print(f"Estructura guardada en '{archivo_salida}' (excluyendo carpetas: {', '.join(excluir_carpetas)})")
