@echo off
set PATH=C:\Users\dean.guedo\Downloads\node-v24.13.0-win-x64;%PATH%
echo Starting Vault Scanner...
node scripts/scan-vault.cjs
echo.
pause