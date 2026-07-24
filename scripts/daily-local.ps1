# ============================================================================
#  PauzaLogica.ro - rulare zilnica locala (inlocuieste GitHub Actions).
#  Genereaza continut -> valideaza -> commit+push GitHub -> build -> deploy
#  Cloudflare Pages (cu reincercari la erori de retea). Programat la 00:00.
#  Log: logs\daily-local.log
# ============================================================================
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
New-Item -ItemType Directory -Force -Path 'logs' | Out-Null
$log = Join-Path $root 'logs\daily-local.log'
function Log([string]$m) {
  Add-Content -Path $log -Value ("{0}  {1}" -f (Get-Date).ToString('yyyy-MM-dd HH:mm:ss'), $m)
}

Log '================ START ================'

Log '[1/5] Generare continut (buffer azi..azi+14)...'
& npm run generate -- --fill-buffer *>> $log

Log '[2/5] Validare continut...'
& npm run validate *>> $log

Log '[3/5] Commit + push (daca exista continut nou)...'
& git add content/ *>> $log
& git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  & git commit -m 'content: pachete zilnice noi (local)' *>> $log
  & git push *>> $log
  Log '  Continut nou -> comis + push.'
} else {
  Log '  Nimic nou de comis.'
}

Log '[4/5] Build (export static)...'
& npm run build *>> $log
if ($LASTEXITCODE -ne 0) {
  Log '  BUILD ESUAT. Opresc.'
  Log '================ DONE (eroare) ================'
  exit 1
}

Log '[5/5] Deploy pe Cloudflare (max 3 incercari)...'
$ok = $false
for ($i = 1; $i -le 3 -and -not $ok; $i++) {
  Log "  incercare $i..."
  & npx --yes wrangler pages deploy out --project-name=pauzalogica-ro --branch=main --commit-dirty=true *>> $log
  if ($LASTEXITCODE -eq 0) { $ok = $true }
  else { Log "  esuat (cod $LASTEXITCODE), astept 25s..."; Start-Sleep -Seconds 25 }
}

if ($ok) { Log '  Deploy REUSIT.' } else { Log '  DEPLOY ESUAT dupa 3 incercari.' }
Log '================ DONE ================'
if (-not $ok) { exit 1 }
