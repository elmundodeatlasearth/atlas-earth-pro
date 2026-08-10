# ============================================================
# DESPLIEGUE DE EDGE FUNCTIONS — Supabase (Windows PowerShell)
# ============================================================
# Pre-requisitos:
#   1) Instalar Supabase CLI:  npm install -g supabase
#   2) Autenticarse:           supabase login
#   3) Tener el project ref:   supabase projects list
# ============================================================

param(
    [string]$ProjectRef = $(Read-Host "Project Ref (código de supabase.co/dashboard)"),
    [string]$AccessToken = $env:SUPABASE_ACCESS_TOKEN
)

if (-not $AccessToken) {
    $AccessToken = Read-Host "Access Token (Settings → Access Tokens)"
}
if (-not $AccessToken) {
    Write-Error "Se requiere el Access Token. Abortando."
    exit 1
}

$ErrorActionPreference = "Stop"

Write-Host "`n=== Desplegando edge functions a $ProjectRef ===`n" -ForegroundColor Cyan

# Desplegar cada función (las 3)
$functions = @("ai-advisor", "stripe-webhook", "admin-list-users")
foreach ($fn in $functions) {
    Write-Host "`n--- Desplegando $fn ---" -ForegroundColor Yellow
    supabase functions deploy $fn --project-ref $ProjectRef --no-verify-jwt
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Fallo al desplegar $fn (código $LASTEXITCODE)"
    }
}

Write-Host "`n=== Edge functions desplegadas ===" -ForegroundColor Green
supabase functions list --project-ref $ProjectRef

Write-Host "`n=== IMPORTANTE: variables de entorno ===" -ForegroundColor Cyan
Write-Host "Configúralas en: Dashboard → Edge Functions → (función) → Secrets"
Write-Host "  ai-advisor:     SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MORPH_API_KEY"
Write-Host "  stripe-webhook: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET"
Write-Host "  admin-list-users: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
Write-Host "`nEl directorio _shared/ (pagos.ts) se sube junto con cada función automáticamente."
Write-Host "`nRecuerda aplicar las migraciones 001-005 en el SQL Editor antes de probar." -ForegroundColor Yellow
