@echo off
set PATH=C:\Users\dean.guedo\Downloads\node-v24.13.0-win-x64;%PATH%

echo.
echo ========================================
echo 🏗️  BUILDING COURSE FACTORY
echo    for GitHub Pages deployment
echo ========================================
echo.

call npm.cmd run build

echo.
echo ========================================
echo ✅ BUILD COMPLETE!
echo.
echo Next steps:
echo 1. Check the 'dist' folder was created
echo 2. Commit and push to GitHub
echo 3. Your site will update automatically!
echo ========================================
echo.
pause