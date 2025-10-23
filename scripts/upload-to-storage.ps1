# 📤 UPLOAD DE JOGOS PARA FIREBASE STORAGE
# Este script faz upload de todas as ROMs e Covers usando Firebase CLI

Write-Host "🎮 UPLOAD DE JOGOS PARA FIREBASE STORAGE" -ForegroundColor Cyan
Write-Host ""

$romsDir = "public/roms"
$coversDir = "public/covers"

# Contador
$uploadedRoms = 0
$uploadedCovers = 0
$errors = 0

# 1. Upload de ROMs
Write-Host "📁 Fazendo upload de ROMs..." -ForegroundColor Yellow
$romFiles = Get-ChildItem -Path $romsDir -File

foreach ($file in $romFiles) {
    $remotePath = "gs://planowemulator.appspot.com/roms/$($file.Name)"
    Write-Host "   Uploading: $($file.Name)..." -NoNewline
    
    try {
        $output = gsutil cp "$romsDir/$($file.Name)" $remotePath 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✅" -ForegroundColor Green
            $uploadedRoms++
        } else {
            Write-Host " ❌" -ForegroundColor Red
            $errors++
        }
    } catch {
        Write-Host " ❌ Erro" -ForegroundColor Red
        $errors++
    }
}

Write-Host ""

# 2. Upload de Covers
Write-Host "🖼️  Fazendo upload de Covers..." -ForegroundColor Yellow
$coverFiles = Get-ChildItem -Path $coversDir -File -Include "*.jpg","*.jpeg","*.png","*.webp"

foreach ($file in $coverFiles) {
    $remotePath = "gs://planowemulator.appspot.com/covers/$($file.Name)"
    Write-Host "   Uploading: $($file.Name)..." -NoNewline
    
    try {
        $output = gsutil cp "$coversDir/$($file.Name)" $remotePath 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✅" -ForegroundColor Green
            $uploadedCovers++
        } else {
            Write-Host " ❌" -ForegroundColor Red
            $errors++
        }
    } catch {
        Write-Host " ❌ Erro" -ForegroundColor Red
        $errors++
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 RESUMO DO UPLOAD" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "ROMs:    $uploadedRoms arquivos" -ForegroundColor Green
Write-Host "Covers:  $uploadedCovers arquivos" -ForegroundColor Green
Write-Host "Total:   $($uploadedRoms + $uploadedCovers) arquivos" -ForegroundColor Green
Write-Host "Erros:   $errors" -ForegroundColor $(if($errors -gt 0){"Red"}else{"Green"})
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Upload concluído!" -ForegroundColor Green
Write-Host "🌐 Próximo passo: Acesse o site e clique em 'Sincronizar Storage'" -ForegroundColor Yellow
Write-Host "   URL: https://planowemulator.web.app" -ForegroundColor Cyan
