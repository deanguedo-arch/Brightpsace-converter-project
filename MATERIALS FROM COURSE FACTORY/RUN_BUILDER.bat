@echo off
set PATH=C:\Users\dean.guedo\Downloads\node-v24.13.0-win-x64;%PATH%

echo 🛠️  REPAIRING PROJECT: Installing missing ingredients...
echo This will take about 1 minute. Please wait.
echo ---------------------------------------

:: This line downloads everything you need into the new folder
call npm.cmd install

echo ---------------------------------------
echo ✅ Repair Complete! 🚀 Starting Course Factory...
echo ---------------------------------------

call npm.cmd run dev
pause