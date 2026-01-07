param(
  [switch]$Stop
)

$root = "C:\Users\Harold\Desktop\contenido\KEPA 2024\guapiweb\buenbocado"
Set-Location $root

function Kill-Port([int]$port) {
  $lines = netstat -ano | findstr ":$port" | findstr "LISTENING"
  foreach ($l in $lines) {
    $procId = (($l -split "\s+") | Where-Object { $_ })[-1]
    if ($procId -match "^\d+$") {
      try { taskkill /PID $procId /F | Out-Null } catch {}
    }
  }
}

Write-Host "=== BuenBocado DEV ===" -ForegroundColor Cyan
Write-Host "Root: $root"
Write-Host "Ports: API 4000 | Client 3000"

# 1) Limpiar puertos
Kill-Port 3000
Kill-Port 4000

if ($Stop) {
  Write-Host "OK: puertos liberados. (Stop)" -ForegroundColor Yellow
  exit 0
}

# 2) Levantar Postgres si Docker está disponible
try {
  docker compose up -d | Out-Null
  Write-Host "Docker: postgres up" -ForegroundColor Green
} catch {
  Write-Host "Docker: no se pudo arrancar (¿Docker Desktop abierto?)" -ForegroundColor Yellow
}

# 3) Abrir API + Client en 2 ventanas (NO cerrarlas)
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$root'; pnpm -C .\apps\api dev"
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$root'; pnpm -C .\apps\client dev"

Start-Sleep -Seconds 2
Start-Process "http://localhost:3000"
Write-Host "Listo ✅" -ForegroundColor Green
