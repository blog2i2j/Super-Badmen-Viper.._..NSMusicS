$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location -LiteralPath $ProjectRoot

Write-Host "[win] project root: $ProjectRoot"

Write-Host '[win] npm run build'
npm run build
