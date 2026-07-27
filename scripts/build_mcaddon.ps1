# Script de Empaquetado para The Obsessed Knocker
param([string]$Version = "1.2.6")

$ErrorActionPreference = "Stop"
$ProjectRoot = "C:\Users\User\Downloads\TheObsessedKnocker-1"
$BuildPath = Join-Path $ProjectRoot "build"
$OutputFile = "TheObsessedKnocker_v$Version.mcaddon"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  THE OBSESSED KNOCKER - BUILD SCRIPT v$Version" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# Limpiar y crear build
if (Test-Path $BuildPath) { Remove-Item $BuildPath -Recurse -Force }
New-Item -ItemType Directory -Path $BuildPath | Out-Null
New-Item -ItemType Directory -Path "$BuildPath\KNOCKERbeh2" | Out-Null
New-Item -ItemType Directory -Path "$BuildPath\KNOCKERres2" | Out-Null

# Copiar packs excluyendo tests
Write-Host "[1/2] Copiando Behavior Pack..." -ForegroundColor Yellow
Copy-Item -Path "$ProjectRoot\KNOCKERbeh2\*" -Destination "$BuildPath\KNOCKERbeh2\" -Recurse -Exclude "test_*.js","*test.js","verify_*.js","config_*.json","*.md"
Write-Host "[2/2] Copiando Resource Pack..." -ForegroundColor Yellow
Copy-Item -Path "$ProjectRoot\KNOCKERres2\*" -Destination "$BuildPath\KNOCKERres2\" -Recurse

# Crear .mcaddon
Write-Host "Creando archivo .mcaddon..." -ForegroundColor Yellow
Compress-Archive -Path "$BuildPath\KNOCKERbeh2","$BuildPath\KNOCKERres2" -DestinationPath (Join-Path $BuildPath $OutputFile) -Force

$fileSize = [math]::Round(((Get-Item (Join-Path $BuildPath $OutputFile)).Length / 1MB), 2)
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  BUILD COMPLETADO: $OutputFile ($fileSize MB)" -ForegroundColor Green
Write-Host "  Ruta: $BuildPath\$OutputFile" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Green
