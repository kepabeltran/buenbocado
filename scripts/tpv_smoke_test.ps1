# ===========================
# BuenBocado - TPV Smoke Test
# Create menu -> create order -> verify list -> mark delivered -> verify DELIVERED
# ===========================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$api = "http://127.0.0.1:4000"
$take = 200

function Fail($msg) { Write-Host $msg -ForegroundColor Red; exit 1 }
function Ok($msg)   { Write-Host $msg -ForegroundColor Green }
function Info($msg) { Write-Host $msg -ForegroundColor Cyan }

# 1) Create menu (offer)
$tag = (Get-Date).ToString("HHmmss")
$menuBody = @{
  type        = "TAKEAWAY"
  title       = "Oferta Auto $tag"
  description = "Oferta prueba TPV ($tag)"
  priceCents  = 850
  currency    = "EUR"
  quantity    = 5
} | ConvertTo-Json -Compress

Info "Creating menu..."
$menuRaw = ($menuBody | curl.exe -s -H "Content-Type: application/json" --data-binary "@-" "$api/api/restaurant/menus")
if ([string]::IsNullOrWhiteSpace($menuRaw)) { Fail "No response creating menu." }

try { $menuObj = $menuRaw | ConvertFrom-Json } catch { Fail "Invalid JSON creating menu: $menuRaw" }
if (-not $menuObj.ok -or -not $menuObj.id) { Fail "Menu create failed: $menuRaw" }

$menuId = $menuObj.id
Ok "Menu OK -> menuId=$menuId"

# 2) Create order
$orderBody = @{
  menuId        = $menuId
  customerName  = "AUTO-$tag"
  customerEmail = "auto+$tag@buenbocado.local"
} | ConvertTo-Json -Compress

Info "Creating order..."
$orderRaw = ($orderBody | curl.exe -s -H "Content-Type: application/json" --data-binary "@-" "$api/api/orders")
if ([string]::IsNullOrWhiteSpace($orderRaw)) { Fail "No response creating order." }

try { $orderObj = $orderRaw | ConvertFrom-Json } catch { Fail "Invalid JSON creating order: $orderRaw" }

if ($orderObj.error) { Fail "API returned error creating order: $orderRaw" }
if (-not $orderObj.ok -or -not $orderObj.order -or -not $orderObj.order.code) { Fail "Order not valid: $orderRaw" }

$code = $orderObj.order.code
Ok "Order OK -> code=$code"

# 3) Verify it appears in /restaurant/orders (up to 20s)
Info "Looking for order in /api/restaurant/orders (up to 20s)..."
$found = $null
for($i=1; $i -le 20; $i++){
  Start-Sleep 1
  $listRaw = curl.exe -s "$api/api/restaurant/orders?take=$take"
  if ([string]::IsNullOrWhiteSpace($listRaw)) { continue }
  try { $listObj = $listRaw | ConvertFrom-Json } catch { continue }
  $found = $listObj.data | Where-Object { $_.code -eq $code } | Select-Object -First 1
  if ($found) { break }
}
if (-not $found) { Fail "NOT FOUND in /api/restaurant/orders: code=$code (check API_BASE mismatch)" }

Ok "List OK -> code=$($found.code) status=$($found.status) customer=$($found.customerName)"

# 4) Mark delivered
Info "Marking DELIVERED..."
$markBody = ('{"code":"'+$code+'"}')
$markRaw = ($markBody | curl.exe -s -H "Content-Type: application/json" --data-binary "@-" "$api/api/restaurant/orders/mark-delivered")
if ([string]::IsNullOrWhiteSpace($markRaw)) { Fail "No response mark-delivered." }

try { $markObj = $markRaw | ConvertFrom-Json } catch { Fail "Invalid JSON mark-delivered: $markRaw" }
if (-not $markObj.ok) { Fail "Mark delivered failed: $markRaw" }

Ok "Mark OK -> code=$($markObj.order.code) status=$($markObj.order.status)"

# 5) Verify DELIVERED in list
Info "Verifying DELIVERED..."
$listRaw2 = curl.exe -s "$api/api/restaurant/orders?take=$take"
try { $listObj2 = $listRaw2 | ConvertFrom-Json } catch { Fail "Invalid JSON list: $listRaw2" }
$found2 = $listObj2.data | Where-Object { $_.code -eq $code } | Select-Object -First 1

if (-not $found2) { Fail "Order disappeared from list: code=$code" }
if ($found2.status -ne "DELIVERED") { Fail "Not DELIVERED yet -> status=$($found2.status)" }

Ok "FINAL OK -> code=$($found2.code) status=$($found2.status) customer=$($found2.customerName)"
Info "TPV smoke test completed."
