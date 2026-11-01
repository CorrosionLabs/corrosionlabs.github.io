@echo off
cd /d "%~dp0"

echo Generando arbol...
echo.

tree "%~dp0" /F /A > "%~dp0estructura.txt"

echo.
echo Terminado.
echo Archivo creado en:
echo %~dp0estructura.txt
echo.
pause