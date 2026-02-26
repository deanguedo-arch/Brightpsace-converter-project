@echo off
set "NODE_DIR=C:\Users\dean.guedo\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.14.0-win-x64"
set "GIT_DIR=C:\Users\dean.guedo\AppData\Local\Programs\Git\cmd"

if not exist "%NODE_DIR%\node.exe" (
  echo Node runtime not found at "%NODE_DIR%\node.exe"
  exit /b 1
)

if exist "%GIT_DIR%" (
  set "PATH=%NODE_DIR%;%GIT_DIR%;%PATH%"
) else (
  set "PATH=%NODE_DIR%;%PATH%"
)

"%NODE_DIR%\node.exe" "%~dp0packages\cli\src\index.js" %*
exit /b %errorlevel%
