@echo off
REM Script para guardar la estructura de carpetas y archivos en un archivo .txt

REM Cambia esto si quieres un nombre diferente
set output=estructura.txt

REM Puedes cambiar "." por una ruta específica (como C:\MiProyecto)
set ruta=.

echo Generando estructura de carpetas y archivos...
tree "%ruta%" /F > "%output%"
echo Estructura guardada en %output%
pause
