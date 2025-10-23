# Script para limpar cache e testar
Write-Host "🧹 Limpando cache do navegador..." -ForegroundColor Yellow

# Para Chrome
$chromePath = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache"
if (Test-Path $chromePath) {
    Remove-Item -Path "$chromePath\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Cache do Chrome limpo" -ForegroundColor Green
}

# Para Edge
$edgePath = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache"
if (Test-Path $edgePath) {
    Remove-Item -Path "$edgePath\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Cache do Edge limpo" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Cache limpo! Agora:" -ForegroundColor Green
Write-Host "1. Abra o navegador" -ForegroundColor Cyan
Write-Host "2. Vá para http://localhost:5173" -ForegroundColor Cyan
Write-Host "3. Pressione F12 (Console)" -ForegroundColor Cyan
Write-Host "4. Teste o jogo Dragon Ball Z" -ForegroundColor Cyan