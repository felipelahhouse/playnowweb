# 🚀 DEPLOY SCRIPT - PlayNow Emulator
# Script PowerShell para deploy rápido

Write-Host "🚀 ========================================" -ForegroundColor Cyan
Write-Host "🚀 INICIANDO DEPLOY - PlayNow Emulator" -ForegroundColor Cyan
Write-Host "🚀 ========================================`n" -ForegroundColor Cyan

# Executa o script de deploy Node.js
npm run deploy

Write-Host "`n✨ Deploy finalizado!" -ForegroundColor Green
Write-Host "🌐 Acesse: https://playnowemulator.com" -ForegroundColor Yellow
Write-Host "⏱️  Aguarde ~30 segundos para propagação do CDN" -ForegroundColor Yellow