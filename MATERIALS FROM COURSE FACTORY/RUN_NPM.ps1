param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Args
)

$ErrorActionPreference = "Stop"

$repoRoot = $PSScriptRoot
$nodeDir = Join-Path $repoRoot "node-v24.13.0-win-x64"
$npmCmd = Join-Path $nodeDir "npm.cmd"

if (-not (Test-Path -Path $npmCmd)) {
  throw "Portable npm not found at: $npmCmd`nExpected portable Node folder at: $nodeDir"
}

Push-Location $repoRoot
try {
  $env:Path = "$nodeDir;$env:Path"
  & $npmCmd @Args
  exit $LASTEXITCODE
} finally {
  Pop-Location
}

