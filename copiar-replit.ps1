# Script para copiar arquivos para o Replit facilmente
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   PREPARAR ARQUIVOS PARA REPLIT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$basePath = "c:\Users\peternoia\Desktop\playnowemulator-firebase\replit-server"

# Verificar se os arquivos existem
$files = @{
    "main.py" = "$basePath\main.py"
    "requirements.txt" = "$basePath\requirements.txt"
    ".replit" = "$basePath\.replit"
}

Write-Host "✅ Arquivos encontrados:" -ForegroundColor Green
foreach ($file in $files.Keys) {
    if (Test-Path $files[$file]) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file (FALTANDO!)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "   ESCOLHA UMA OPCAO:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "[1] Abrir arquivos no Notepad (um por vez)" -ForegroundColor White
Write-Host "[2] Copiar tudo para a area de transferencia (texto)" -ForegroundColor White
Write-Host "[3] Abrir o Replit no navegador" -ForegroundColor White
Write-Host "[4] Testar servidor Replit atual" -ForegroundColor White
Write-Host "[5] Fazer tudo automaticamente!" -ForegroundColor Cyan
Write-Host ""

$choice = Read-Host "Digite o numero da opcao"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Abrindo arquivos no Notepad..." -ForegroundColor Yellow
        Write-Host "Pressione Ctrl+A e depois Ctrl+C em cada arquivo" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        
        notepad $files["main.py"]
        notepad $files["requirements.txt"]
        notepad $files[".replit"]
    }
    
    "2" {
        Write-Host ""
        Write-Host "Copiando conteudo dos arquivos..." -ForegroundColor Yellow
        
        $combined = @"
========================================
ARQUIVO 1: main.py
========================================

$(Get-Content $files["main.py"] -Raw)

========================================
ARQUIVO 2: requirements.txt
========================================

$(Get-Content $files["requirements.txt"] -Raw)

========================================
ARQUIVO 3: .replit
========================================

$(Get-Content $files[".replit"] -Raw)

========================================
FIM - Arquivos prontos!
========================================
"@
        
        Set-Clipboard -Value $combined
        Write-Host "✅ Conteudo copiado para a area de transferencia!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Agora:" -ForegroundColor Cyan
        Write-Host "1. Acesse o Replit" -ForegroundColor White
        Write-Host "2. Cole com Ctrl+V" -ForegroundColor White
        Write-Host "3. Separe cada arquivo manualmente" -ForegroundColor White
    }
    
    "3" {
        Write-Host ""
        Write-Host "Abrindo Replit no navegador..." -ForegroundColor Yellow
        Start-Process "https://replit.com"
    }
    
    "4" {
        Write-Host ""
        Write-Host "Testando servidor Replit..." -ForegroundColor Yellow
        try {
            $response = Invoke-WebRequest -Uri "https://9d82cbde-f257-42c0-a522-97242fdf17c9-00-3qtza34279pqe.worf.replit.dev/health" -TimeoutSec 10
            Write-Host "✅ SERVIDOR ONLINE!" -ForegroundColor Green
            Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
            Write-Host "Resposta: $($response.Content)" -ForegroundColor Green
        } catch {
            Write-Host "❌ SERVIDOR OFFLINE!" -ForegroundColor Red
            Write-Host "Erro: $_" -ForegroundColor Red
        }
    }
    
    "5" {
        Write-Host ""
        Write-Host "🚀 MODO AUTOMATICO ATIVADO!" -ForegroundColor Cyan
        Write-Host ""
        
        # 1. Abrir Replit
        Write-Host "[1/4] Abrindo Replit..." -ForegroundColor Yellow
        Start-Process "https://replit.com"
        Start-Sleep -Seconds 2
        
        # 2. Copiar main.py
        Write-Host "[2/4] Copiando main.py..." -ForegroundColor Yellow
        Set-Clipboard -Value (Get-Content $files["main.py"] -Raw)
        Write-Host "  ✓ main.py na area de transferencia" -ForegroundColor Green
        Read-Host "  > Cole no Replit e pressione ENTER aqui"
        
        # 3. Copiar requirements.txt
        Write-Host "[3/4] Copiando requirements.txt..." -ForegroundColor Yellow
        Set-Clipboard -Value (Get-Content $files["requirements.txt"] -Raw)
        Write-Host "  ✓ requirements.txt na area de transferencia" -ForegroundColor Green
        Read-Host "  > Cole no Replit e pressione ENTER aqui"
        
        # 4. Copiar .replit
        Write-Host "[4/4] Copiando .replit..." -ForegroundColor Yellow
        Set-Clipboard -Value (Get-Content $files[".replit"] -Raw)
        Write-Host "  ✓ .replit na area de transferencia" -ForegroundColor Green
        Read-Host "  > Cole no Replit e pressione ENTER aqui"
        
        Write-Host ""
        Write-Host "✅ TODOS OS ARQUIVOS COPIADOS!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Agora no Replit:" -ForegroundColor Cyan
        Write-Host "1. Clique em STOP (se estiver rodando)" -ForegroundColor White
        Write-Host "2. Clique em RUN" -ForegroundColor White
        Write-Host "3. Aguarde ver: 'Servidor iniciado na porta 5000'" -ForegroundColor White
        Write-Host ""
        
        $test = Read-Host "Servidor reiniciou? (s/n)"
        if ($test -eq "s") {
            Write-Host ""
            Write-Host "Testando servidor..." -ForegroundColor Yellow
            Start-Sleep -Seconds 3
            try {
                $response = Invoke-WebRequest -Uri "https://9d82cbde-f257-42c0-a522-97242fdf17c9-00-3qtza34279pqe.worf.replit.dev/health" -TimeoutSec 10
                Write-Host "✅ SERVIDOR FUNCIONANDO!" -ForegroundColor Green
                Write-Host ""
                Write-Host "🎉 PRONTO! Recarregue seu site e teste o multiplayer!" -ForegroundColor Cyan
            } catch {
                Write-Host "⚠️ Servidor ainda acordando... Aguarde 10 segundos e teste novamente" -ForegroundColor Yellow
            }
        }
    }
    
    default {
        Write-Host ""
        Write-Host "Opcao invalida!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Para mais ajuda, leia:" -ForegroundColor White
Write-Host "  ATUALIZAR_REPLIT_AGORA.md" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
pause
