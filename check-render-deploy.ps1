# 🔍 Monitor de Deploy do Render.com
# Verifica se o servidor PeerJS foi atualizado

Write-Host "🔍 MONITORANDO DEPLOY DO RENDER.COM..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$maxAttempts = 20
$attempt = 0
$deployed = $false

Write-Host "🎯 Esperando deploy completar..." -ForegroundColor Yellow
Write-Host "   (Isso pode levar 2-5 minutos)" -ForegroundColor Gray
Write-Host ""

while ($attempt -lt $maxAttempts -and -not $deployed) {
    $attempt++
    
    try {
        Write-Host "[$attempt/$maxAttempts] Verificando servidor..." -NoNewline
        
        $response = Invoke-RestMethod -Uri "https://playnowweb.onrender.com/" -Method Get -ErrorAction Stop
        
        if ($response.service -eq "PlayNowEmulator PeerJS Server") {
            Write-Host " ✅ DEPLOY CONCLUÍDO!" -ForegroundColor Green
            Write-Host ""
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
            Write-Host "🎉 SERVIDOR ATUALIZADO COM SUCESSO!" -ForegroundColor Green
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
            Write-Host ""
            Write-Host "📋 Detalhes do servidor:" -ForegroundColor Cyan
            Write-Host "   Service:  $($response.service)" -ForegroundColor White
            Write-Host "   Version:  $($response.version)" -ForegroundColor White
            Write-Host "   Protocol: $($response.protocol)" -ForegroundColor White
            Write-Host "   Status:   $($response.status)" -ForegroundColor White
            Write-Host ""
            Write-Host "🌐 URL: https://playnowweb.onrender.com" -ForegroundColor Cyan
            Write-Host "🎮 PeerJS Path: /peerjs" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "✅ Agora você pode testar o multiplayer!" -ForegroundColor Green
            $deployed = $true
        }
        elseif ($response.service -eq "PlayNowEmulator Socket.IO Server") {
            Write-Host " ⏳ Ainda na versão antiga..." -ForegroundColor Yellow
            Write-Host "   (Deploy em progresso, aguardando...)" -ForegroundColor Gray
        }
        else {
            Write-Host " ⚠️  Resposta inesperada" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host " ❌ Erro ao conectar" -ForegroundColor Red
        Write-Host "   (Servidor pode estar reiniciando...)" -ForegroundColor Gray
    }
    
    if (-not $deployed) {
        Start-Sleep -Seconds 15
    }
}

if (-not $deployed) {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    Write-Host "⚠️  TIMEOUT - Deploy ainda não completou" -ForegroundColor Red
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 O que fazer:" -ForegroundColor Yellow
    Write-Host "   1. Acesse: https://dashboard.render.com/" -ForegroundColor White
    Write-Host "   2. Encontre o serviço 'playnowweb'" -ForegroundColor White
    Write-Host "   3. Verifique os logs de deploy" -ForegroundColor White
    Write-Host "   4. Se necessário, clique em 'Manual Deploy'" -ForegroundColor White
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
