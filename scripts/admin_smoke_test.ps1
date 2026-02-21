# ============================
# BuenBocado - Admin Smoke Test
# Login admin -> hit admin endpoints -> print counts
# Requiere variables de entorno:
#   BB_ADMIN_EMAIL, BB_ADMIN_PASSWORD
# Opcional:
#   BB_API_BASE (default http://127.0.0.1:4000)
# ============================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$api = if ($env:BB_API_BASE) { $env:BB_API_BASE } else { "http://127.0.0.1:4000" }
$api = $api.TrimEnd('/')

$email = $env:BB_ADMIN_EMAIL
$password = $env:BB_ADMIN_PASSWORD

function Fail($msg) { Write-Host $msg -ForegroundColor Red; exit 1 }
function Ok($msg)   { Write-Host $msg -ForegroundColor Green }
function Info($msg) { Write-Host $msg -ForegroundColor Cyan }

function ParseJsonOrFail($raw, $context) {
  if ([string]::IsNullOrWhiteSpace($raw)) { Fail "No response ($context)." }
  try { return ($raw | ConvertFrom-Json) } catch { Fail "Invalid JSON ($context): $raw" }
}

function GetArrayCount($obj) {
  if ($null -eq $obj) { return 0 }
  if ($obj -is [System.Array]) { return $obj.Count }
  # A veces PowerShell representa listas como ICollection
  if ($obj -is [System.Collections.ICollection]) { return $obj.Count }
  return 1
}

if ([string]::IsNullOrWhiteSpace($email) -or [string]::IsNullOrWhiteSpace($password)) {
  Fail "Faltan BB_ADMIN_EMAIL / BB_ADMIN_PASSWORD en variables de entorno.\nEjemplo:\n  `$env:BB_ADMIN_EMAIL='admin@buenbocado.com'\n  `$env:BB_ADMIN_PASSWORD='tu_password'"
}

Info "Admin login..."
$loginBody = @{ email = $email.Trim().ToLower(); password = $password } | ConvertTo-Json -Compress
$loginRaw = ($loginBody | curl.exe -s -H "Content-Type: application/json" --data-binary "@-" "$api/api/auth/admin/login")
$loginObj = ParseJsonOrFail $loginRaw "admin/login"

if (-not $loginObj.accessToken) { Fail "Login failed (no accessToken): $loginRaw" }

$token = $loginObj.accessToken
$authH = "Authorization: Bearer $token"
Ok "Login OK -> token recibido"

# --- STATS ---
Info "GET /api/admin/stats"
$statsRaw = curl.exe -s -H $authH "$api/api/admin/stats"
$statsObj = ParseJsonOrFail $statsRaw "admin/stats"
if (-not $statsObj.ok) { Fail "stats not ok: $statsRaw" }
$stats = $statsObj.data
Ok ("Stats OK -> restaurants={0} active={1} orders={2} today={3} deliveredToday={4} salesTodayCents={5}" -f `
  $stats.totalRestaurants, $stats.activeRestaurants, $stats.totalOrders, $stats.ordersToday, $stats.deliveredToday, $stats.salesTodayCents)

# --- RESTAURANTS ---
Info "GET /api/admin/restaurants"
$rRaw = curl.exe -s -H $authH "$api/api/admin/restaurants"
$rObj = ParseJsonOrFail $rRaw "admin/restaurants"
if (-not $rObj.ok) { Fail "restaurants not ok: $rRaw" }
$rCount = GetArrayCount $rObj.data
Ok "Restaurants OK -> count=$rCount"

# --- ORDERS ---
Info "GET /api/admin/orders?take=5"
$oRaw = curl.exe -s -H $authH "$api/api/admin/orders?take=5"
$oObj = ParseJsonOrFail $oRaw "admin/orders"
if (-not $oObj.ok) { Fail "orders not ok: $oRaw" }
$oCount = GetArrayCount $oObj.data
Ok ("Orders OK -> returned={0} total={1}" -f $oCount, $oObj.total)

# --- OFFERS ---
Info "GET /api/admin/offers?take=5"
$ofRaw = curl.exe -s -H $authH "$api/api/admin/offers?take=5"
$ofObj = ParseJsonOrFail $ofRaw "admin/offers"
if (-not $ofObj.ok) { Fail "offers not ok: $ofRaw" }
$ofCount = GetArrayCount $ofObj.data
Ok ("Offers OK -> returned={0} total={1}" -f $ofCount, $ofObj.total)

# --- SETTLEMENTS ---
Info "GET /api/admin/settlements?take=5"
$sRaw = curl.exe -s -H $authH "$api/api/admin/settlements?take=5"
$sObj = ParseJsonOrFail $sRaw "admin/settlements"
if (-not $sObj.ok) { Fail "settlements not ok: $sRaw" }
$sCount = GetArrayCount $sObj.data
Ok "Settlements OK -> count=$sCount"

# --- RESTAURANT USERS ---
Info "GET /api/admin/restaurant-users"
$uRaw = curl.exe -s -H $authH "$api/api/admin/restaurant-users"
$uObj = ParseJsonOrFail $uRaw "admin/restaurant-users"
if (-not $uObj.ok) { Fail "restaurant-users not ok: $uRaw" }
$uCount = GetArrayCount $uObj.data
Ok "Restaurant Users OK -> count=$uCount"

Info "Admin smoke test completed."
