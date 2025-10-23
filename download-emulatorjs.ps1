# ========================================
# 📥 DOWNLOAD EMULATORJS FILES LOCALLY
# ========================================

Write-Host "🎮 Baixando EmulatorJS localmente..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$baseDir = "public/emulatorjs"
$cdnBase = "https://cdn.emulatorjs.org/stable/data"

# Criar diretórios necessários
Write-Host "📁 Criando diretórios..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "$baseDir" | Out-Null
New-Item -ItemType Directory -Force -Path "$baseDir/cores" | Out-Null

# Lista de cores essenciais
$cores = @(
    "snes9x",
    "nestopia", 
    "mgba",
    "gambatte",
    "genesis_plus_gx",
    "pcsx_rearmed",
    "mupen64plus_next"
)

Write-Host "✅ Diretórios criados!" -ForegroundColor Green
Write-Host ""

# Baixar arquivos principais
Write-Host "📥 Baixando arquivos principais..." -ForegroundColor Yellow

$mainFiles = @(
    "emulator.min.js",
    "loader.js", 
    "emulator.min.css"
)

foreach ($file in $mainFiles) {
    $url = "$cdnBase/$file"
    $output = "$baseDir/$file"
    
    Write-Host "  Baixando $file..." -ForegroundColor Gray
    try {
        Invoke-WebRequest -Uri $url -OutFile $output -ErrorAction Stop
        Write-Host "  ✅ $file baixado!" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Erro ao baixar $file" -ForegroundColor Red
        Write-Host "     $($_.Exception.Message)" -ForegroundColor DarkRed
    }
}

Write-Host ""
Write-Host "📥 Baixando cores dos emuladores..." -ForegroundColor Yellow

foreach ($core in $cores) {
    $url = "$cdnBase/$core.js"
    $output = "$baseDir/cores/$core.js"
    
    Write-Host "  Baixando core: $core..." -ForegroundColor Gray
    try {
        Invoke-WebRequest -Uri $url -OutFile $output -ErrorAction Stop
        
        # Verificar tamanho do arquivo
        $fileInfo = Get-Item $output
        $sizeKB = [math]::Round($fileInfo.Length / 1KB, 2)
        Write-Host "  ✅ $core.js baixado! ($sizeKB KB)" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️ Erro ao baixar $core.js" -ForegroundColor Yellow
        Write-Host "     $($_.Exception.Message)" -ForegroundColor DarkYellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ DOWNLOAD CONCLUÍDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Resumo dos arquivos baixados:" -ForegroundColor Cyan

$totalSize = 0
Get-ChildItem -Path $baseDir -Recurse -File | ForEach-Object {
    $sizeKB = [math]::Round($_.Length / 1KB, 2)
    $totalSize += $_.Length
    Write-Host "  $($_.Name) - $sizeKB KB" -ForegroundColor Gray
}

$totalMB = [math]::Round($totalSize / 1MB, 2)
Write-Host ""
Write-Host "📦 Tamanho total: $totalMB MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 Próximo passo: Atualize o universal-player.html para usar os arquivos locais!" -ForegroundColor Yellow
