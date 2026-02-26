$nodeDir = "C:\Users\dean.guedo\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.14.0-win-x64"
$gitDir = "C:\Users\dean.guedo\AppData\Local\Programs\Git\cmd"

if (!(Test-Path (Join-Path $nodeDir "node.exe"))) {
  Write-Error "Node runtime not found at $nodeDir"
  exit 1
}

if (Test-Path $gitDir) {
  $env:Path = "$nodeDir;$gitDir;$env:Path"
} else {
  $env:Path = "$nodeDir;$env:Path"
}

Write-Host "Tooling PATH activated for this shell session."
Write-Host "node: $(node -v)"
Write-Host "npm: $(npm -v)"
Write-Host "npx: $(npx -v)"
if (Get-Command git -ErrorAction SilentlyContinue) {
  Write-Host "git: $(git --version)"
}
