# Verificar ROMs Disponíveis
$dbPath = "$PSScriptRoot\public\games-database.json"
$romsPath = "$PSScriptRoot\public\roms"

Write-Host "Verificando ROMs locais..." -ForegroundColor Cyan

# Carrega banco de dados
$json = Get-Content $dbPath | ConvertFrom-Json

Write-Host "Total de jogos no banco: $($json.games.Count)" -ForegroundColor Yellow

$found = 0
$missing = 0
$missingList = @()

# Verifica cada plataforma
$platforms = @('snes', 'gbc', 'genesis', 'n64', 'gba', 'ps1', 'nes')

foreach ($platform in $platforms) {
    Write-Host "Plataforma: $platform" -ForegroundColor Green
    $platformGames = $json.games | Where-Object { $_.platform -eq $platform }
    
    if ($platformGames) {
        $count = @($platformGames).Count
        Write-Host "   Total de jogos: $count"
        
        $localCount = 0
        foreach ($game in $platformGames) {
            $romFile = $game.romUrl -replace '^/', ''
            $fullPath = "$romsPath\$romFile"
            
            if (Test-Path $fullPath) {
                $localCount++
            } else {
                $missing++
                $missingList += $game.title
            }
        }
        
        $found += $localCount
        Write-Host "   OK: $localCount / $count"
    }
}

Write-Host "========================================================="  -ForegroundColor Cyan
Write-Host "RESUMO GERAL" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

Write-Host "ROMs encontradas: $found"
Write-Host "ROMs faltando: $missing"
Write-Host "Total: $($json.games.Count)"

if ($missing -gt 0 -and $missing -lt 50) {
    Write-Host "Jogos sem ROM local:" -ForegroundColor Yellow
    $missingList | ForEach-Object { 
        Write-Host "   - $_"
    }
}

Write-Host "Verificacao completa!" -ForegroundColor Green