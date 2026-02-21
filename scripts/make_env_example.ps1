<#
.SYNOPSIS
  Genera archivos .env.example a partir de .env/.env.local, eliminando valores (secrets).

.DESCRIPTION
  - Busca env files comunes por carpeta: .env.local, .env, .env.development.local, .env.development, .env.production.local, .env.production
  - Excluye cualquier *.example
  - Crea/reescribe .env.example en la MISMA carpeta del env fuente
  - Conserva comentarios y líneas en blanco
  - Reemplaza valores por "<REPLACE_ME>" cuando haya algo definido
  - No imprime ni sube secretos: solo escribe ejemplos sanitizados

USO (PowerShell, desde el ROOT del repo):
  Set-Location "C:\...\buenbocado_ok"
  .\scripts\make_env_example.ps1

#>

$ErrorActionPreference = "Stop"

function Strip-Line([string]$line) {
  $trim = $line.Trim()
  if ($trim -eq "" -or $trim.StartsWith("#")) { return $line }

  # export KEY=VALUE  |  KEY=VALUE
  $m = [regex]::Match($line, '^\s*(export\s+)?(?<key>[A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?<val>.*)\s*$')
  if (-not $m.Success) { return $line }

  $key = $m.Groups["key"].Value
  $val = $m.Groups["val"].Value

  # Separar comentario final " # ..."
  $comment = ""
  $valuePart = $val

  # Heurística simple: si hay un # y NO estamos dentro de comillas, lo tomamos como comentario
  $inSingle = $false
  $inDouble = $false
  for ($i = 0; $i -lt $val.Length; $i++) {
    $ch = $val[$i]
    if ($ch -eq "'" -and -not $inDouble) { $inSingle = -not $inSingle }
    elseif ($ch -eq '"' -and -not $inSingle) { $inDouble = -not $inDouble }
    elseif ($ch -eq "#" -and -not $inSingle -and -not $inDouble) {
      $valuePart = $val.Substring(0, $i).TrimEnd()
      $comment = $val.Substring($i)  # incluye #
      break
    }
  }

  if ($valuePart -eq "") {
    return "$key=$comment".TrimEnd()
  }

  return "$key=<REPLACE_ME> $comment".TrimEnd()
}

$patterns = @(
  ".env.local",
  ".env",
  ".env.development.local",
  ".env.development",
  ".env.production.local",
  ".env.production"
)

$repoRoot = Get-Location

# Recorremos carpetas relevantes
$dirs = Get-ChildItem -Path $repoRoot -Directory -Recurse -Force |
  Where-Object { $_.FullName -notmatch "\\node_modules\\|\\\.git\\|\\dist\\|\\build\\|\\\.next\\|\\_local_backups\\" } |
  Select-Object -ExpandProperty FullName

# Incluimos el root también
$dirs = @($repoRoot.Path) + $dirs

$made = 0
foreach ($d in $dirs | Select-Object -Unique) {
  $source = $null
  foreach ($p in $patterns) {
    $candidate = Join-Path $d $p
    if (Test-Path $candidate) { $source = $candidate; break }
  }
  if (-not $source) { continue }

  if ($source -like "*.example") { continue }

  $out = Join-Path $d ".env.example"

  $lines = Get-Content -LiteralPath $source -Raw -Encoding UTF8
  $outLines = @()
  foreach ($raw in ($lines -split "`r?`n")) {
    $outLines += (Strip-Line $raw)
  }

  # Escribir UTF-8 sin BOM
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($out, ($outLines -join "`n"), $utf8NoBom)

  $made++
  Write-Host "OK: $out  (from $source)" -ForegroundColor Green
}

Write-Host "`nHecho. .env.example generados: $made" -ForegroundColor Cyan
