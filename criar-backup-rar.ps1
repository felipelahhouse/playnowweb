# ========================================
# Criar Backup WinRAR do Projeto
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BACKUP WINRAR - PlayNow Emulator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$winrarPath = "C:\Program Files\WinRAR\WinRAR.exe"
$projectPath = Get-Location
$projectName = Split-Path $projectPath -Leaf
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$backupName = "${projectName}_BACKUP_${timestamp}.rar"
$backupPath = Join-Path (Split-Path $projectPath -Parent) $backupName

Write-Host "Configuracao:" -ForegroundColor Yellow
Write-Host "  Projeto: $projectName" -ForegroundColor White
Write-Host "  Pasta origem: $projectPath" -ForegroundColor White
Write-Host "  Arquivo backup: $backupName" -ForegroundColor White
Write-Host "  Destino: $(Split-Path $projectPath -Parent)" -ForegroundColor White
Write-Host ""

# Verificar WinRAR
Write-Host "1. Verificando WinRAR..." -ForegroundColor Yellow
if (Test-Path $winrarPath) {
    Write-Host "OK - WinRAR encontrado" -ForegroundColor Green
} else {
    Write-Host "ERRO - WinRAR nao encontrado em: $winrarPath" -ForegroundColor Red
    Write-Host "Instale WinRAR em: https://www.win-rar.com/download.html" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Criar lista de exclusoes
Write-Host "2. Preparando arquivos..." -ForegroundColor Yellow
$excludeList = @(
    "node_modules"
    ".git"
    "build"
    "dist"
    ".venv"
    "venv"
    ".cache"
    "*.log"
    ".firebase"
    "__pycache__"
)

Write-Host "Pastas/arquivos que serao EXCLUIDOS (para reduzir tamanho):" -ForegroundColor Cyan
foreach ($item in $excludeList) {
    Write-Host "  - $item" -ForegroundColor Gray
}
Write-Host ""

# Criar arquivo temporario com lista de exclusoes
$excludeFile = Join-Path $env:TEMP "winrar_exclude.txt"
$excludeList | Out-File -FilePath $excludeFile -Encoding ASCII

# Criar backup RAR
Write-Host "3. Criando arquivo RAR..." -ForegroundColor Yellow
Write-Host "Isso pode levar alguns minutos..." -ForegroundColor Cyan
Write-Host ""

# Parametros WinRAR:
# a = adicionar ao arquivo
# -r = recursivo (incluir subpastas)
# -ep1 = excluir caminho base
# -m5 = compressao maxima
# -ma5 = formato RAR5
# -x@file = excluir items da lista
$arguments = @(
    "a"
    "-r"
    "-ep1"
    "-m5"
    "-ma5"
    "-x@$excludeFile"
    "`"$backupPath`""
    "`"$projectPath\*`""
)

Start-Process -FilePath $winrarPath -ArgumentList $arguments -Wait -NoNewWindow

# Remover arquivo temporario
Remove-Item $excludeFile -ErrorAction SilentlyContinue

# Verificar se backup foi criado
Write-Host ""
if (Test-Path $backupPath) {
    $fileSize = (Get-Item $backupPath).Length
    $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
    
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "BACKUP CRIADO COM SUCESSO!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Informacoes do backup:" -ForegroundColor Yellow
    Write-Host "  Nome: $backupName" -ForegroundColor White
    Write-Host "  Tamanho: $fileSizeMB MB" -ForegroundColor White
    Write-Host "  Local: $(Split-Path $backupPath -Parent)" -ForegroundColor White
    Write-Host ""
    Write-Host "Caminho completo:" -ForegroundColor Yellow
    Write-Host "  $backupPath" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Para restaurar:" -ForegroundColor Yellow
    Write-Host "  1. Extraia o arquivo .rar" -ForegroundColor White
    Write-Host "  2. Execute 'npm install' para reinstalar dependencias" -ForegroundColor White
    Write-Host ""
    
    # Perguntar se quer abrir a pasta
    $response = Read-Host "Deseja abrir a pasta do backup? (S/N)"
    if ($response -eq "S" -or $response -eq "s") {
        explorer.exe (Split-Path $backupPath -Parent)
    }
    
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "ERRO AO CRIAR BACKUP" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "O arquivo RAR nao foi criado." -ForegroundColor Red
    Write-Host "Verifique:" -ForegroundColor Yellow
    Write-Host "  - Espaco em disco disponivel" -ForegroundColor White
    Write-Host "  - Permissoes de escrita na pasta" -ForegroundColor White
    Write-Host "  - WinRAR esta funcionando corretamente" -ForegroundColor White
}
Write-Host ""
