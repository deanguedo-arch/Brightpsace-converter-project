param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$CliArgs
)

$nodeDir = "C:\Users\dean.guedo\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.14.0-win-x64"
$gitDir = "C:\Users\dean.guedo\AppData\Local\Programs\Git\cmd"
$nodeExe = Join-Path $nodeDir "node.exe"
$cliEntry = Join-Path $PSScriptRoot "packages\cli\src\index.js"

if (!(Test-Path $nodeExe)) {
  Write-Error "Node runtime not found at: $nodeExe"
  exit 1
}

if (Test-Path $gitDir) {
  $env:Path = "$nodeDir;$gitDir;$env:Path"
} else {
  $env:Path = "$nodeDir;$env:Path"
}

& $nodeExe $cliEntry @CliArgs
exit $LASTEXITCODE
